const APP_VERSION='17.5.0';
const STORAGE_KEY='sporTotoStateV140';
const SUPABASE_URL='https://ffnggyshacjwcdbwsazd.supabase.co';
const SUPABASE_KEY='sb_publishable_oVFfgUEbWsQbpoLF1ftRLw_NOUwrKH4';
const LIVE_DURATION_MINUTES=120;
const state={prizeModel:null,matchNames:[],matchLeagues:Array(15).fill(''),matchDates:Array(15).fill(''),matchTimes:Array(15).fill(''),results:Array(15).fill(''),fixtureIds:Array(15).fill(null),liveFixtures:Array(15).fill(null),matchReports:Array(15).fill(null),liveUpdatedAt:'',columns:[],systems:[],activeSystemId:'',weekName:'Güncel Hafta',fileName:'',weekKey:'',weekFingerprint:'',cloudId:null,cloudUpdatedAt:null};
let db=null,currentUser=null,realtimeChannel=null,cloudWeeks=[],saveTimer=null,isApplyingRemote=false,currentCategory=15,currentCategoryRows={15:[],14:[],13:[],12:[],11:[]},sheetMode='category',analysisMode='live',lastChangedMatchIndex=null,previousLiveTotal=null;
const $=id=>document.getElementById(id);
const MATCHING_REPORT_OPEN_KEY='karumMatchingReportOpen';
function setMatchingReportOpen(open,remember=true){
  const panel=$('matchingReportPanel'),toggle=$('matchingReportToggle'),details=$('matchingReportDetails');
  if(!panel||!toggle||!details)return;
  panel.classList.toggle('is-collapsed',!open);
  panel.classList.toggle('is-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  details.hidden=!open;
  const hint=toggle.querySelector('.matching-report-head small');
  if(hint)hint.textContent=open?'Ayrıntıları kapatmak için tıkla':'Maç eşleşme ayrıntılarını görmek için tıkla';
  if(remember)localStorage.setItem(MATCHING_REPORT_OPEN_KEY,open?'1':'0');
}
function initMatchingReportAccordion(){
  const toggle=$('matchingReportToggle');if(!toggle)return;
  const saved=localStorage.getItem(MATCHING_REPORT_OPEN_KEY)==='1';
  setMatchingReportOpen(saved,false);
  toggle.addEventListener('click',()=>setMatchingReportOpen(toggle.getAttribute('aria-expanded')!=='true'));
}

const trUpper=v=>String(v??'').trim().toLocaleUpperCase('tr-TR');
function normalize(v){const s=trUpper(v);return s==='1'||s==='2'||s==='X'?s:''}
function cleanName(v,i){const s=String(v??'').trim();return s||`Maç ${i+1}`}
function makeSystemId(){return 'sys-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function activeSystem(){return state.systems.find(s=>s.id===state.activeSystemId)||null}
function allSystemColumns(){return state.systems.flatMap(s=>s.columns||[])}
function syncActiveSystem(){const sys=activeSystem();if(sys){sys.columns=state.columns;sys.fileName=state.fileName||sys.fileName}}
function setActiveSystem(id){syncActiveSystem();state.activeSystemId=id;if(id==='__all__'){state.columns=allSystemColumns();state.fileName='Tüm Sistemler'}else{const sys=state.systems.find(s=>s.id===id)||state.systems[0];if(sys){state.activeSystemId=sys.id;state.columns=sys.columns||[];state.fileName=sys.fileName||sys.name}}normalizeState();saveLocal();updateHeader();renderSystems();renderMatches();calculate();}
function safeStatePayload(){syncActiveSystem();return {matchNames:state.matchNames,matchLeagues:state.matchLeagues,matchDates:state.matchDates,matchTimes:state.matchTimes,results:state.results,fixtureIds:state.fixtureIds,liveFixtures:state.liveFixtures,matchReports:state.matchReports,liveUpdatedAt:state.liveUpdatedAt,systems:state.systems,activeSystemId:state.activeSystemId,weekName:state.weekName,fileName:state.fileName,weekKey:state.weekKey,weekFingerprint:state.weekFingerprint,prizeModel:state.prizeModel}}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function loadLocal(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));if(s&&(Array.isArray(s.columns)||Array.isArray(s.systems))){Object.assign(state,s);return}}catch(e){}Object.assign(state,window.INITIAL_DATA||{});state.results=Array(15).fill('');saveLocal()}
function slug(v){return String(v||'hafta').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'hafta'}
function makeWeekFingerprint(imported){const firstDate=(imported.matchDates||[]).find(Boolean)||'';return slug(`${firstDate}|${(imported.matchNames||[]).map(trUpper).join('|')}`)}
function makeWeekKey(imported){return imported.weekFingerprint||makeWeekFingerprint(imported)||slug(imported.weekName)}
function setSync(text,kind='offline'){const b=$('syncBadge');b.textContent=text;b.className=`sync-badge ${kind}`}
function updateHeader(){
  $('weekName').textContent=state.weekName||'Güncel Hafta';
  const sys=activeSystem(),all=state.activeSystemId==='__all__';
  $('fileSummary').textContent=all?'Tüm Sistemler':(sys?.name||state.fileName||'Henüz dosya seçilmedi');
  $('uploadInfo').textContent=state.systems.length?`${state.systems.length} sistem • ${state.columns.length.toLocaleString('tr-TR')} kolon • ${(state.columns.length*10).toLocaleString('tr-TR')} TL`:'Excel\'deki takım adları, tarih, saat ve kolonlar okunur.';
  $('versionBadge').textContent='v'+APP_VERSION;
}
function normalizeState(){state.matchNames=(state.matchNames||[]).slice(0,15);while(state.matchNames.length<15)state.matchNames.push('Maç '+(state.matchNames.length+1));state.matchLeagues=(state.matchLeagues||[]).map(v=>String(v??'').trim()).slice(0,15);while(state.matchLeagues.length<15)state.matchLeagues.push('');state.matchDates=(state.matchDates||[]).map(v=>String(v??'').trim()).slice(0,15);while(state.matchDates.length<15)state.matchDates.push('');state.matchTimes=(state.matchTimes||[]).map(v=>String(v??'').trim()).slice(0,15);while(state.matchTimes.length<15)state.matchTimes.push('');state.results=(state.results||[]).map(normalize).slice(0,15);while(state.results.length<15)state.results.push('');state.fixtureIds=(state.fixtureIds||[]).slice(0,15).map(v=>Number(v)||null);while(state.fixtureIds.length<15)state.fixtureIds.push(null);state.liveFixtures=(state.liveFixtures||[]).slice(0,15);while(state.liveFixtures.length<15)state.liveFixtures.push(null);state.matchReports=(state.matchReports||[]).slice(0,15);while(state.matchReports.length<15)state.matchReports.push(null);state.liveUpdatedAt=String(state.liveUpdatedAt||'');
  if(!Array.isArray(state.systems)||!state.systems.length){const legacy=(state.columns||[]).filter(c=>Array.isArray(c)&&c.length===15).map(c=>c.map(normalize));if(legacy.length)state.systems=[{id:makeSystemId(),name:state.fileName?.replace(/\.[^.]+$/,'')||'Sistem 1',fileName:state.fileName||'',columns:legacy}]}
  state.systems=(state.systems||[]).map((s,i)=>({id:s.id||makeSystemId(),name:String(s.name||`Sistem ${i+1}`).trim(),fileName:String(s.fileName||''),columns:(s.columns||[]).filter(c=>Array.isArray(c)&&c.length===15).map(c=>c.map(normalize))}));
  if(!state.activeSystemId||(state.activeSystemId!=='__all__'&&!state.systems.some(s=>s.id===state.activeSystemId)))state.activeSystemId=state.systems[0]?.id||'';
  if(state.activeSystemId==='__all__')state.columns=allSystemColumns();else{const sys=activeSystem();state.columns=sys?.columns||[];state.fileName=sys?.fileName||''}

  const defaultPrize={totalColumns:2000000,columnPrice:10,pool:0,carryOver:0,shares:{15:35,14:25,13:22,12:18},percentages:Array.from({length:15},()=>({1:34,X:33,2:33}))};
  const pm=state.prizeModel&&typeof state.prizeModel==='object'?state.prizeModel:{};
  state.prizeModel={...defaultPrize,...pm,shares:{...defaultPrize.shares,...(pm.shares||{})},percentages:Array.from({length:15},(_,i)=>{const r=pm.percentages?.[i]||defaultPrize.percentages[i];return{1:Number(r?.[1]??r?.['1']??34)||0,X:Number(r?.X??33)||0,2:Number(r?.[2]??r?.['2']??33)||0}})};
  state.weekFingerprint=state.weekFingerprint||makeWeekFingerprint(state);state.weekKey=state.weekKey||makeWeekKey(state);
}
function parseMatchDateTime(dateValue,timeValue){const date=String(dateValue||'').trim(),time=String(timeValue||'').trim();if(!date||!time)return null;let y,m,d,hit=date.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);if(hit){d=+hit[1];m=+hit[2];y=+hit[3]}else if((hit=date.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/))){y=+hit[1];m=+hit[2];d=+hit[3]}else return null;const clock=time.match(/^(\d{1,2})[:.](\d{2})/);if(!clock)return null;const hh=+clock[1],mm=+clock[2];if(hh>23||mm>59)return null;const dt=new Date(y,m-1,d,hh,mm);return Number.isNaN(dt.getTime())?null:dt}
function getMatchStatus(dateValue,timeValue,now=new Date()){const start=parseMatchDateTime(dateValue,timeValue);if(!start)return null;const diff=start-now;if(diff>0){const mins=Math.ceil(diff/60000),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),minutes=mins%60;const text=days>0?`${days} gün ${hours} saat kaldı`:hours>0?`${hours} saat ${minutes} dk kaldı`:`${Math.max(1,minutes)} dk kaldı`;return{kind:'upcoming',label:'Başlamadı',text:`⏳ ${text}`}}if(diff>=-(LIVE_DURATION_MINUTES*60000))return{kind:'live',label:'Canlı',text:'● Maç oynanıyor'};return{kind:'finished',label:'Tamamlandı',text:'Maç tamamlandı'}}
function matchStatusHtml(i){const s=getMatchStatus(state.matchDates[i],state.matchTimes[i]);return s?`<div class="match-status ${s.kind}"><span class="status-label">${s.label}</span><span class="status-text">${s.text}</span></div>`:''}
function refreshMatchStatuses(){document.querySelectorAll('.match[data-match-index]').forEach(card=>{const i=Number(card.dataset.matchIndex),slot=card.querySelector('.match-status-slot'),status=getMatchStatus(state.matchDates[i],state.matchTimes[i]);if(slot)slot.innerHTML=status?matchStatusHtml(i):'';const finished=status?.kind==='finished';card.classList.toggle('match-finished',finished)})}
function getSurvivingColumns(results=state.results){return state.columns.filter(col=>results.every((result,i)=>!result||col[i]===result))}
function getPickDistribution(matchIndex,columns=state.columns){const counts={'1':0,'X':0,'2':0};for(const col of columns){const pick=col?.[matchIndex];if(pick in counts)counts[pick]++}const total=counts['1']+counts.X+counts['2'];return {counts,total}}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}
function getAnalysisRows(columns,onlyPending=false){return state.matchNames.map((name,i)=>{const d=getPickDistribution(i,columns),entries=['1','X','2'].map(p=>({pick:p,count:d.counts[p],percent:d.total?d.counts[p]/d.total*100:0})).sort((a,b)=>b.count-a.count),max=entries[0],min=entries[2],spread=max.count-min.count,confidence=d.total?max.count/d.total*100:0;return{index:i,name:name||`Maç ${i+1}`,league:state.matchLeagues[i]||'',result:state.results[i]||'',counts:d.counts,total:d.total,entries,max,min,spread,confidence}}).filter(r=>!onlyPending||!r.result)}
function calculateLastResultImpact(liveTotal){if(lastChangedMatchIndex===null||!state.results[lastChangedMatchIndex])return null;const without=[...state.results];without[lastChangedMatchIndex]='';const before=getSurvivingColumns(without).length;return{index:lastChangedMatchIndex,before,after:liveTotal,eliminated:Math.max(0,before-liveTotal)}}
function confidenceInfo(value){if(value>=85)return{label:'Çok Güçlü',className:'very-high'};if(value>=70)return{label:'Güçlü',className:'high'};if(value>=55)return{label:'Orta',className:'medium'};if(value>=45)return{label:'Dengeli',className:'balanced'};return{label:'Çok Riskli',className:'low'}}
function animateNumber(el,value){if(!el)return;const next=Number(value)||0,prev=Number(String(el.dataset.value??el.textContent).replace(/[^0-9-]/g,''))||0;el.dataset.value=String(next);if(prev===next){el.textContent=next.toLocaleString('tr-TR');return}const start=performance.now(),duration=420;function step(now){const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3),current=Math.round(prev+(next-prev)*ease);el.textContent=current.toLocaleString('tr-TR');if(t<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
function getScenarioData(liveColumns){
  const pending=state.results.map((v,i)=>!v?i:-1).filter(i=>i>=0),groups=new Map();
  for(const col of liveColumns){const key=pending.map(i=>col[i]).join('');if(!groups.has(key))groups.set(key,{key,count:0,picks:pending.map(i=>col[i]),columnNumbers:[]});const g=groups.get(key);g.count++;if(g.columnNumbers.length<5)g.columnNumbers.push(state.columns.indexOf(col)+1)}
  const scenarios=[...groups.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
  return{pending,scenarios};
}
function renderScenarioEngine(liveColumns){
  const box=$('scenarioEngine'),summary=$('scenarioSummary'),list=$('scenarioList'),impact=$('scenarioImpactList');if(!box)return;
  const {pending,scenarios}=getScenarioData(liveColumns),total=liveColumns.length;
  $('scenarioRemainingMatches').textContent=pending.length.toLocaleString('tr-TR');$('scenarioExactColumns').textContent=total.toLocaleString('tr-TR');$('scenarioUniqueCount').textContent=scenarios.length.toLocaleString('tr-TR');
  if(!total){summary.textContent='Girilen sonuçlarla devam eden kolon kalmadığı için senaryo üretilemiyor.';list.innerHTML='';impact.innerHTML='';box.classList.add('scenario-empty');return}
  box.classList.remove('scenario-empty');
  if(!pending.length){summary.textContent=`Tüm maçlar tamamlandı. Girilen 15 sonucun tamamına uyan ${total.toLocaleString('tr-TR')} kolon bulunuyor.`;list.innerHTML='<article class="scenario-complete"><strong>Hafta tamamlandı</strong><span>Artık bekleyen maç senaryosu yok.</span></article>';impact.innerHTML='';return}
  summary.textContent=`${pending.length} maç için ${scenarios.length.toLocaleString('tr-TR')} farklı 15 bilme senaryosu kaldı. Aynı sonuç dizisini taşıyan kolonlar tek senaryoda birleştirildi.`;
  const limit=20,shown=scenarios.slice(0,limit);
  list.innerHTML=shown.map((sc,n)=>`<article class="scenario-card"><div class="scenario-card-head"><div><span>Senaryo ${n+1}</span><strong>${sc.count.toLocaleString('tr-TR')} kolon</strong></div><small>%${Math.round(sc.count/total*100)} pay</small></div><div class="scenario-picks">${pending.map((mi,j)=>`<span title="${escapeHtml(state.matchNames[mi])}"><b>${mi+1}</b>${sc.picks[j]}</span>`).join('')}</div></article>`).join('')+(scenarios.length>limit?`<p class="scenario-more">İlk ${limit} senaryo gösteriliyor. Ayrıca ${(scenarios.length-limit).toLocaleString('tr-TR')} senaryo daha var.</p>`:'');
  impact.innerHTML=pending.map(mi=>{const d=getPickDistribution(mi,liveColumns);return`<article class="scenario-impact-card"><div class="scenario-impact-title"><span>${mi+1}. Maç</span><div><strong>${escapeHtml(state.matchNames[mi])}</strong>${state.matchLeagues[mi]?`<small>${escapeHtml(state.matchLeagues[mi])}</small>`:''}</div></div><div class="scenario-outcomes">${['1','X','2'].map(p=>{const count=d.counts[p],pct=total?Math.round(count/total*100):0;return`<div class="scenario-outcome"><b>${p}</b><strong>${count.toLocaleString('tr-TR')}</strong><small>15 devam • %${pct}</small></div>`}).join('')}</div></article>`}).join('');
}
function renderSmartDecisionAnalysis(liveColumns){
  const panel=$('smartDecisionPanel'),headline=$('smartHeadline'),summary=$('smartSummary'),cards=$('smartDecisionCards'),path=$('smartBestPath'),scenarioBox=$('smartTopScenarios');
  if(!panel||!headline||!summary||!cards||!path||!scenarioBox)return;
  const total=liveColumns.length,{pending,scenarios}=getScenarioData(liveColumns);
  if(!total){panel.classList.add('smart-empty');headline.textContent='Devam eden kolon yok';summary.textContent='Girilen sonuçlardan biri bütün kolonları elemiş durumda. Bir sonucu geri aldığında karar analizi yeniden oluşur.';cards.innerHTML='';path.innerHTML='';scenarioBox.innerHTML='';return}
  panel.classList.remove('smart-empty');
  if(!pending.length){headline.textContent='Hafta tamamlandı';summary.textContent=`Girilen 15 sonucun tamamına uyan ${total.toLocaleString('tr-TR')} kolon bulunuyor.`;cards.innerHTML='<article><span>Durum</span><strong>Tamamlandı</strong><small>Bekleyen maç kalmadı</small></article>';path.innerHTML='';scenarioBox.innerHTML='';return}
  const matches=pending.map(mi=>{const d=getPickDistribution(mi,liveColumns),items=['1','X','2'].map(p=>({pick:p,count:d.counts[p],pct:total?d.counts[p]/total*100:0})).sort((a,b)=>b.count-a.count);const top=items[0],second=items[1],spread=top.count-second.count;return{mi,items,top,second,spread,confidence:top.pct}});
  const critical=[...matches].sort((a,b)=>a.spread-b.spread||a.confidence-b.confidence)[0];
  const strongest=[...matches].sort((a,b)=>b.top.count-a.top.count||b.confidence-a.confidence)[0];
  const topScenario=scenarios[0],topShare=topScenario?topScenario.count/total*100:0;
  const concentrated=matches.filter(m=>m.confidence>=70).length;
  headline.textContent=`${total.toLocaleString('tr-TR')} kolon için canlı karar özeti`;
  summary.textContent=`Bu bölüm dışarıdan maç tahmini yapmaz; yalnızca hâlâ yaşayan kolonların dağılımını yorumlar. Şu anda ${pending.length} maç ve ${scenarios.length.toLocaleString('tr-TR')} farklı 15 bilme yolu kaldı.`;
  cards.innerHTML=`<article class="smart-card critical"><span>En Kritik Maç</span><strong>${critical.mi+1}. Maç</strong><small>${escapeHtml(state.matchNames[critical.mi])}<br>${critical.top.pick}: ${critical.top.count.toLocaleString('tr-TR')} • ${critical.second.pick}: ${critical.second.count.toLocaleString('tr-TR')}</small></article><article class="smart-card advantage"><span>En Avantajlı Sonuç</span><strong>${strongest.mi+1}. Maç → ${strongest.top.pick}</strong><small>Bu sonuç gelirse ${strongest.top.count.toLocaleString('tr-TR')} kolon 15 devam eder.</small></article><article class="smart-card"><span>En Güçlü Senaryo</span><strong>%${Math.round(topShare)} pay</strong><small>${topScenario?`${topScenario.count.toLocaleString('tr-TR')} kolon aynı yolu taşıyor.`:'Senaryo yok'}</small></article><article class="smart-card"><span>Yoğunlaşan Maç</span><strong>${concentrated}</strong><small>%70 ve üzeri tek sonuç ağırlığı bulunan bekleyen maç.</small></article>`;
  const recommended=[...matches].sort((a,b)=>b.confidence-a.confidence).slice(0,Math.min(5,matches.length));
  path.innerHTML=`<div class="smart-path-head"><div><span>Kolonlara göre en güçlü yol</span><strong>En yüksek yaşayan kolon sayısını koruyan seçimler</strong></div><small>Tahmin değil, kolon yoğunluğu</small></div><div class="smart-path-picks">${recommended.map(m=>`<article><b>${m.mi+1}</b><strong>${m.top.pick}</strong><span>${m.top.count.toLocaleString('tr-TR')} kolon</span><small>%${Math.round(m.confidence)}</small></article>`).join('')}</div>`;
  const topThree=scenarios.slice(0,3);
  scenarioBox.innerHTML=`<div class="smart-path-head"><div><span>Öne çıkan 15 senaryoları</span><strong>En fazla kolonda tekrar eden sonuç dizileri</strong></div><small>İlk 3 yol</small></div><div class="smart-scenario-grid">${topThree.map((sc,i)=>`<article><div><span>#${i+1}</span><strong>${sc.count.toLocaleString('tr-TR')} kolon</strong><small>%${Math.round(sc.count/total*100)} pay</small></div><p>${pending.map((mi,j)=>`<b title="${escapeHtml(state.matchNames[mi])}">${mi+1}<em>${sc.picks[j]}</em></b>`).join('')}</p></article>`).join('')}</div>`;
}
function setAnalysisMode(mode){analysisMode=mode==='all'?'all':'live';document.querySelectorAll('.analysis-mode-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===analysisMode));renderAnalysis()}
function renderAnalysis(){
  const empty=$('analysisEmpty'),content=$('analysisContent'),allTotal=state.columns.length,entered=state.results.filter(Boolean).length;
  const liveColumns=getSurvivingColumns(),liveTotal=liveColumns.length,eliminated=allTotal-liveTotal,survivalRate=allTotal?liveTotal/allTotal*100:0;
  const isLive=analysisMode==='live',sourceColumns=isLive?liveColumns:state.columns,total=sourceColumns.length;
  $('analysisTotalBadge').textContent=isLive?`${liveTotal.toLocaleString('tr-TR')} kalan`:`${allTotal.toLocaleString('tr-TR')} kolon`;
  $('analysisSubtitle').textContent=state.fileName?(isLive?`${entered} sonuç girildi • Kalan kolonlar anlık analiz ediliyor.`:`${state.weekName} • Başlangıçtaki bütün kolonlar analiz ediliyor.`):'Excel yüklediğinde 15 maç ve bütün kolonlar burada analiz edilir.';
  $('analysisLiveStatus').classList.toggle('hidden',!allTotal);
  if(allTotal){animateNumber($('liveStart'),allTotal);animateNumber($('liveRemaining'),liveTotal);animateNumber($('liveEliminated'),eliminated);$('liveRate').textContent=`%${survivalRate.toFixed(1).replace('.',',')}`;const impact=calculateLastResultImpact(liveTotal),banner=$('analysisImpactBanner');if(impact&&impact.before!==impact.after){banner.classList.remove('hidden');$('impactMatch').textContent=`${impact.index+1}. maç sonucu`;$('impactFlow').textContent=`${impact.before.toLocaleString('tr-TR')} → ${impact.after.toLocaleString('tr-TR')}`;$('impactEliminated').textContent=`${impact.eliminated.toLocaleString('tr-TR')} kolon elendi`;banner.classList.remove('positive');banner.classList.add('changed')}else{banner.classList.add('hidden');banner.classList.remove('changed')}previousLiveTotal=liveTotal;}
  if(!allTotal){empty.classList.remove('hidden');content.classList.add('hidden');return}
  empty.classList.add('hidden');content.classList.remove('hidden');
  renderSmartDecisionAnalysis(liveColumns);
  renderScenarioEngine(liveColumns);
  const pendingOnly=isLive&&entered>0,rows=getAnalysisRows(sourceColumns,pendingOnly);
  $('analysisHeatTitle').textContent=isLive?'Kalan Maçlarda Canlı 1 / X / 2 Dağılımı':'15 Maçta Başlangıç 1 / X / 2 Dağılımı';
  $('analysisHeatNote').textContent=isLive?'Yüzdeler yalnızca hâlâ devam eden kolonlara göredir. Sonuçlanan maçlar listeden çıkarılır.':'Yüzdeler yüklenen bütün kolonlara göredir.';
  $('aTotalLabel').textContent=isLive?'Kalan Kolon':'Toplam Kolon';$('aTotal').textContent=total.toLocaleString('tr-TR');$('aTotalMeta').textContent=isLive?`${eliminated.toLocaleString('tr-TR')} kolon elendi`:'Başlangıç analizi';
  if(!total){$('aTopPick').textContent='-';$('aTopPickMeta').textContent='Devam eden kolon kalmadı';$('aSafestNo').textContent='-';$('aSafestMeta').textContent='-';$('aRiskiestNo').textContent='-';$('aRiskiestMeta').textContent='-';$('analysisInsights').innerHTML='<article class="analysis-zero"><span class="insight-icon risk">!</span><div><strong>Devam eden kolon kalmadı</strong><p>Girilen sonuçlardan en az biri yüklenen bütün kolonları elemiş durumda. Sonucu geri alırsan analiz otomatik yeniden hesaplanır.</p></div></article>';$('analysisMatchList').innerHTML='';return}
  if(!rows.length){$('aTopPick').textContent='✓';$('aTopPickMeta').textContent='Bütün maçlar sonuçlandı';$('aSafestNo').textContent='-';$('aSafestMeta').textContent='Bekleyen maç yok';$('aRiskiestNo').textContent='-';$('aRiskiestMeta').textContent='Bekleyen maç yok';$('analysisInsights').innerHTML='<article><span class="insight-icon">✓</span><div><strong>Hafta tamamlandı</strong><p>Girilen sonuçlarla eşleşen kolon sayısı yukarıda gösteriliyor.</p></div></article>';$('analysisMatchList').innerHTML='';return}
  const safe=[...rows].sort((a,b)=>b.confidence-a.confidence)[0],risky=[...rows].sort((a,b)=>a.confidence-b.confidence||a.spread-b.spread)[0],overall={'1':0,'X':0,'2':0};rows.forEach(r=>['1','X','2'].forEach(p=>overall[p]+=r.counts[p]));const topPick=Object.entries(overall).sort((a,b)=>b[1]-a[1])[0],allPicks=total*rows.length;
  $('aTopPick').textContent=topPick[0];$('aTopPickMeta').textContent=`${topPick[1].toLocaleString('tr-TR')} seçim • %${Math.round(topPick[1]/allPicks*100)}`;$('aSafestNo').textContent=`${safe.index+1}. Maç`;$('aSafestMeta').textContent=`${safe.max.pick} seçimi %${Math.round(safe.confidence)}`;$('aRiskiestNo').textContent=`${risky.index+1}. Maç`;$('aRiskiestMeta').textContent=`En yüksek seçim yalnızca %${Math.round(risky.confidence)}`;
  const nearSingles=rows.filter(r=>r.confidence>=85),balanced=rows.filter(r=>r.confidence<45),closeCalls=rows.filter(r=>r.max.count-r.entries[1].count<=Math.max(3,total*.03)),impact=isLive?calculateLastResultImpact(liveTotal):null;
  const insightItems=[];
  if(isLive)insightItems.push(`<article><span class="insight-icon live-dot">●</span><div><strong>${liveTotal.toLocaleString('tr-TR')} kolon hâlâ devam ediyor</strong><p>Başlangıçtaki ${allTotal.toLocaleString('tr-TR')} kolonun %${survivalRate.toFixed(1).replace('.',',')}’i kaldı; ${eliminated.toLocaleString('tr-TR')} kolon elendi.</p></div></article>`);
  if(impact)insightItems.push(`<article><span class="insight-icon risk">−</span><div><strong>Son seçim ${impact.eliminated.toLocaleString('tr-TR')} kolon eledi</strong><p>${impact.index+1}. maç sonucu girilmeden önce ${impact.before.toLocaleString('tr-TR')} kolon vardı, şimdi ${impact.after.toLocaleString('tr-TR')} kolon kaldı.</p></div></article>`);
  insightItems.push(`<article><span class="insight-icon">✓</span><div><strong>${safe.index+1}. maç en net dağılıma sahip</strong><p>${escapeHtml(safe.name)} maçında ${isLive?'kalan ':''}kolonların %${Math.round(safe.confidence)}’i <b>${safe.max.pick}</b> seçmiş.</p></div></article>`,`<article><span class="insight-icon risk">!</span><div><strong>${risky.index+1}. maç en belirsiz maç</strong><p>${escapeHtml(risky.name)} maçında seçimler birbirine yakın; en yüksek oran %${Math.round(risky.confidence)}.</p></div></article>`,`<article><span class="insight-icon">#</span><div><strong>${nearSingles.length} maçta güçlü yoğunlaşma var</strong><p>%85 ve üzeri tek sonuç yoğunluğu bulunan bekleyen maç sayısı.</p></div></article>`,`<article><span class="insight-icon risk">≈</span><div><strong>${balanced.length} maç tamamen dengeli</strong><p>Hiçbir sonucun %45’i aşamadığı maç sayısı. Yakın ikili yarış bulunan maç: ${closeCalls.length}.</p></div></article>`);
  $('analysisInsights').innerHTML=insightItems.join('');
  $('analysisMatchList').innerHTML=rows.map(r=>{const ci=confidenceInfo(r.confidence),base=getPickDistribution(r.index,state.columns);return`<article class="analysis-match-row"><div class="analysis-match-top"><span class="analysis-match-number">${r.index+1}</span><div><strong>${escapeHtml(r.name)}</strong>${r.league?`<small>${escapeHtml(r.league)}</small>`:''}</div><span class="confidence-badge ${ci.className}"><b>%${Math.round(r.confidence)}</b><small>${ci.label}</small></span></div><div class="heat-grid">${['1','X','2'].map(p=>{const pct=r.total?r.counts[p]/r.total*100:0,basePct=base.total?base.counts[p]/base.total*100:0,delta=pct-basePct,deltaHtml=isLive&&entered>0?`<em class="heat-delta ${delta>0.5?'up':delta<-.5?'down':'flat'}">${delta>0?'+':''}${Math.round(delta)} puan</em>`:'';return`<div class="heat-item"><div class="heat-label"><b>${p}</b><span>${r.counts[p].toLocaleString('tr-TR')} • %${Math.round(pct)} ${deltaHtml}</span></div><div class="heat-track pick-${p==='X'?'x':p}"><span style="width:${pct.toFixed(1)}%"></span>${isLive&&entered>0?`<i style="left:${Math.min(100,basePct).toFixed(1)}%" title="Başlangıç %${Math.round(basePct)}"></i>`:''}</div></div>`}).join('')}</div><div class="confidence-explanation"><span>Güven endeksi</span><strong>${ci.label}</strong><small>En yoğun seçim: ${r.max.pick} (%${Math.round(r.confidence)})</small></div></article>`}).join('')
}
let karumZekaData=null,karumZekaJobToken=0;
function getDegreeCapableColumns(results=state.results){
  const out={15:0,14:0,13:0,12:0};
  for(const col of state.columns){
    let wrong=0;for(let i=0;i<15;i++)if(results[i]&&col[i]!==results[i])wrong++;
    if(wrong<=0)out[15]++;if(wrong<=1)out[14]++;if(wrong<=2)out[13]++;if(wrong<=3)out[12]++;
  }
  return out;
}
function buildKarumPaths(live,pending){
  const groups=new Map();
  for(const col of live){const picks=pending.map(i=>col[i]);const key=picks.join('');const item=groups.get(key)||{key,picks,count:0};item.count++;groups.set(key,item)}
  return [...groups.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
}
function pctText(count,total){return total?formatProbability(count/total*100):'%0'}
function buildKarumNarrative(data){
  const {entered,remaining,live,eliminated,coverage,critical,guaranteed}=data;
  if(!remaining)return `Hafta tamamlandı. ${live.length.toLocaleString('tr-TR')} kolon 15 bildi. En yüksek kesin derece ${guaranteed||'belirlenemedi'}.`;
  if(!live.length){const g=guaranteed?` Buna rağmen kalan bütün senaryolarda en az ${guaranteed} bilme kapsamı garanti.`:'';return `${entered} maç tamamlandı ve 15 bilme ihtimali sona erdi.${g} Karum Zeka, 14+, 13+ ve 12+ yollarını izlemeye devam ediyor.`}
  const top=critical[0];const danger=top?.outcomes.filter(o=>o.count15===0).map(o=>o.pick);
  let text=`${entered} maç sonuçlandı, ${remaining} maç kaldı. ${live.length.toLocaleString('tr-TR')} kolon 15 yolunda devam ediyor; ${eliminated.toLocaleString('tr-TR')} kolon elendi. `;
  text+=`${coverage.counts[15].toLocaleString('tr-TR')} farklı kalan sonuç dizisinde en az bir kolon 15 biliyor.`;
  if(top)text+=` En kritik karşılaşma ${top.index+1}. maç: ${state.matchNames[top.index]}.`;
  if(danger?.length)text+=` Bu maçta ${danger.join(' veya ')} sonucu 15 ihtimalini bitiriyor.`;
  if(guaranteed)text+=` Şu anda en az ${guaranteed} bilme matematiksel olarak garanti.`;
  return text;
}
function answerKarumQuestion(raw){
  const d=karumZekaData;if(!d)return 'Önce kolon içeren bir Excel yüklenmeli.';
  const q=trUpper(raw).replace(/[İI]/g,'I');
  if(q.includes('15')&&(q.includes('GEREK')||q.includes('NASIL')||q.includes('YOL'))){
    if(!d.live.length)return '15 bilme ihtimali artık kalmadı.';
    if(!d.pending.length)return `${d.live.length.toLocaleString('tr-TR')} kolon 15 bildi; hafta tamamlandı.`;
    const shown=d.paths.slice(0,3).map((p,n)=>`${n+1}. yol: ${d.pending.map((mi,j)=>`${mi+1}. maç ${p.picks[j]}`).join(', ')} (${p.count} kolon)`).join('\n');
    return `15’i yaşatan ${d.paths.length.toLocaleString('tr-TR')} farklı yol var. En güçlü yollar:\n${shown}`;
  }
  if(q.includes('14')&&(q.includes('GARANTI')||q.includes('KESIN'))){return d.coverage.counts[14]===d.coverage.totalScenarios?'Evet. Kalan bütün senaryolarda en az bir kolon 14 veya üzeri biliyor; 14+ garanti.':`Hayır. 14+ henüz garanti değil. ${d.coverage.counts[14].toLocaleString('tr-TR')} / ${d.coverage.totalScenarios.toLocaleString('tr-TR')} senaryoda 14+ var (${pctText(d.coverage.counts[14],d.coverage.totalScenarios)}).`}
  if(q.includes('13')&&(q.includes('GARANTI')||q.includes('KESIN'))){return d.coverage.counts[13]===d.coverage.totalScenarios?'Evet, 13+ garanti.':`13+ henüz garanti değil; kapsama ${pctText(d.coverage.counts[13],d.coverage.totalScenarios)}.`}
  if(q.includes('12')&&(q.includes('GARANTI')||q.includes('KESIN'))){return d.coverage.counts[12]===d.coverage.totalScenarios?'Evet, 12+ garanti.':`12+ henüz garanti değil; kapsama ${pctText(d.coverage.counts[12],d.coverage.totalScenarios)}.`}
  if(q.includes('KRITIK')||q.includes('TEHLIKE')||q.includes('RISK')){
    const c=d.critical[0];if(!c)return 'Bekleyen maç olmadığı için kritik maç yok.';
    return `En kritik maç ${c.index+1}. maç: ${state.matchNames[c.index]}. 1 gelirse ${c.outcomes.find(x=>x.pick==='1').count15}, X gelirse ${c.outcomes.find(x=>x.pick==='X').count15}, 2 gelirse ${c.outcomes.find(x=>x.pick==='2').count15} kolon 15 yolunda kalır.`;
  }
  if(q.includes('BITIR')||q.includes('SONA')||q.includes('ELER')){
    const hits=[];for(const c of d.critical)for(const o of c.outcomes)if(o.count15===0)hits.push(`${c.index+1}. maç ${o.pick}`);
    return hits.length?`15’i doğrudan bitiren görünen sonuçlar: ${hits.slice(0,8).join(', ')}${hits.length>8?'…':''}.`:'İncelenen bekleyen maçlarda tek başına 15’i tamamen bitiren bir sonuç görünmüyor.';
  }
  if(q.includes('KAC')&&(q.includes('KOLON')||q.includes('DEVAM'))){return `15 için ${d.live.length.toLocaleString('tr-TR')}, 14+ için ${d.capable[14].toLocaleString('tr-TR')}, 13+ için ${d.capable[13].toLocaleString('tr-TR')}, 12+ için ${d.capable[12].toLocaleString('tr-TR')} kolon hâlâ derece yapabilir.`}
  return `Şu an ${d.entered} maç sonuçlandı, ${d.remaining} maç kaldı. “15 için ne gerekiyor?”, “14 garanti mi?”, “en kritik maç hangisi?” veya “hangi sonuç 15’i bitirir?” diye sorabilirsin.`;
}
function bindKarumQuestions(){
  document.querySelectorAll('[data-kz-question]').forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.onclick=()=>{const input=$('kzQuestionInput');if(input)input.value=btn.dataset.kzQuestion;showKarumAnswer(btn.dataset.kzQuestion)}});
  const form=$('kzQuestionForm');if(form&&!form.dataset.bound){form.dataset.bound='1';form.onsubmit=e=>{e.preventDefault();const q=$('kzQuestionInput').value.trim();if(q)showKarumAnswer(q)}}
}
function showKarumAnswer(q){const box=$('kzAnswer');if(!box)return;box.innerHTML=`<span>✦</span><div><strong>${escapeHtml(q)}</strong><p>${escapeHtml(answerKarumQuestion(q)).replace(/\n/g,'<br>')}</p></div>`}

function money(v){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(v)||0)}
function compactNumber(v){const n=Number(v)||0;if(n<1&&n>0)return n.toLocaleString('tr-TR',{maximumFractionDigits:2});return n.toLocaleString('tr-TR',{maximumFractionDigits:n<100?1:0})}
function prizeRowValid(r){return Math.abs((Number(r?.[1])||0)+(Number(r?.X)||0)+(Number(r?.[2])||0)-100)<0.01}
function prizeModelValid(){const pm=state.prizeModel;return !!pm&&Number(pm.totalColumns)>0&&pm.percentages.every(prizeRowValid)}
function poissonWrongDistribution(correctProbabilities){let d=[1];for(const pc0 of correctProbabilities){const pc=Math.max(0,Math.min(1,Number(pc0)||0)),pw=1-pc,next=Array(d.length+1).fill(0);for(let i=0;i<d.length;i++){next[i]+=d[i]*pc;next[i+1]+=d[i]*pw}d=next}return d}
function calculatePrizeEstimate(resultsOverride=state.results){const pm=state.prizeModel||{};const percentages=pm.percentages||[];const correct=[];let enteredProbability=1,entered=0,surpriseTotal=0;for(let i=0;i<15;i++){const r=percentages[i]||{1:34,X:33,2:33};const vals=['1','X','2'].map(k=>(Number(r[k])||0)/100);if(resultsOverride[i]){const p=(Number(r[resultsOverride[i]])||0)/100;correct.push(p);enteredProbability*=p;surpriseTotal+=1-p;entered++}else correct.push(vals.reduce((a,p)=>a+p*p,0))}const dist=poissonWrongDistribution(correct),total=Number(pm.totalColumns)||0,counts={15:total*(dist[0]||0),14:total*(dist[1]||0),13:total*(dist[2]||0),12:total*(dist[3]||0)};const pool=(Number(pm.pool)||0)+(Number(pm.carryOver)||0),shares=pm.shares||{};const prizes={};for(const k of [15,14,13,12]){const degreePool=pool*((Number(shares[k])||0)/100),w=Math.max(counts[k],0.25),mid=degreePool/w;prizes[k]={mid,low:mid*.78,high:mid*1.28,pool:degreePool}}const surprise=entered?Math.round(surpriseTotal/entered*100):0;const validRows=percentages.filter(prizeRowValid).length;const confidence=Math.round(Math.min(100,(validRows/15*55)+(entered/15*45)));return{entered,remaining:15-entered,enteredProbability,alive:total*enteredProbability,dist,counts,prizes,pool,surprise,confidence,validRows}}
function buildPrizeNarrative(d){if(!prizeModelValid())return 'Hesaplama için toplam kolon sayısını ve her maçta toplamı %100 olan 1-X-2 yüzdelerini gir.';if(!d.entered)return 'Henüz maç sonucu girilmedi. Model, oynanma yüzdelerine göre hafta sonu beklenen derece dağılımını gösteriyor.';const level=d.surprise>=65?'yüksek':d.surprise>=45?'orta':'düşük';const direction=d.surprise>=65?'yukarı':d.surprise<35?'aşağı':'dengeli';return `${d.entered} maç sonunda sonuçların sürpriz seviyesi ${level}. Bu sonuç dizisini Türkiye genelinde yaklaşık ${compactNumber(d.alive)} kolonun bilmiş olması bekleniyor. Mevcut tablo 15 ikramiyesini ${direction} yönlü etkiliyor.`}
function renderPrizePercentRows(){const box=$('prizePercentRows');if(!box)return;box.innerHTML=state.matchNames.map((name,i)=>{const r=state.prizeModel.percentages[i],sum=(Number(r[1])||0)+(Number(r.X)||0)+(Number(r[2])||0);return `<div class="prize-percent-row ${Math.abs(sum-100)<.01?'valid':'invalid'}" data-index="${i}"><div class="prize-match-name"><span>${i+1}</span><strong>${escapeHtml(name||`Maç ${i+1}`)}</strong></div><label>1<input data-pick="1" type="number" min="0" max="100" step="0.1" value="${r[1]}"></label><label>X<input data-pick="X" type="number" min="0" max="100" step="0.1" value="${r.X}"></label><label>2<input data-pick="2" type="number" min="0" max="100" step="0.1" value="${r[2]}"></label><b class="prize-row-total">${sum.toLocaleString('tr-TR',{maximumFractionDigits:1})}%</b></div>`}).join('');box.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{const row=inp.closest('.prize-percent-row'),i=Number(row.dataset.index),pick=inp.dataset.pick;state.prizeModel.percentages[i][pick]=Number(inp.value)||0;const r=state.prizeModel.percentages[i],sum=r[1]+r.X+r[2];row.querySelector('.prize-row-total').textContent=sum.toLocaleString('tr-TR',{maximumFractionDigits:1})+'%';row.classList.toggle('valid',Math.abs(sum-100)<.01);row.classList.toggle('invalid',Math.abs(sum-100)>=.01);updatePrizeValidation()}))}
function updatePrizeValidation(){const el=$('prizeValidationText');if(!el)return;const bad=state.prizeModel.percentages.filter(r=>!prizeRowValid(r)).length;el.textContent=bad?`${bad} maçta yüzde toplamı 100 değil.`:'Tüm maç yüzdeleri geçerli.';el.className=bad?'error':'ok'}
function fillPrizeInputs(){const pm=state.prizeModel;if(!pm)return;$('prizeInputColumns').value=pm.totalColumns;$('prizeInputPrice').value=pm.columnPrice;$('prizeInputPool').value=pm.pool;$('prizeInputCarry').value=pm.carryOver;for(const k of [15,14,13,12])$('prizeShare'+k).value=pm.shares[k];renderPrizePercentRows();updatePrizeValidation()}
function renderPrizeEstimate(){if(!$('prizeEstimatePanel'))return;const d=calculatePrizeEstimate();$('prizeModelStatus').textContent=prizeModelValid()?'MODEL AKTİF':'VERİ EKSİK';$('prizeModelStatus').classList.toggle('ready',prizeModelValid());$('prizeTotalColumns').textContent=(Number(state.prizeModel.totalColumns)||0).toLocaleString('tr-TR');$('prizeTurnover').textContent=money((Number(state.prizeModel.totalColumns)||0)*(Number(state.prizeModel.columnPrice)||0));$('prizeSurprise').textContent=`${d.surprise} / 100`;$('prizeConfidence').textContent=`${d.confidence}%`;$('prizeAliveEstimate').textContent=compactNumber(d.alive);$('prizeAliveMeta').textContent=d.entered?`${d.entered} sonucu birlikte bilen tahmini kolon`:'Henüz sonuç girilmedi';$('prizeNarrative').textContent=buildPrizeNarrative(d);$('prizeDegreeCards').innerHTML=[15,14,13,12].map(k=>{const c=d.counts[k],p=d.prizes[k];return `<article><div><span>${k} bilen</span><em>Tahmini kazanan</em></div><strong>${compactNumber(c)}</strong><small>${money(p.low)} – ${money(p.high)}</small><p>Kişi başı tahmini ikramiye</p></article>`}).join('');const pending=state.results.map((v,i)=>!v?i:-1).filter(i=>i>=0),select=$('prizeImpactMatch');select.innerHTML=pending.map(i=>`<option value="${i}">${i+1}. ${escapeHtml(state.matchNames[i]||'Maç')}</option>`).join('')||'<option value="">Maç kalmadı</option>';if(select.dataset.selected&&pending.includes(Number(select.dataset.selected)))select.value=select.dataset.selected;renderPrizeImpact();}
function renderPrizeImpact(){const box=$('prizeImpactGrid'),sel=$('prizeImpactMatch');if(!box||!sel)return;const i=Number(sel.value);if(!Number.isInteger(i)){box.innerHTML='<div class="kz-empty-mini">Bekleyen maç kalmadı.</div>';return}sel.dataset.selected=String(i);box.innerHTML=['1','X','2'].map(pick=>{const next=state.results.slice();next[i]=pick;const d=calculatePrizeEstimate(next),est=d.counts[15],pr=d.prizes[15];return `<article><b>${pick}</b><strong>${compactNumber(est)}</strong><small>tahmini 15 kazananı</small><em>${money(pr.low)} – ${money(pr.high)}</em></article>`}).join('')}
function bindPrizeModel(){document.querySelectorAll('.prize-tab').forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.onclick=()=>{document.querySelectorAll('.prize-tab').forEach(b=>b.classList.toggle('active',b===btn));$('prizeSummaryTab').classList.toggle('hidden',btn.dataset.prizeTab!=='summary');$('prizeSettingsTab').classList.toggle('hidden',btn.dataset.prizeTab!=='settings');if(btn.dataset.prizeTab==='settings')fillPrizeInputs()}});$('prizeImpactMatch')?.addEventListener('change',renderPrizeImpact);const form=$('prizeSettingsForm');if(form&&!form.dataset.bound){form.dataset.bound='1';form.onsubmit=e=>{e.preventDefault();const pm=state.prizeModel;pm.totalColumns=Number($('prizeInputColumns').value)||0;pm.columnPrice=Number($('prizeInputPrice').value)||0;pm.pool=Number($('prizeInputPool').value)||0;pm.carryOver=Number($('prizeInputCarry').value)||0;for(const k of [15,14,13,12])pm.shares[k]=Number($('prizeShare'+k).value)||0;if(!pm.percentages.every(prizeRowValid)){updatePrizeValidation();alert('Her maç için 1-X-2 yüzdelerinin toplamı 100 olmalı.');return}saveLocal();queueCloudSave();renderPrizeEstimate();document.querySelector('.prize-tab[data-prize-tab="summary"]').click()};$('prizeEqualFill').onclick=()=>{state.prizeModel.percentages=Array.from({length:15},()=>({1:34,X:33,2:33}));renderPrizePercentRows();updatePrizeValidation()}}}

