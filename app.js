const APP_VERSION='6.4.0';
const STORAGE_KEY='sporTotoStateV64';
const LIVE_DURATION_MINUTES=120;
const state={matchNames:[],matchDates:Array(15).fill(''),matchTimes:Array(15).fill(''),results:Array(15).fill(''),columns:[],weekName:'Güncel Hafta',fileName:''};
const $=id=>document.getElementById(id);
const trUpper=v=>String(v??'').trim().toLocaleUpperCase('tr-TR');
function normalize(v){const s=trUpper(v);return s==='1'||s==='2'||s==='X'?s:''}
function cleanName(v,i){const s=String(v??'').trim();return s||`Maç ${i+1}`}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function load(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));if(s&&Array.isArray(s.columns)){Object.assign(state,s);return}}catch(e){} Object.assign(state,window.INITIAL_DATA||{});save()}
function updateHeader(){
  $('weekName').textContent=state.weekName||state.fileName||'Güncel Hafta';
  const fileSummary=$('fileSummary'); if(fileSummary) fileSummary.textContent=state.fileName||'Henüz dosya seçilmedi';
  $('uploadInfo').textContent=state.fileName?`${state.columns.length.toLocaleString('tr-TR')} kolon • ${(state.columns.length*10).toLocaleString('tr-TR')} TL`:'Excel\'deki takım adları, sonuçlar ve kolonlar otomatik okunur.';
  const badge=$('versionBadge'); if(badge) badge.textContent='v'+APP_VERSION;
}
function parseMatchDateTime(dateValue,timeValue){
  const date=String(dateValue||'').trim(),time=String(timeValue||'').trim();
  if(!date||!time)return null;
  let y,m,d;
  let hit=date.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if(hit){d=+hit[1];m=+hit[2];y=+hit[3];}
  else if((hit=date.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/))){y=+hit[1];m=+hit[2];d=+hit[3];}
  else return null;
  const clock=time.match(/^(\d{1,2})[:.](\d{2})/); if(!clock)return null;
  const hh=+clock[1],mm=+clock[2]; if(hh>23||mm>59)return null;
  const dt=new Date(y,m-1,d,hh,mm,0,0);
  return Number.isNaN(dt.getTime())?null:dt;
}
function getMatchStatus(dateValue,timeValue,now=new Date()){
  const start=parseMatchDateTime(dateValue,timeValue); if(!start)return null;
  const diff=start.getTime()-now.getTime();
  if(diff>0){
    const mins=Math.ceil(diff/60000),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),minutes=mins%60;
    let text;
    if(days>0)text=`${days} gün ${hours} saat kaldı`;
    else if(hours>0)text=`${hours} saat ${minutes} dk kaldı`;
    else text=`${Math.max(1,minutes)} dk kaldı`;
    return {kind:'upcoming',label:'Başlamadı',text:`⏳ ${text}`};
  }
  if(diff>=-(LIVE_DURATION_MINUTES*60000))return {kind:'live',label:'Canlı',text:'● Maç oynanıyor'};
  return {kind:'finished',label:'Tamamlandı',text:'Maç tamamlandı'};
}
function matchStatusHtml(i){
  const status=getMatchStatus(state.matchDates[i],state.matchTimes[i]);
  if(!status)return '';
  return `<div class="match-status ${status.kind}"><span class="status-label">${status.label}</span><span class="status-text">${status.text}</span></div>`;
}
function refreshMatchStatuses(){
  document.querySelectorAll('.match[data-match-index]').forEach(card=>{
    const i=Number(card.dataset.matchIndex),slot=card.querySelector('.match-status-slot');
    if(slot)slot.innerHTML=matchStatusHtml(i);
  });
}
function renderMatches(){const box=$('matches');box.innerHTML='';state.matchNames.forEach((name,i)=>{const d=document.createElement('div');d.className='match';d.dataset.matchIndex=i;const date=String(state.matchDates[i]||'').trim(),time=String(state.matchTimes[i]||'').trim();const meta=(date||time)?`<div class="match-meta">${date?`<span><b class="meta-icon">▣</b>${date}</span>`:''}${time?`<span><b class="meta-icon clock">◷</b>${time}</span>`:''}</div>`:'';d.innerHTML=`<div class="match-head"><span class="match-no">${i+1}</span><div class="match-info"><span class="match-name">${name||'Maç '+(i+1)}</span>${meta}<div class="match-status-slot">${matchStatusHtml(i)}</div></div></div><div class="choices">${['1','X','2'].map(v=>`<button class="choice ${state.results[i]===v?'active':''}" data-i="${i}" data-v="${v}">${v}</button>`).join('')}</div>`;box.appendChild(d)});box.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,v=b.dataset.v;state.results[i]=state.results[i]===v?'':v;save();renderMatches();calculate()})}
let currentPerfect=[];
function calculate(){
  let counts={15:0,14:0,13:0,12:0,11:0},perfect=[];
  const entered=state.results.filter(Boolean).length;
  for(let idx=0;idx<state.columns.length;idx++){
    const col=state.columns[idx];let wrong=0;
    for(let i=0;i<15;i++)if(state.results[i]&&col[i]!==state.results[i])wrong++;
    const score=15-wrong;
    if(score>=15){counts[15]++;perfect.push([idx+1,col])}
    else if(score===14)counts[14]++;else if(score===13)counts[13]++;else if(score===12)counts[12]++;else counts[11]++;
  }
  currentPerfect=perfect;
  $('total').textContent=state.columns.length.toLocaleString('tr-TR');
  $('cost').textContent=(state.columns.length*10).toLocaleString('tr-TR')+' TL';
  $('s15').textContent=counts[15].toLocaleString('tr-TR');
  $('s14').textContent=counts[14].toLocaleString('tr-TR');
  $('s13').textContent=counts[13].toLocaleString('tr-TR');
  $('s12').textContent=counts[12].toLocaleString('tr-TR');
  $('s11').textContent=counts[11].toLocaleString('tr-TR');
  $('remaining').textContent=15-entered;
  const source=$('statsSource');
  if(source)source.textContent='Sonuçları telefonda seçtikçe kalan kolonlar anında hesaplanır.';
  if(document.body.classList.contains('sheet-open'))renderSurvivors();
}

