const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type MatchInput = { index:number; name:string; league?:string; date?:string; time?:string; fixtureId?:number|null };

type ApiFixture = any;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function normalizeText(value = '') {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|fk|sk|cf|ac|afc|sc|calcio|football club|spor kulubu)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

function splitTeams(name = '') {
  const parts = name.split(/\s+(?:-|–|—|vs\.?|v)\s+/i).map(v => v.trim()).filter(Boolean);
  return parts.length >= 2 ? [parts[0], parts.slice(1).join(' ')] : ['', ''];
}

function tokenScore(a:string, b:string) {
  const x = normalizeText(a), y = normalizeText(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return .88;
  const xs = new Set(x.split(' ')), ys = new Set(y.split(' '));
  const common = [...xs].filter(t => ys.has(t)).length;
  return common / Math.max(xs.size, ys.size);
}

function matchScore(input: MatchInput, fixture: ApiFixture) {
  const [home, away] = splitTeams(input.name);
  const direct = (tokenScore(home, fixture.teams.home.name) + tokenScore(away, fixture.teams.away.name)) / 2;
  const reversed = (tokenScore(home, fixture.teams.away.name) + tokenScore(away, fixture.teams.home.name)) / 2;
  const leagueBonus = input.league && tokenScore(input.league, fixture.league?.name) > .45 ? .08 : 0;
  return Math.max(direct, reversed) + leagueBonus;
}

function apiDate(value = '') {
  let m = value.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  m = value.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  return m ? `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` : '';
}

function outputFixture(index:number, f:ApiFixture, confidence=1) {
  return {
    index,
    fixtureId: f.fixture.id,
    kickoff: f.fixture.date,
    elapsed: f.fixture.status.elapsed,
    statusShort: f.fixture.status.short,
    statusLong: f.fixture.status.long,
    leagueId: f.league?.id,
    leagueName: f.league?.name,
    homeId: f.teams.home.id,
    homeName: f.teams.home.name,
    homeLogo: f.teams.home.logo,
    awayId: f.teams.away.id,
    awayName: f.teams.away.name,
    awayLogo: f.teams.away.logo,
    goalsHome: f.goals.home,
    goalsAway: f.goals.away,
    confidence: Math.round(confidence * 100),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok:false, error:'Yalnızca POST desteklenir.' }, 405);
  try {
    const key = Deno.env.get('API_FOOTBALL_KEY');
    if (!key) return json({ ok:false, error:'API_FOOTBALL_KEY Supabase secret olarak bulunamadı.' }, 500);
    const body = await req.json();
    const matches:MatchInput[] = Array.isArray(body.matches) ? body.matches.slice(0,15) : [];
    const timezone = body.timezone || 'Europe/Istanbul';
    if (!matches.length) return json({ ok:false, error:'Maç listesi boş.' }, 400);

    const headers = { 'x-apisports-key': key };
    const byId = matches.filter(m => Number(m.fixtureId));
    const unknown = matches.filter(m => !Number(m.fixtureId));
    const apiFixtures:ApiFixture[] = [];
    let remainingDaily:string|null = null;

    if (byId.length) {
      const ids = byId.map(m => m.fixtureId).join('-');
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?ids=${ids}&timezone=${encodeURIComponent(timezone)}`, { headers });
      remainingDaily = r.headers.get('x-ratelimit-requests-remaining');
      const d = await r.json();
      if (!r.ok || d.errors && Object.keys(d.errors).length) throw new Error(JSON.stringify(d.errors || d));
      apiFixtures.push(...(d.response || []));
    }

    const dates = [...new Set(unknown.map(m => apiDate(m.date || '')).filter(Boolean))];
    for (const date of dates) {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}&timezone=${encodeURIComponent(timezone)}`, { headers });
      remainingDaily = r.headers.get('x-ratelimit-requests-remaining') || remainingDaily;
      const d = await r.json();
      if (!r.ok || d.errors && Object.keys(d.errors).length) throw new Error(JSON.stringify(d.errors || d));
      apiFixtures.push(...(d.response || []));
    }

    const unique = [...new Map(apiFixtures.map(f => [f.fixture.id, f])).values()];
    const result:any[] = [];
    for (const m of matches) {
      if (m.fixtureId) {
        const f = unique.find(x => x.fixture.id === Number(m.fixtureId));
        if (f) result.push(outputFixture(m.index, f));
        continue;
      }
      const date = apiDate(m.date || '');
      const candidates = unique.filter(f => !date || String(f.fixture.date).slice(0,10) === date);
      const ranked = candidates.map(f => ({ f, score:matchScore(m,f) })).sort((a,b)=>b.score-a.score);
      if (ranked[0] && ranked[0].score >= .58) result.push(outputFixture(m.index, ranked[0].f, Math.min(1,ranked[0].score)));
    }

    return json({ ok:true, updatedAt:new Date().toISOString(), fixtures:result, matched:result.length, quotaRemaining:remainingDaily });
  } catch (error) {
    console.error(error);
    return json({ ok:false, error:error instanceof Error ? error.message : String(error) }, 500);
  }
});