function renderKarumZeka(){
  const total=state.columns.length,entered=state.results.filter(Boolean).length,remaining=15-entered;
  const live=getSurvivingColumns(),eliminated=Math.max(0,total-live.length),pending=state.results.map((v,i)=>!v?i:-1).filter(i=>i>=0);
  const badge=$('kzStatusBadge'),empty=$('kzEmpty'),content=$('kzContent');if(!badge||!empty||!content)return;
  badge.textContent=total?(remaining?'CANLI HAZIR':'HAFTA TAMAMLANDI'):'VERİ BEKLİYOR';badge.classList.toggle('ready',!!total);
  if(!total){empty.classList.remove('hidden');content.classList.remove('hidden');karumZekaData=null;renderPrizeEstimate();bindPrizeModel();return}
  empty.classList.add('hidden');content.classList.remove('hidden');
  $('kzPlayed').textContent=entered;$('kzRemaining').textContent=remaining;$('kzAlive15').textContent=live.length.toLocaleString('tr-TR');$('kzEliminated').textContent=eliminated.toLocaleString('tr-TR');$('kzWeekName').textContent=state.weekName||'Güncel Hafta';
  $('kzScenarioTotal').textContent='Kesin hesap yapılıyor…';
  const token=++karumZekaJobToken,columns=state.columns.map(c=>c.slice()),results=state.results.slice();
  setTimeout(()=>{
    if(token!==karumZekaJobToken)return;
    const coverage=buildCoverageMap(columns,results),capable=getDegreeCapableColumns(results),paths=buildKarumPaths(live,pending);
    const critical=pending.map(index=>{const outcomes=['1','X','2'].map(pick=>{const next=results.slice();next[index]=pick;const caps=getDegreeCapableColumns(next);return{pick,count15:caps[15],count14:caps[14],count13:caps[13],count12:caps[12]}});const values=outcomes.map(o=>o.count15);return{index,outcomes,spread:Math.max(...values)-Math.min(...values),min:Math.min(...values)}}).sort((a,b)=>b.spread-a.spread||a.min-b.min).slice(0,5);
    let guaranteed=0;for(const k of [15,14,13,12])if(coverage.counts[k]===coverage.totalScenarios){guaranteed=k;break}
    karumZekaData={total,entered,remaining,live,eliminated,pending,coverage,capable,paths,critical,guaranteed};
    $('kzNarrative').textContent=buildKarumNarrative(karumZekaData);
    $('kzScenarioTotal').textContent=`${coverage.totalScenarios.toLocaleString('tr-TR')} kalan senaryo`;
    $('kzDegreeGrid').innerHTML=[15,14,13,12].map(k=>{const c=coverage.counts[k],guarantee=c===coverage.totalScenarios;return`<article class="${guarantee?'guaranteed':''}"><div><span>${k}${k<15?'+':''}</span><em>${guarantee?'GARANTİ':'KAPSAMA'}</em></div><strong>${pctText(c,coverage.totalScenarios)}</strong><small>${c.toLocaleString('tr-TR')} / ${coverage.totalScenarios.toLocaleString('tr-TR')} senaryo</small><p>${capable[k].toLocaleString('tr-TR')} kolon hâlâ bu dereceyi yapabilir</p></article>`}).join('');
    $('kzGuaranteeList').innerHTML=[15,14,13,12].map(k=>{const yes=coverage.counts[k]===coverage.totalScenarios;return`<article class="${yes?'yes':'no'}"><span>${yes?'✓':'×'}</span><div><strong>${k}${k<15?'+':''} ${yes?'garanti':'henüz garanti değil'}</strong><small>${yes?'Kalan bütün sonuç dizilerinde en az bir kolon bu dereceye ulaşıyor.':`${(coverage.totalScenarios-coverage.counts[k]).toLocaleString('tr-TR')} senaryoda bu derece bulunmuyor.`}</small></div></article>`}).join('');
    const warnings=[];for(const c of critical)for(const o of c.outcomes)if(o.count15===0&&live.length)warnings.push(`<article><span>!</span><p><strong>${c.index+1}. maçta ${o.pick}</strong> gelirse 15 bilme ihtimali tamamen biter.</p></article>`);
    if(!warnings.length&&remaining)warnings.push('<article class="safe"><span>✓</span><p>Tek bir bekleyen maç sonucu şu anda 15 ihtimalini tamamen bitirmiyor.</p></article>');
    if(guaranteed)warnings.unshift(`<article class="safe"><span>✓</span><p><strong>En az ${guaranteed} bilme kesinleşti.</strong> Kalan sonuçlar ne olursa olsun sistemde bu derece veya üzeri bulunuyor.</p></article>`);
    $('kzWarningList').innerHTML=warnings.slice(0,8).join('');
    $('kzCriticalList').innerHTML=critical.length?critical.map((m,rank)=>`<article class="kz-critical-card"><div class="kz-critical-head"><span>${rank+1}</span><div><strong>${m.index+1}. Maç</strong><small>${escapeHtml(state.matchNames[m.index]||'')}</small></div></div><div class="kz-impact-grid">${m.outcomes.map(o=>`<div class="${o.count15===0?'danger':''}"><b>${o.pick}</b><strong>${o.count15.toLocaleString('tr-TR')}</strong><small>15 devam</small><em>${o.count14.toLocaleString('tr-TR')} kolon 14+</em></div>`).join('')}</div></article>`).join(''):'<div class="kz-empty-mini">Bekleyen maç kalmadı.</div>';
    $('kzPathCount').textContent=`${paths.length.toLocaleString('tr-TR')} yol`;
    $('kzPathList').innerHTML=paths.length?paths.slice(0,10).map((p,n)=>`<article><div><span>#${n+1}</span><strong>${p.count.toLocaleString('tr-TR')} kolon</strong></div><p>${pending.map((mi,j)=>`<b title="${escapeHtml(state.matchNames[mi])}">${mi+1}<em>${p.picks[j]}</em></b>`).join('')}</p></article>`).join(''):'<div class="kz-empty-mini">15 için yaşayan sonuç yolu kalmadı.</div>';
    bindKarumQuestions();renderPrizeEstimate();bindPrizeModel();
  },40);
}