function renderSurvivors(){const q=String($('columnSearch').value||'').trim();const rows=q?currentPerfect.filter(([n])=>String(n)===q):currentPerfect;$('sheetCount').textContent=`${currentPerfect.length.toLocaleString('tr-TR')} kolon kaldı`;const empty=$('sheetEmpty'),list=$('survivorsList');if(!rows.length){list.innerHTML='';empty.classList.remove('hidden');empty.innerHTML=q?'<strong>Kolon bulunamadı</strong>Bu numaralı kolon 15 devam edenler arasında değil.':'<strong>15 devam eden kolon kalmadı</strong>Yeni sonuç girdikçe liste canlı güncellenir.';return}empty.classList.add('hidden');list.innerHTML=rows.map(([n,c])=>`<article class="column-card"><div class="column-card-head"><span class="column-number">Kolon #${n}</span><button class="copy-column" data-number="${n}" data-column="${c.join('-')}">Kopyala</button></div><div class="column-picks">${c.map(v=>`<span class="column-pick">${v}</span>`).join('')}</div></article>`).join('');list.querySelectorAll('.copy-column').forEach(btn=>btn.onclick=async()=>{try{await navigator.clipboard.writeText(btn.dataset.column);btn.textContent='Kopyalandı';btn.classList.add('copied');setTimeout(()=>{btn.textContent='Kopyala';btn.classList.remove('copied')},1100)}catch(e){alert('Kolon: '+btn.dataset.column)}})}
function openSurvivors(){renderSurvivors();$('survivorsSheet').classList.remove('hidden');$('sheetBackdrop').classList.remove('hidden');$('sheetBackdrop').setAttribute('aria-hidden','false');document.body.classList.add('sheet-open')}
function closeSurvivors(){$('survivorsSheet').classList.add('hidden');$('sheetBackdrop').classList.add('hidden');$('sheetBackdrop').setAttribute('aria-hidden','true');document.body.classList.remove('sheet-open')}
function parseRows(rows){const out=[];for(const row of rows){let vals=(row||[]).map(normalize);if(vals.length>=16&&!['1','X','2'].includes(vals[0]))vals=vals.slice(1,16);else vals=vals.slice(0,15);if(vals.length===15&&vals.every(Boolean))out.push(vals)}return out}
function rowLabelIndex(rows,labels){const wanted=labels.map(trUpper);for(let r=0;r<rows.length;r++){for(let c=0;c<Math.min(4,(rows[r]||[]).length);c++){if(wanted.includes(trUpper(rows[r][c])))return {r,c};}}return null}
function extractMatchData(rows){
  const nameHit=rowLabelIndex(rows,['Maç Adı','Mac Adi','Maçlar','Takımlar']);
  const resultHit=rowLabelIndex(rows,['Sonuç','Sonuc','Sonuçlar']);
  const dateHit=rowLabelIndex(rows,['Tarih','Tarihler','Maç Tarihi','Mac Tarihi']);
  const timeHit=rowLabelIndex(rows,['Saat','Saatler','Maç Saati','Mac Saati']);
  let matchNames=null,matchDates=Array(15).fill(''),matchTimes=Array(15).fill(''),results=Array(15).fill('');
  if(nameHit){matchNames=(rows[nameHit.r]||[]).slice(nameHit.c+1,nameHit.c+16).map((v,i)=>cleanName(v,i));}
  if(dateHit){matchDates=(rows[dateHit.r]||[]).slice(dateHit.c+1,dateHit.c+16).map(v=>String(v??'').trim());}
  if(timeHit){matchTimes=(rows[timeHit.r]||[]).slice(timeHit.c+1,timeHit.c+16).map(v=>String(v??'').trim());}
  if(resultHit){results=(rows[resultHit.r]||[]).slice(resultHit.c+1,resultHit.c+16).map(normalize);}
  // Etiket bulunamazsa, ilk 25 satırda art arda en az 10 metin içeren satırı takım satırı olarak dene.
  if(!matchNames){
    for(let r=0;r<Math.min(25,rows.length);r++){
      const row=rows[r]||[];
      for(let start=0;start<=Math.max(0,row.length-15);start++){
        const slice=row.slice(start,start+15).map(v=>String(v??'').trim());
        const textCount=slice.filter(v=>v&&!['1','X','2'].includes(trUpper(v))).length;
        if(textCount>=10){matchNames=slice.map((v,i)=>cleanName(v,i));break;}
      }
      if(matchNames)break;
    }
  }
  return {matchNames:matchNames||Array.from({length:15},(_,i)=>`Maç ${i+1}`),matchDates,matchTimes,results};
}
function parseWorkbook(wb,fileName){
  let panelName=wb.SheetNames.find(n=>trUpper(n)==='TAKİP PANELİ')||wb.SheetNames.find(n=>trUpper(n)==='TELEFON TAKİP')||wb.SheetNames[0];
  const panelSheet=wb.Sheets[panelName];
  const panelRows=XLSX.utils.sheet_to_json(panelSheet,{header:1,raw:false,defval:'',blankrows:false});
  const {matchNames,matchDates,matchTimes}=extractMatchData(panelRows);
  // Excel'deki Sonuç satırı bilinçli olarak kullanılmaz. Sonuçlar yalnızca telefondan seçilir.
  const results=Array(15).fill('');
  let colName=wb.SheetNames.find(n=>trUpper(n)==='KOLONLAR');
  if(!colName) colName=wb.SheetNames.find(n=>n!==panelName)||panelName;
  const colRows=XLSX.utils.sheet_to_json(wb.Sheets[colName],{header:1,raw:false,defval:'',blankrows:false});
  const columns=parseRows(colRows);
  if(!columns.length) throw new Error('Kolonlar sayfasında 15 sonuçtan oluşan kolon bulunamadı.');
  const weekName=fileName.replace(/\.(xlsx|xls|csv|txt)$/i,'').replace(/[_-]+/g,' ').trim();
  return {matchNames,matchDates,matchTimes,results,columns,weekName,fileName};
}
$('fileInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{let imported;if(/\.csv$|\.txt$/i.test(f.name)){const text=await f.text();const rows=text.split(/\r?\n/).map(line=>line.split(/[;,\t ]+/));const columns=parseRows(rows);if(!columns.length)throw new Error('15 sonuçtan oluşan kolon bulunamadı.');imported={matchNames:state.matchNames,matchDates:state.matchDates,matchTimes:state.matchTimes,results:Array(15).fill(''),columns,weekName:f.name.replace(/\.[^.]+$/,''),fileName:f.name}}else{if(!window.XLSX)throw new Error('Excel okuyucu yüklenemedi. İnternet bağlantısını kontrol et.');const data=await f.arrayBuffer();const wb=XLSX.read(data,{type:'array',cellFormula:false,cellHTML:false});imported=parseWorkbook(wb,f.name)}
Object.assign(state,imported);save();updateHeader();renderMatches();calculate();alert(`${state.columns.length.toLocaleString('tr-TR')} kolon yüklendi.\n\n1. maç: ${state.matchNames[0]}\n2. maç: ${state.matchNames[1]}\n\nTakım adları, tarih, saat ve kolonlar Excel'den okundu.
Excel'deki sonuçlar alınmadı; seçimler boş başlatıldı.
Telefonda 1 / X / 2 seçtikçe kalan kolonlar canlı hesaplanacak.`)}catch(err){console.error(err);alert('Dosya yüklenemedi: '+err.message)}finally{e.target.value=''}});
$('openSurvivors').onclick=openSurvivors;$('closeSheet').onclick=closeSurvivors;$('sheetBackdrop').onclick=closeSurvivors;$('columnSearch').oninput=renderSurvivors;$('clearSearch').onclick=()=>{$('columnSearch').value='';renderSurvivors();$('columnSearch').focus()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('sheet-open'))closeSurvivors()});
$('clearResults').onclick=()=>{state.results=Array(15).fill('');save();renderMatches();calculate()};
$('resetBtn').onclick=()=>{if(confirm('Uygulamadaki kayıtları ilk hâline döndürmek istiyor musun?')){localStorage.removeItem(STORAGE_KEY);location.reload()}};
async function removeOldCaches(){try{if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}}catch(e){console.warn('Önbellek temizlenemedi',e)}}
removeOldCaches();
load();state.matchNames=(state.matchNames||[]).slice(0,15);while(state.matchNames.length<15)state.matchNames.push('Maç '+(state.matchNames.length+1));state.matchDates=(state.matchDates||[]).map(v=>String(v??'').trim()).slice(0,15);while(state.matchDates.length<15)state.matchDates.push('');state.matchTimes=(state.matchTimes||[]).map(v=>String(v??'').trim()).slice(0,15);while(state.matchTimes.length<15)state.matchTimes.push('');state.results=(state.results||[]).map(normalize).slice(0,15);while(state.results.length<15)state.results.push('');updateHeader();renderMatches();calculate();
setInterval(refreshMatchStatuses,30000);

window.addEventListener('load',()=>{const splash=document.getElementById('splash');if(splash){setTimeout(()=>splash.classList.add('hide'),850);setTimeout(()=>splash.remove(),1450);}});
