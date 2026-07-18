const state={matchNames:[],results:Array(15).fill(''),columns:[],weekName:'Güncel Hafta',fileName:''};
const $=id=>document.getElementById(id);
function normalize(v){v=String(v??'').trim().toUpperCase();return v==='1'||v==='2'||v==='X'?v:''}
function cleanName(v,i){const s=String(v??'').trim();return s||`Maç ${i+1}`}
function save(){localStorage.setItem('sporTotoState',JSON.stringify(state))}
function load(){try{const s=JSON.parse(localStorage.getItem('sporTotoState'));if(s&&Array.isArray(s.columns)){Object.assign(state,s);return}}catch(e){} Object.assign(state,window.INITIAL_DATA||{});save()}
function updateHeader(){ $('weekName').textContent=state.weekName||state.fileName||'Güncel Hafta'; $('uploadInfo').textContent=state.fileName?`${state.fileName} • ${state.columns.length.toLocaleString('tr-TR')} kolon yüklü`:'Excel\'deki takım adları, sonuçlar ve kolonlar otomatik okunur.' }
function renderMatches(){const box=$('matches');box.innerHTML='';state.matchNames.forEach((name,i)=>{const d=document.createElement('div');d.className='match';d.innerHTML=`<div class="match-head"><span class="match-no">${i+1}</span><span class="match-name">${name||'Maç '+(i+1)}</span></div><div class="choices">${['1','X','2'].map(v=>`<button class="choice ${state.results[i]===v?'active':''}" data-i="${i}" data-v="${v}">${v}</button>`).join('')}</div>`;box.appendChild(d)});box.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,v=b.dataset.v;state.results[i]=state.results[i]===v?'':v;save();renderMatches();calculate()})}
function calculate(){let counts={15:0,14:0,13:0,12:0,11:0},perfect=[];const entered=state.results.filter(Boolean).length;for(let idx=0;idx<state.columns.length;idx++){const col=state.columns[idx];let wrong=0;for(let i=0;i<15;i++)if(state.results[i]&&col[i]!==state.results[i])wrong++;const score=15-wrong;if(score>=15){counts[15]++;perfect.push([idx+1,col])}else if(score===14)counts[14]++;else if(score===13)counts[13]++;else if(score===12)counts[12]++;else counts[11]++}
$('total').textContent=state.columns.length.toLocaleString('tr-TR');$('cost').textContent=(state.columns.length*10).toLocaleString('tr-TR')+' TL';$('s15').textContent=counts[15].toLocaleString('tr-TR');$('s14').textContent=counts[14].toLocaleString('tr-TR');$('s13').textContent=counts[13].toLocaleString('tr-TR');$('s12').textContent=counts[12].toLocaleString('tr-TR');$('s11').textContent=counts[11].toLocaleString('tr-TR');$('remaining').textContent=15-entered;
const panel=$('survivorsPanel'),list=$('survivors');if(counts[15]<=10&&counts[15]>0){panel.classList.remove('hidden');$('survivorsTitle').textContent='15 Devam Eden Kolonlar';list.innerHTML=perfect.map(([n,c])=>`<div class="survivor">#${n} &nbsp; ${c.join(' ')}</div>`).join('')}else panel.classList.add('hidden')}
function parseRows(rows){const out=[];for(const row of rows){let vals=row.map(normalize);if(vals.length>=16&&!['1','X','2'].includes(vals[0]))vals=vals.slice(1,16);else vals=vals.slice(0,15);if(vals.length===15&&vals.every(Boolean))out.push(vals)}return out}
function findLabelRow(rows,label){const target=label.toLocaleUpperCase('tr-TR');return rows.find(row=>String(row?.[0]??'').trim().toLocaleUpperCase('tr-TR')===target)}
function parseWorkbook(wb,fileName){
  const panelSheet=wb.Sheets['Takip Paneli']||wb.Sheets['Telefon Takip'];
  let matchNames=Array(15).fill('').map((_,i)=>`Maç ${i+1}`),results=Array(15).fill('');
  if(panelSheet){
    const panelRows=XLSX.utils.sheet_to_json(panelSheet,{header:1,raw:false,defval:''});
    const nameRow=findLabelRow(panelRows,'Maç Adı');
    const resultRow=findLabelRow(panelRows,'Sonuç');
    if(nameRow) matchNames=nameRow.slice(1,16).map(cleanName);
    if(resultRow) results=resultRow.slice(1,16).map(normalize);
  }
  const colSheet=wb.Sheets['Kolonlar']||wb.Sheets[wb.SheetNames.find(n=>n!=='Takip Paneli'&&n!=='Telefon Takip')]||wb.Sheets[wb.SheetNames[0]];
  const colRows=XLSX.utils.sheet_to_json(colSheet,{header:1,raw:false,defval:''});
  const columns=parseRows(colRows);
  if(!columns.length) throw new Error('Kolonlar sayfasında 15 sonuçtan oluşan kolon bulunamadı.');
  const weekName=fileName.replace(/\.(xlsx|xls|csv|txt)$/i,'').replace(/[_-]+/g,' ').trim();
  return {matchNames,results,columns,weekName,fileName};
}
$('fileInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{let imported;if(/\.csv$|\.txt$/i.test(f.name)){const text=await f.text();const rows=text.split(/\r?\n/).map(line=>line.split(/[;,\t ]+/));const columns=parseRows(rows);if(!columns.length)throw new Error('15 sonuçtan oluşan kolon bulunamadı.');imported={matchNames:state.matchNames,results:Array(15).fill(''),columns,weekName:f.name.replace(/\.[^.]+$/,''),fileName:f.name}}else{if(!window.XLSX)throw new Error('Excel okuyucu yüklenemedi. İnternet bağlantısını kontrol et.');const data=await f.arrayBuffer();const wb=XLSX.read(data,{type:'array'});imported=parseWorkbook(wb,f.name)}
Object.assign(state,imported);save();updateHeader();renderMatches();calculate();alert(`${state.columns.length.toLocaleString('tr-TR')} kolon ve 15 maç başarıyla yüklendi. Takım isimleri güncellendi.`)}catch(err){alert('Dosya yüklenemedi: '+err.message)}finally{e.target.value=''}});
$('clearResults').onclick=()=>{state.results=Array(15).fill('');save();renderMatches();calculate()};
$('resetBtn').onclick=()=>{if(confirm('Uygulamadaki kayıtları ilk hâline döndürmek istiyor musun?')){localStorage.removeItem('sporTotoState');location.reload()}};
load();state.matchNames=(state.matchNames||[]).slice(0,15);while(state.matchNames.length<15)state.matchNames.push('Maç '+(state.matchNames.length+1));state.results=(state.results||[]).map(normalize).slice(0,15);while(state.results.length<15)state.results.push('');updateHeader();renderMatches();calculate();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