let currentMatchDetailIndex=null;
function showView(view){
  const ids=['homeView','matchesView','matchDetailView','analysisView','karumZekaView'];
  ids.forEach(id=>$(id)?.classList.add('hidden'));
  if(view==='karumzeka'){$('karumZekaView').classList.remove('hidden');renderKarumZeka()}
  else if(view==='analysis'){$('analysisView').classList.remove('hidden');renderAnalysis()}
  else if(view==='matches'){$('matchesView').classList.remove('hidden');renderMatches()}
  else if(view==='detail'){$('matchDetailView').classList.remove('hidden');renderMatchDetail(currentMatchDetailIndex)}
  else $('homeView').classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
}
function liveColumns(){return state.columns.filter(col=>state.results.every((r,i)=>!r||col[i]===r))}
function matchSmartComment(i,distribution){
  if(!distribution.total)return 'Bu maç için analiz edilecek kolon bulunmuyor.';
  const sorted=Object.entries(distribution.counts).sort((a,b)=>b[1]-a[1]);
  const pct=Math.round(sorted[0][1]/distribution.total*100);
  if(pct>=80)return `Kalan kolonlar güçlü biçimde ${sorted[0][0]} sonucuna yoğunlaşıyor.`;
  if(pct>=60)return `${sorted[0][0]} sonucu avantajlı görünüyor; ancak alternatif senaryolar hâlâ güçlü.`;
  return 'Kolonlar bu maçta dengeli dağılmış. Haftanın kritik maçlarından biri.';
}

const LIVE_SCORES_URL=`${SUPABASE_URL}/functions/v1/live-scores`;
let liveScoreBusy=false;
function splitMatchTeams(name=''){const parts=String(name).split(/\s+(?:-|–|—|vs\.?|v)\s+/i).map(v=>v.trim()).filter(Boolean);return parts.length>=2?[parts[0],parts.slice(1).join(' ')]:[String(name||''),''];}
function fixtureResult(f){const h=Number(f?.goalsHome),a=Number(f?.goalsAway);if(!Number.isFinite(h)||!Number.isFinite(a))return '';return h>a?'1':h<a?'2':'X'}
function isFinalFixture(f){return ['FT','AET','PEN'].includes(String(f?.statusShort||'').toUpperCase())}
function liveFixtureStatus(f){const code=String(f?.statusShort||'').toUpperCase();if(isFinalFixture(f))return 'Tamamlandı';if(['1H','HT','2H','ET','BT','P','LIVE'].includes(code))return `${f.elapsed||''}${f.elapsed?' dk':''} Canlı`;if(['NS','TBD'].includes(code))return 'Başlamadı';if(['PST','CANC','ABD','AWD','WO'].includes(code))return f.statusLong||code;return f.statusLong||code||'Eşleşti'}
function matchingReportStatus(i){
  const report=state.matchReports?.[i],fixture=state.liveFixtures?.[i];
  if(fixture){const confidence=Number(fixture.confidence||report?.confidence||100);return confidence>=85?'matched':'review'}
  if(report?.status)return report.status;
  const date=state.matchDates[i],w=apiFreePlanWindow();
  return date&&date>=w.min&&date<=w.max?'not_checked':'waiting';
}
function renderMatchingReport(){
  const box=$('matchingReport'),summary=$('matchingSummary');if(!box||!summary)return;
  const counts={matched:0,review:0,unmatched:0,waiting:0,not_checked:0};
  const rows=state.matchNames.map((name,i)=>{
    const f=state.liveFixtures[i],r=state.matchReports[i]||{},status=matchingReportStatus(i);counts[status]=(counts[status]||0)+1;
    const labels={matched:'Eşleşti',review:'Kontrol gerekli',unmatched:'Eşleşmedi',waiting:'Henüz sorgulanamadı',not_checked:'Kontrol bekliyor'};
    const icons={matched:'✓',review:'!',unmatched:'×',waiting:'⌛',not_checked:'•'};
    const [home,away]=splitMatchTeams(name);
    const apiName=f?`${f.homeName||''} - ${f.awayName||''}`:'—';
    const confidence=f?Number(f.confidence||100):Number(r.confidence||0);
    const detail=f?`Fixture ID: ${f.fixtureId}${confidence?` • Güven: %${confidence}`:''}`:(status==='waiting'?`${state.matchDates[i]||'Tarih yok'} ücretsiz plan aralığı dışında`:(status==='unmatched'?'Bu tarihte yeterli benzerlikte maç bulunamadı':'Henüz API sorgusu yapılmadı'));
    return `<article class="matching-row ${status}"><span class="matching-index">${i+1}</span><div class="matching-teams"><strong>${escapeHtml(home||name)}${away?` - ${escapeHtml(away)}`:''}</strong><small>API: ${escapeHtml(apiName)}</small><em>${escapeHtml(detail)}</em></div><span class="matching-badge"><b>${icons[status]}</b>${labels[status]}</span></article>`;
  }).join('');
  const complete=counts.matched+counts.review;
  summary.innerHTML=`<strong>${complete}/15 API kaydı bulundu</strong><span class="sum-ok">${counts.matched} eşleşti</span><span class="sum-review">${counts.review} kontrol gerekli</span><span class="sum-bad">${counts.unmatched} eşleşmedi</span><span class="sum-wait">${counts.waiting+counts.not_checked} bekliyor</span>`;
  box.innerHTML=rows;
}
function renderLiveScorePanel(message='',kind=''){
  const status=$('liveScoreStatus'),meta=$('liveScoreMeta'),btn=$('liveScoreRefresh');if(!status||!meta||!btn)return;
  btn.disabled=liveScoreBusy;btn.textContent=liveScoreBusy?'Kontrol Ediliyor…':'Şimdi Kontrol Et';
  const matched=state.liveFixtures.filter(Boolean).length,finished=state.liveFixtures.filter(isFinalFixture).length;
  status.className='live-score-status '+(kind||'');status.textContent=message||(matched?`${matched}/15 maç eşleşti • ${finished} maç tamamlandı`:'Henüz canlı skor kontrolü yapılmadı.');
  meta.textContent=state.liveUpdatedAt?`Son güncelleme: ${new Date(state.liveUpdatedAt).toLocaleString('tr-TR')}`:'API-Football bağlantısı hazır.';
  renderMatchingReport();
}
function apiFreePlanWindow(){
  const today=new Date();today.setHours(0,0,0,0);
  const min=new Date(today);min.setDate(min.getDate()-1);
  const max=new Date(today);max.setDate(max.getDate()+1);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {min:iso(min),max:iso(max)};
}
async function refreshLiveScores(){
  if(liveScoreBusy)return;
  const allValid=state.matchNames.map((name,index)=>({index,name,league:state.matchLeagues[index]||'',date:state.matchDates[index]||'',time:state.matchTimes[index]||'',fixtureId:state.fixtureIds[index]||null})).filter(m=>m.name&&m.date);
  if(!allValid.length){renderLiveScorePanel('Önce tarih bilgisi olan haftayı yükle.','bad');return}
  const window=apiFreePlanWindow();
  const valid=allValid.filter(m=>m.fixtureId||(m.date>=window.min&&m.date<=window.max));
  const waiting=allValid.length-valid.length;
  const validIndexes=new Set(valid.map(m=>m.index));
  allValid.forEach(m=>{if(!validIndexes.has(m.index)&&!state.liveFixtures[m.index])state.matchReports[m.index]={status:'waiting',checkedAt:new Date().toISOString()};});
  if(!valid.length){
    renderLiveScorePanel(`Ücretsiz API planı yalnızca ${window.min} – ${window.max} tarihlerini sorgulayabiliyor. Maçlar bu aralığa girdiğinde kontrol başlayacak.`,'warn');
    return;
  }
  liveScoreBusy=true;renderLiveScorePanel(`${valid.length} uygun maç API-Football üzerinden kontrol ediliyor…`,'loading');
  try{
    const response=await fetch(LIVE_SCORES_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`},body:JSON.stringify({matches:valid,timezone:'Europe/Istanbul'})});
    const data=await response.json().catch(()=>({ok:false,error:'Sunucudan geçerli JSON gelmedi.'}));
    if(!response.ok||!data.ok)throw new Error(data.error||`HTTP ${response.status}`);
    let changed=false,autoResults=0;
    valid.forEach(m=>{state.matchReports[m.index]={status:'unmatched',checkedAt:data.updatedAt||new Date().toISOString()};});
    for(const f of data.fixtures||[]){const i=Number(f.index);if(i<0||i>14)continue;state.liveFixtures[i]=f;state.matchReports[i]={status:Number(f.confidence||100)>=85?'matched':'review',confidence:Number(f.confidence||100),checkedAt:data.updatedAt||new Date().toISOString(),fixtureId:Number(f.fixtureId)||null};if(Number(f.fixtureId)&&state.fixtureIds[i]!==Number(f.fixtureId)){state.fixtureIds[i]=Number(f.fixtureId);changed=true}if(isFinalFixture(f)){const r=fixtureResult(f);if(r&&state.results[i]!==r){state.results[i]=r;lastChangedMatchIndex=i;autoResults++;changed=true}}}
    state.liveUpdatedAt=data.updatedAt||new Date().toISOString();saveLocal();renderMatches();calculate();if(changed)queueCloudSave();
    const quota=data.quotaRemaining!=null?` • Kalan API hakkı: ${data.quotaRemaining}`:'';
    const waitText=waiting?` • ${waiting} ileri tarihli maç bekliyor`:'';
    renderLiveScorePanel(`${data.matched||0}/${valid.length} uygun maç eşleşti${autoResults?` • ${autoResults} sonuç otomatik işlendi`:''}${waitText}${quota}`,(data.matched||0)?'ok':'warn');
  }catch(err){console.error(err);renderLiveScorePanel(`Canlı skor hatası: ${err.message}`,'bad')}
  finally{liveScoreBusy=false;renderLiveScorePanel($('liveScoreStatus')?.textContent||'', $('liveScoreStatus')?.className.replace('live-score-status','').trim()||'')}
}
function liveFixtureHtml(i){const f=state.liveFixtures[i];if(!f)return '';const score=(f.goalsHome==null||f.goalsAway==null)?'–':`${f.goalsHome} - ${f.goalsAway}`;return `<div class="api-fixture ${isFinalFixture(f)?'final':'live'}"><div class="api-team"><img src="${escapeHtml(f.homeLogo||'')}" alt="" onerror="this.style.display='none'"><span>${escapeHtml(f.homeName||splitMatchTeams(state.matchNames[i])[0])}</span></div><strong>${score}</strong><div class="api-team away"><span>${escapeHtml(f.awayName||splitMatchTeams(state.matchNames[i])[1])}</span><img src="${escapeHtml(f.awayLogo||'')}" alt="" onerror="this.style.display='none'"></div><small>${escapeHtml(liveFixtureStatus(f))}</small></div>`}

function renderMatches(){
  const box=$('matches'); if(!box)return; box.innerHTML='';
  state.matchNames.forEach((name,i)=>{
    const d=document.createElement('article'),status=getMatchStatus(state.matchDates[i],state.matchTimes[i]);
    d.className=`match match-list-card${status?.kind==='finished'?' match-finished':''}`;d.dataset.matchIndex=i;
    const league=String(state.matchLeagues[i]||'').trim(),date=String(state.matchDates[i]||'').trim(),time=String(state.matchTimes[i]||'').trim();
    const distribution=getPickDistribution(i,liveColumns());
    d.innerHTML=`<div class="match-list-top"><span class="match-no">${i+1}</span><div class="match-list-info"><small>${league||'Spor Toto'}</small><strong>${name||'Maç '+(i+1)}</strong><span>${date||'Tarih yok'}${time?' • '+time:''}</span></div><span class="match-list-arrow">›</span></div><div class="match-list-status">${matchStatusHtml(i)}</div>${liveFixtureHtml(i)}<div class="choices compact">${['1','X','2'].map(v=>{const count=distribution.counts[v],percent=distribution.total?Math.round(count/distribution.total*100):0;return `<button class="choice ${state.results[i]===v?'active':''}" data-i="${i}" data-v="${v}"><span class="choice-value">${v}</span><small class="choice-count">${count.toLocaleString('tr-TR')}</small><small class="choice-percent">%${percent}</small></button>`}).join('')}</div>`;
    d.addEventListener('click',e=>{if(e.target.closest('.choice'))return;currentMatchDetailIndex=i;showView('detail');setActiveNav('matches')});
    box.appendChild(d)
  });
  box.querySelectorAll('.choice').forEach(b=>b.onclick=e=>{e.stopPropagation();const i=+b.dataset.i,v=b.dataset.v;lastChangedMatchIndex=i;state.results[i]=state.results[i]===v?'':v;saveLocal();renderMatches();calculate();queueCloudSave()})
}
function renderMatchDetail(i){
  if(i==null||i<0||i>14)return;
  const box=$('matchDetailContent'),name=state.matchNames[i]||`Maç ${i+1}`,league=state.matchLeagues[i]||'Spor Toto',date=state.matchDates[i]||'',time=state.matchTimes[i]||'';
  const all=getPickDistribution(i,state.columns),live=getPickDistribution(i,liveColumns());
  const top=Object.entries(live.counts).sort((a,b)=>b[1]-a[1])[0]||['-',0], confidence=live.total?Math.round(top[1]/live.total*100):0;
  box.innerHTML=`<section class="detail-hero premium-card"><div class="detail-number">${i+1}</div><p>${escapeHtml(league)}</p><h2 id="matchDetailTitle">${escapeHtml(name)}</h2><div class="detail-meta">${escapeHtml(date)}${date&&time?' • ':''}${escapeHtml(time)}</div>${matchStatusHtml(i)}</section><section class="detail-card premium-card"><p class="section-kicker">CANLI DAĞILIM</p><h3>Kalan kolonlarda 1 / X / 2</h3><div class="detail-choices">${['1','X','2'].map(v=>{const c=live.counts[v],pct=live.total?Math.round(c/live.total*100):0;return `<button class="detail-choice ${state.results[i]===v?'active':''}" data-v="${v}"><b>${v}</b><strong>${c.toLocaleString('tr-TR')} kolon</strong><span>%${pct}</span><i style="--w:${pct}%"></i></button>`}).join('')}</div></section><section class="detail-grid"><article class="premium-card"><span>Güven</span><strong>%${confidence}</strong><small>${top[0]} sonucu</small></article><article class="premium-card"><span>Başlangıç Kolonu</span><strong>${all.total.toLocaleString('tr-TR')}</strong><small>Yüklenen toplam</small></article><article class="premium-card"><span>Kalan Kolon</span><strong>${live.total.toLocaleString('tr-TR')}</strong><small>Canlı durum</small></article><article class="premium-card"><span>Seçilen Sonuç</span><strong>${state.results[i]||'-'}</strong><small>${state.results[i]?'Kaydedildi':'Bekleniyor'}</small></article></section><section class="detail-comment premium-card"><p class="section-kicker">AKILLI YORUM</p><h3>${matchSmartComment(i,live)}</h3></section>`;
  box.querySelectorAll('.detail-choice').forEach(btn=>btn.onclick=()=>{const v=btn.dataset.v;lastChangedMatchIndex=i;state.results[i]=state.results[i]===v?'':v;saveLocal();calculate();renderMatches();renderMatchDetail(i);queueCloudSave()})
}

let coverageJobToken=0;
const PICK_DIGIT={'1':0,'X':1,'2':2};
function formatProbability(value){
  if(!Number.isFinite(value)||value<=0)return '%0';
  if(value>=10)return '%'+value.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(value>=1)return '%'+value.toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3});
  if(value>=0.01)return '%'+value.toLocaleString('tr-TR',{minimumFractionDigits:4,maximumFractionDigits:4});
  return '%'+value.toLocaleString('tr-TR',{minimumFractionDigits:6,maximumFractionDigits:6});
}
function buildCoverageMap(columns,results){
  const pending=[];for(let i=0;i<15;i++)if(!results[i])pending.push(i);
  const powers=pending.map((_,i)=>3**i),bestWrong=new Map();
  let alive=0;
  function record(code,wrong){const old=bestWrong.get(code);if(old===undefined||wrong<old)bestWrong.set(code,wrong)}
  for(const col of columns){
    let knownWrong=0;for(let i=0;i<15;i++)if(results[i]&&col[i]!==results[i])knownWrong++;
    if(knownWrong===0)alive++;
    const budget=3-knownWrong;if(budget<0)continue;
    let base=0;for(let p=0;p<pending.length;p++)base+=(PICK_DIGIT[col[pending[p]]]??0)*powers[p];
    record(base,knownWrong);
    function addMismatches(start,remainingDepth,targetDepth,code){
      if(remainingDepth===0){record(code,knownWrong+targetDepth);return}
      for(let p=start;p<=pending.length-remainingDepth;p++){
        const original=PICK_DIGIT[col[pending[p]]]??0;
        for(let alt=0;alt<3;alt++)if(alt!==original)addMismatches(p+1,remainingDepth-1,targetDepth,code+(alt-original)*powers[p]);
      }
    }
    for(let d=1;d<=Math.min(budget,pending.length);d++)addMismatches(0,d,d,base);
  }
  const counts={15:0,14:0,13:0,12:0};
  for(const wrong of bestWrong.values()){
    if(wrong<=0)counts[15]++;
    if(wrong<=1)counts[14]++;
    if(wrong<=2)counts[13]++;
    if(wrong<=3)counts[12]++;
  }
  return{pendingCount:pending.length,totalScenarios:3**pending.length,alive,eliminated:Math.max(0,columns.length-alive),counts};
}
function setCoverageLoading(loading){const badge=$('coverageLiveBadge');if(!badge)return;badge.textContent=loading?'HESAPLANIYOR':'CANLI';badge.classList.toggle('loading',loading)}
function renderCoverageAnalysis(){
  const panel=$('coveragePanel');if(!panel)return;
  const empty=$('coverageEmpty'),content=$('coverageContent');
  if(!state.columns.length){empty.classList.remove('hidden');content.classList.add('hidden');$('coverageLiveBadge').textContent='HAZIR';return}
  empty.classList.add('hidden');content.classList.remove('hidden');setCoverageLoading(true);
  const token=++coverageJobToken,columns=state.columns.map(c=>c.slice()),results=state.results.slice();
  setTimeout(()=>{
    if(token!==coverageJobToken)return;
    const data=buildCoverageMap(columns,results);if(token!==coverageJobToken)return;
    const pct=k=>data.totalScenarios?data.counts[k]/data.totalScenarios*100:0;
    for(const k of [15,14,13,12]){$('coverage'+k).textContent=formatProbability(pct(k));$('coverage'+k+'Meta').textContent=`${data.counts[k].toLocaleString('tr-TR')} / ${data.totalScenarios.toLocaleString('tr-TR')} senaryo`}
    $('coverageLoaded').textContent=columns.length.toLocaleString('tr-TR');$('coverageAlive').textContent=data.alive.toLocaleString('tr-TR');$('coverageEliminated').textContent=data.eliminated.toLocaleString('tr-TR');$('coverageRemaining').textContent=data.pendingCount.toLocaleString('tr-TR');$('coverageTotalScenarios').textContent=`3${toSuperscript(data.pendingCount)} = ${data.totalScenarios.toLocaleString('tr-TR')}`;$('coverageWinningScenarios').textContent=data.counts[15].toLocaleString('tr-TR');$('coverageMeterText').textContent=formatProbability(pct(15));$('coverageMeterBar').style.width=Math.min(100,pct(15))+'%';
    const entered=15-data.pendingCount;$('coverageSummary').textContent=entered?`${entered} maç sonucu girildi. Kalan ${data.pendingCount} maçtaki ${data.totalScenarios.toLocaleString('tr-TR')} olası sonucun ${data.counts[15].toLocaleString('tr-TR')} tanesi en az bir kolonunu 15'e götürüyor.`:`Başlangıçta 14.348.907 olası sonucun ${data.counts[15].toLocaleString('tr-TR')} tanesi yüklediğin kolonlarla doğrudan 15'i buluyor.`;
    setCoverageLoading(false);
  },30);
}
function toSuperscript(number){return String(number).replace(/0/g,'⁰').replace(/1/g,'¹').replace(/2/g,'²').replace(/3/g,'³').replace(/4/g,'⁴').replace(/5/g,'⁵').replace(/6/g,'⁶').replace(/7/g,'⁷').replace(/8/g,'⁸').replace(/9/g,'⁹')}

function calculate(){let counts={15:0,14:0,13:0,12:0,11:0};currentCategoryRows={15:[],14:[],13:[],12:[],11:[]};const entered=state.results.filter(Boolean).length;for(let idx=0;idx<state.columns.length;idx++){const col=state.columns[idx];let wrong=0;for(let i=0;i<15;i++)if(state.results[i]&&col[i]!==state.results[i])wrong++;const score=15-wrong;const category=score>=15?15:score===14?14:score===13?13:score===12?12:11;counts[category]++;currentCategoryRows[category].push([idx+1,col,wrong])}$('total').textContent=state.columns.length.toLocaleString('tr-TR');$('cost').textContent=(state.columns.length*10).toLocaleString('tr-TR')+' TL';$('s15').textContent=counts[15].toLocaleString('tr-TR');$('s14').textContent=counts[14].toLocaleString('tr-TR');$('s13').textContent=counts[13].toLocaleString('tr-TR');$('s12').textContent=counts[12].toLocaleString('tr-TR');$('s11').textContent=counts[11].toLocaleString('tr-TR');$('remaining').textContent=15-entered;const percent=Math.round((entered/15)*100);$('progressText').textContent=`${entered} / 15 maç tamamlandı`;$('progressPercent').textContent=`%${percent}`;$('progressBar').style.width=`${percent}%`;const total=counts[15]+counts[14]+counts[13]+counts[12]+counts[11];$('statsSource').textContent=total===state.columns.length?`${entered} maç seçildi • Kategoriler toplamı: ${total.toLocaleString('tr-TR')} kolon`:`Hesap kontrolü başarısız: ${total}/${state.columns.length}`;if(document.body.classList.contains('sheet-open'))renderOpenSheet();renderAnalysis();renderCoverageAnalysis();renderKarumZeka();renderPrizeEstimate()}
function categoryTitle(category){return category===11?'11 ve Altı':`${category} Devam`}
function renderCategorySheet(){const rows=currentCategoryRows[currentCategory]||[];$('sheetTitle').textContent=`${categoryTitle(currentCategory)} Kolonları`;$('sheetCount').textContent=`${rows.length.toLocaleString('tr-TR')} kolon`;const empty=$('sheetEmpty'),list=$('survivorsList');if(!rows.length){list.innerHTML='';empty.classList.remove('hidden');empty.innerHTML=`<strong>${categoryTitle(currentCategory)} kolonu yok</strong>Yeni sonuç seçildikçe bu liste otomatik güncellenir.`;return}empty.classList.add('hidden');const pending=state.results.filter(v=>!v).length;list.innerHTML=rows.map(([n,c,wrong])=>`<article class="column-card"><div class="column-card-head"><div><span class="column-number">Kolon #${n}</span><small class="column-status"><span class="error-count">${wrong} hata</span><span class="pending-count">${pending} bekliyor</span></small></div><button class="copy-column" data-column="${c.join('-')}">Kopyala</button></div><div class="column-picks">${c.map((v,i)=>{const cls=!state.results[i]?'pending-pick':state.results[i]!==v?'wrong-pick':'correct-pick';return `<span class="column-pick ${cls}" title="${!state.results[i]?'Sonuç bekleniyor':state.results[i]===v?'Doğru tahmin':'Yanlış tahmin'}">${v}</span>`}).join('')}</div></article>`).join('');list.querySelectorAll('.copy-column').forEach(btn=>btn.onclick=async()=>{try{await navigator.clipboard.writeText(btn.dataset.column);btn.textContent='Kopyalandı';btn.classList.add('copied');setTimeout(()=>{btn.textContent='Kopyala';btn.classList.remove('copied')},1000)}catch(e){alert(btn.dataset.column)}})}
function renderRemainingMatchesSheet(){const pending=state.results.map((v,i)=>!v?i:-1).filter(i=>i>=0);$('sheetTitle').textContent='Kalan Maçlar';$('sheetCount').textContent=`${pending.length} maç`;const empty=$('sheetEmpty'),list=$('survivorsList');if(!pending.length){list.innerHTML='';empty.classList.remove('hidden');empty.innerHTML='<strong>Tüm maçlar tamamlandı</strong>Girilmeyi bekleyen maç sonucu bulunmuyor.';return}empty.classList.add('hidden');list.innerHTML=pending.map(i=>{const date=String(state.matchDates[i]||'').trim(),time=String(state.matchTimes[i]||'').trim(),status=getMatchStatus(date,time);const league=String(state.matchLeagues[i]||'').trim();return `<article class="remaining-match-card"><span class="remaining-match-no">${i+1}</span><div class="remaining-match-info"><strong>${state.matchNames[i]||`Maç ${i+1}`}</strong>${league?`<div class="remaining-league">${league}</div>`:''}<p>${date?`📅 ${date}`:''}${date&&time?' • ':''}${time?`🕒 ${time}`:''}</p>${status?`<small class="remaining-status ${status.kind}">${status.label} • ${status.text}</small>`:'<small class="remaining-status upcoming">Sonuç bekleniyor</small>'}</div></article>`}).join('')}
function renderOpenSheet(){if(sheetMode==='remaining')renderRemainingMatchesSheet();else renderCategorySheet()}
function openCategory(category){sheetMode='category';currentCategory=Number(category)||15;renderCategorySheet();$('survivorsSheet').classList.remove('hidden');$('sheetBackdrop').classList.remove('hidden');document.body.classList.add('sheet-open')}
function openRemainingMatches(){sheetMode='remaining';renderRemainingMatchesSheet();$('survivorsSheet').classList.remove('hidden');$('sheetBackdrop').classList.remove('hidden');document.body.classList.add('sheet-open')}
function closeSurvivors(){$('survivorsSheet').classList.add('hidden');$('sheetBackdrop').classList.add('hidden');document.body.classList.remove('sheet-open')}
function parseRows(rows){const out=[];if(!Array.isArray(rows)||!rows.length)return out;let pickIndexes=null;for(const row of rows.slice(0,20)){const upper=(row||[]).map(trUpper),indexes=[];for(let n=1;n<=15;n++){const idx=upper.findIndex(v=>[`M${n}`,`MAÇ ${n}`,`MAC ${n}`].includes(v));if(idx<0){indexes.length=0;break}indexes.push(idx)}if(indexes.length===15){pickIndexes=indexes;break}}for(const row of rows){let vals;if(pickIndexes)vals=pickIndexes.map(i=>normalize((row||[])[i]));else{const raw=row||[],afterId=raw.slice(1,16).map(normalize);if(raw.length>=16&&afterId.every(Boolean))vals=afterId;else{vals=[];for(let start=0;start<=raw.length-15;start++){const c=raw.slice(start,start+15).map(normalize);if(c.every(Boolean)){vals=c;break}}}}if(vals&&vals.length===15&&vals.every(Boolean))out.push(vals)}return out}
function rowLabelIndex(rows,labels){const wanted=labels.map(trUpper);for(let r=0;r<rows.length;r++)for(let c=0;c<Math.min(4,(rows[r]||[]).length);c++)if(wanted.includes(trUpper(rows[r][c])))return{r,c};return null}
function extractMatchData(rows){const nameHit=rowLabelIndex(rows,['Maç Adı','Mac Adi','Maçlar','Takımlar']),leagueHit=rowLabelIndex(rows,['Lig','Ligler','Lig Adı','Lig Adi']),dateHit=rowLabelIndex(rows,['Tarih','Tarihler','Maç Tarihi','Mac Tarihi']),timeHit=rowLabelIndex(rows,['Saat','Saatler','Maç Saati','Mac Saati']);let matchNames=null,matchLeagues=Array(15).fill(''),matchDates=Array(15).fill(''),matchTimes=Array(15).fill('');if(nameHit)matchNames=(rows[nameHit.r]||[]).slice(nameHit.c+1,nameHit.c+16).map((v,i)=>cleanName(v,i));if(leagueHit)matchLeagues=(rows[leagueHit.r]||[]).slice(leagueHit.c+1,leagueHit.c+16).map(v=>String(v??'').trim());if(dateHit)matchDates=(rows[dateHit.r]||[]).slice(dateHit.c+1,dateHit.c+16).map(v=>String(v??'').trim());if(timeHit)matchTimes=(rows[timeHit.r]||[]).slice(timeHit.c+1,timeHit.c+16).map(v=>String(v??'').trim());return{matchNames:matchNames||Array.from({length:15},(_,i)=>`Maç ${i+1}`),matchLeagues,matchDates,matchTimes}}
function parseWorkbook(wb,fileName){const panelName=wb.SheetNames.find(n=>trUpper(n)==='TAKİP PANELİ')||wb.SheetNames[0],panelRows=XLSX.utils.sheet_to_json(wb.Sheets[panelName],{header:1,raw:false,defval:'',blankrows:false}),{matchNames,matchLeagues,matchDates,matchTimes}=extractMatchData(panelRows);let colName=wb.SheetNames.find(n=>trUpper(n)==='KOLONLAR');if(!colName)colName=wb.SheetNames.find(n=>n!==panelName)||panelName;const columns=parseRows(XLSX.utils.sheet_to_json(wb.Sheets[colName],{header:1,raw:false,defval:'',blankrows:false}));if(!columns.length)throw new Error('Kolonlar sayfasında 15 sonuçtan oluşan kolon bulunamadı.');const weekName=fileName.replace(/\.(xlsx|xls|csv|txt)$/i,'').replace(/[_-]+/g,' ').trim();const imported={matchNames,matchLeagues,matchDates,matchTimes,results:Array(15).fill(''),columns,weekName,fileName};imported.weekFingerprint=makeWeekFingerprint(imported);imported.weekKey=makeWeekKey(imported);return imported}
async function initSupabase(){if(!window.supabase){setSync('Bulut yüklenemedi','error');return}db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);const {data:{session}}=await db.auth.getSession();await handleSession(session);db.auth.onAuthStateChange((_event,session)=>setTimeout(()=>handleSession(session),0))}
async function handleSession(session){currentUser=session?.user||null;if(!currentUser){unsubscribeRealtime();$('cloudBar').classList.add('hidden');setSync('Giriş gerekli','offline');return}$('cloudBar').classList.remove('hidden');$('cloudUser').textContent=currentUser.email||'Karum Toto hesabı';setSync('Bağlandı','online');closeAuth();await loadCloudWeeks();subscribeRealtime()}
function showAuth(){const logged=!!currentUser;$('authModal').classList.remove('hidden');$('authBackdrop').classList.remove('hidden');$('logoutBtn').classList.toggle('hidden',!logged);$('loginBtn').classList.toggle('hidden',logged);$('signupBtn').classList.toggle('hidden',logged);$('authEmail').value=currentUser?.email||'';$('authMessage').textContent=logged?'Bu hesapla bulut senkronizasyonu açık.':''}
function closeAuth(){$('authModal').classList.add('hidden');$('authBackdrop').classList.add('hidden')}
function authMessage(text,bad=false){const el=$('authMessage');el.textContent=text;el.className='auth-message '+(bad?'bad':'ok')}
async function login(){try{authMessage('Giriş yapılıyor...');const {error}=await db.auth.signInWithPassword({email:$('authEmail').value.trim(),password:$('authPassword').value});if(error)throw error;authMessage('Giriş başarılı.')}catch(e){authMessage(e.message,true)}}
async function signup(){try{authMessage('Hesap oluşturuluyor...');const {data,error}=await db.auth.signUp({email:$('authEmail').value.trim(),password:$('authPassword').value});if(error)throw error;authMessage(data.session?'Hesap oluşturuldu ve giriş yapıldı.':'Hesap oluşturuldu. E-postandaki onay bağlantısına basıp giriş yap.')}catch(e){authMessage(e.message,true)}}
async function logout(){await db.auth.signOut();cloudWeeks=[];$('weekSelect').innerHTML='<option value="">Hafta seç</option>';authMessage('Çıkış yapıldı.');closeAuth()}
async function loadCloudWeeks(){if(!currentUser)return;const {data,error}=await db.from('karum_weeks').select('id,week_key,week_name,file_name,payload,updated_at').order('updated_at',{ascending:false});if(error){setSync('Tablo kurulmalı','error');$('cloudInfo').textContent='Önce Supabase SQL kurulumunu çalıştır.';return}cloudWeeks=data||[];const select=$('weekSelect');select.innerHTML='<option value="">Hafta seç</option>'+cloudWeeks.map(w=>{const systems=w.payload?.systems||[];const total=systems.length?systems.reduce((n,s)=>n+(s.columns?.length||0),0):(w.payload?.columns?.length||0);return `<option value="${w.id}">${w.week_name} • ${systems.length||1} sistem • ${total} kolon</option>`}).join('');let chosen=state.cloudId&&cloudWeeks.find(w=>w.id===state.cloudId);if(!chosen&&state.weekKey)chosen=cloudWeeks.find(w=>w.week_key===state.weekKey);if(!chosen&&cloudWeeks.length)chosen=cloudWeeks[0];if(chosen)applyCloudWeek(chosen);updateDeleteWeekButton();$('cloudInfo').textContent=cloudWeeks.length?`${cloudWeeks.length} hafta kayıtlı • Anlık senkronizasyon açık`:'Henüz bulutta hafta yok. Excel yükle.'}
function applyCloudWeek(row){if(!row?.payload)return;isApplyingRemote=true;Object.assign(state,row.payload,{cloudId:row.id,cloudUpdatedAt:row.updated_at,weekKey:row.week_key,weekName:row.week_name,fileName:row.file_name});normalizeState();saveLocal();updateHeader();renderSystems();renderMatches();calculate();$('weekSelect').value=row.id;setSync('Güncel','online');setTimeout(()=>isApplyingRemote=false,0)}
function updateDeleteWeekButton(){const btn=$('deleteWeekBtn');if(!btn)return;btn.classList.toggle('hidden',!currentUser||!$('weekSelect').value)}
async function saveCloudNow(){if(!currentUser||!db||isApplyingRemote||!state.systems.length)return;setSync('Kaydediliyor','saving');const row={user_id:currentUser.id,week_key:state.weekKey||makeWeekKey(state),week_name:state.weekName||'Güncel Hafta',file_name:activeSystem()?.fileName||state.fileName||'',payload:safeStatePayload(),updated_at:new Date().toISOString()};const {data,error}=await db.from('karum_weeks').upsert(row,{onConflict:'user_id,week_key'}).select().single();if(error){console.error(error);setSync('Kayıt hatası','error');return}state.cloudId=data.id;state.cloudUpdatedAt=data.updated_at;saveLocal();setSync('Güncel','online');await loadCloudWeeks()}
function queueCloudSave(){if(!currentUser)return;clearTimeout(saveTimer);setSync('Kaydediliyor','saving');saveTimer=setTimeout(saveCloudNow,350)}
function subscribeRealtime(){unsubscribeRealtime();if(!currentUser||!db)return;realtimeChannel=db.channel('karum-weeks-'+currentUser.id).on('postgres_changes',{event:'*',schema:'public',table:'karum_weeks'},payload=>{if(payload.eventType==='DELETE'){loadCloudWeeks();return}const row=payload.new;if(!row||row.user_id!==currentUser.id)return;const localTime=new Date(state.cloudUpdatedAt||0).getTime(),remoteTime=new Date(row.updated_at||0).getTime();if(row.id===state.cloudId&&remoteTime>localTime+100)applyCloudWeek(row);else if(row.id!==state.cloudId)loadCloudWeeks()}).subscribe(status=>{if(status==='SUBSCRIBED')setSync('Anlık bağlı','online')})}
function unsubscribeRealtime(){if(realtimeChannel&&db)db.removeChannel(realtimeChannel);realtimeChannel=null}
$('fileInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{let imported;if(/\.csv$|\.txt$/i.test(f.name)){const rows=(await f.text()).split(/\r?\n/).map(line=>line.split(/[;,\t ]+/)),columns=parseRows(rows);if(!columns.length)throw new Error('15 sonuçtan oluşan kolon bulunamadı.');imported={matchNames:state.matchNames,matchLeagues:state.matchLeagues,matchDates:state.matchDates,matchTimes:state.matchTimes,results:Array(15).fill(''),columns,weekName:state.weekName||f.name.replace(/\.[^.]+$/,''),fileName:f.name};imported.weekFingerprint=makeWeekFingerprint(imported);imported.weekKey=makeWeekKey(imported)}else{const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellFormula:false,cellHTML:false});imported=parseWorkbook(wb,f.name)}
  const sameWeek=state.systems.length&&state.weekFingerprint===imported.weekFingerprint;
  const defaultName=`Sistem ${sameWeek?state.systems.length+1:1}`;const name=(prompt('Bu Excel için sistem/kupon adı yaz:',f.name.replace(/\.[^.]+$/,'')||defaultName)||defaultName).trim();
  const system={id:makeSystemId(),name,fileName:f.name,columns:imported.columns};
  if(sameWeek){syncActiveSystem();state.systems.push(system);state.activeSystemId=system.id;state.columns=system.columns;state.fileName=system.fileName}
  else{Object.assign(state,imported,{fixtureIds:Array(15).fill(null),liveFixtures:Array(15).fill(null),matchReports:Array(15).fill(null),liveUpdatedAt:'',systems:[system],activeSystemId:system.id,columns:system.columns,fileName:system.fileName,cloudId:null,cloudUpdatedAt:null})}
  normalizeState();saveLocal();updateHeader();renderSystems();renderMatches();calculate();if(currentUser)await saveCloudNow();else showAuth();alert(`${name} eklendi.\n\n${system.columns.length.toLocaleString('tr-TR')} kolon • Bu haftada toplam ${state.systems.length} sistem var.`)}catch(err){console.error(err);alert('Dosya yüklenemedi: '+err.message)}finally{e.target.value=''}});
$('weekSelect').onchange=()=>{const row=cloudWeeks.find(w=>w.id===$('weekSelect').value);if(row)applyCloudWeek(row);updateDeleteWeekButton()};
$('deleteWeekBtn').onclick=async()=>{const id=$('weekSelect').value,row=cloudWeeks.find(w=>w.id===id);if(!currentUser||!id||!row)return;const ok=confirm(`"${row.week_name}" haftasını kalıcı olarak silmek istiyor musun?\n\nBu işlem telefon ve bilgisayardaki ortak kaydı siler.`);if(!ok)return;setSync('Siliniyor','saving');const {error}=await db.from('karum_weeks').delete().eq('id',id).eq('user_id',currentUser.id);if(error){console.error(error);setSync('Silme hatası','error');alert('Hafta silinemedi: '+error.message);return}cloudWeeks=cloudWeeks.filter(w=>w.id!==id);if(state.cloudId===id){state.cloudId=null;state.cloudUpdatedAt=null;state.weekKey='';state.weekName='Güncel Hafta';state.fileName='';state.matchNames=Array.from({length:15},(_,i)=>`Takım ${i+1}A - Takım ${i+1}B`);state.matchLeagues=Array(15).fill('');state.matchDates=Array(15).fill('');state.matchTimes=Array(15).fill('');state.results=Array(15).fill('');state.fixtureIds=Array(15).fill(null);state.liveFixtures=Array(15).fill(null);state.matchReports=Array(15).fill(null);state.liveUpdatedAt='';state.columns=[];state.systems=[];state.activeSystemId='';state.weekFingerprint='';normalizeState();saveLocal();updateHeader();renderMatches();calculate()}await loadCloudWeeks();setSync('Anlık bağlı','online');alert('Hafta silindi.')} ;
function renderSystems(){const select=$('systemSelect'),list=$('systemCards'),del=$('deleteSystemBtn');if(!select||!list)return;const total=allSystemColumns().length;select.innerHTML=state.systems.length?`<option value="__all__">Tüm Sistemler • ${total} kolon</option>`+state.systems.map(s=>`<option value="${s.id}">${escapeHtml(s.name)} • ${s.columns.length} kolon</option>`).join(''):'<option value="">Sistem yok</option>';select.value=state.activeSystemId||'';list.innerHTML=state.systems.map(s=>`<button type="button" class="system-chip ${s.id===state.activeSystemId?'active':''}" data-id="${s.id}"><strong>${escapeHtml(s.name)}</strong><span>${s.columns.length.toLocaleString('tr-TR')} kolon</span></button>`).join('');list.querySelectorAll('.system-chip').forEach(b=>b.onclick=()=>setActiveSystem(b.dataset.id));del?.classList.toggle('hidden',!activeSystem()||state.systems.length<2)}
$('systemSelect')?.addEventListener('change',e=>setActiveSystem(e.target.value));
$('deleteSystemBtn')?.addEventListener('click',async()=>{const sys=activeSystem();if(!sys)return;if(!confirm(`"${sys.name}" sistemini silmek istiyor musun?`))return;state.systems=state.systems.filter(s=>s.id!==sys.id);state.activeSystemId=state.systems[0]?.id||'';normalizeState();saveLocal();updateHeader();renderSystems();renderMatches();calculate();queueCloudSave()});
document.querySelectorAll('.category-card').forEach(btn=>btn.onclick=()=>openCategory(btn.dataset.category));$('remainingMatchesBtn').onclick=openRemainingMatches;$('closeSheet').onclick=closeSurvivors;$('sheetBackdrop').onclick=closeSurvivors;
$('liveScoreRefresh')?.addEventListener('click',refreshLiveScores);
$('clearResults').onclick=()=>{lastChangedMatchIndex=null;state.results=Array(15).fill('');saveLocal();renderMatches();calculate();queueCloudSave()};
$('accountBtn').onclick=showAuth;$('closeAuth').onclick=closeAuth;$('authBackdrop').onclick=closeAuth;$('loginBtn').onclick=login;$('signupBtn').onclick=signup;$('logoutBtn').onclick=logout;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSurvivors();closeAuth()}});
function setActiveNav(tab){document.querySelectorAll('.bottom-nav .nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab))}
function openHomeSection(target){showView(target==='matches'?'matches':'home');setActiveNav(target==='matches'?'matches':'home')}
function openAnalysisSection(target){showView('analysis');setActiveNav(target==='smart'?'smart':'analysis');requestAnimationFrame(()=>{if(target==='smart')$('smartDecisionPanel')?.scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo({top:0,behavior:'smooth'})})}
$('homeNavBtn').onclick=()=>openHomeSection('home');
const brandHomeBtn=$('brandHomeBtn');
if(brandHomeBtn){
  brandHomeBtn.onclick=()=>openHomeSection('home');
  brandHomeBtn.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openHomeSection('home')}};
}
$('matchesNavBtn').onclick=()=>openHomeSection('matches');
$('matchDetailBack').onclick=()=>openHomeSection('matches');
$('analysisNavBtn').onclick=()=>openAnalysisSection('analysis');
$('smartNavBtn').onclick=()=>{showView('karumzeka');setActiveNav('smart');window.scrollTo({top:0,behavior:'smooth'});};
$('settingsNavBtn').onclick=()=>{setActiveNav('settings');showAuth()};
document.querySelectorAll('.quick-access button').forEach(btn=>btn.onclick=()=>{const a=btn.dataset.action;if(a==='analysis'||a==='live')openAnalysisSection('analysis');else if(a==='scenario'){openAnalysisSection('analysis');requestAnimationFrame(()=>$('scenarioEngine')?.scrollIntoView({behavior:'smooth',block:'start'}))}else {showView('karumzeka');setActiveNav('smart');window.scrollTo({top:0,behavior:'smooth'});}});
document.querySelectorAll('.analysis-mode-btn').forEach(btn=>btn.onclick=()=>setAnalysisMode(btn.dataset.mode));
loadLocal();normalizeState();updateHeader();renderSystems();renderMatches();calculate();renderLiveScorePanel();initMatchingReportAccordion();initSupabase();setInterval(refreshMatchStatuses,30000);
window.addEventListener('load',()=>{const splash=$('splash');if(splash){setTimeout(()=>splash.classList.add('hide'),650);setTimeout(()=>splash.remove(),1150)}});
