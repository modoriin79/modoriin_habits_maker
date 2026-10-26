import './style.css';
import { KEY, localDate, freshState, currentEntries, completedToday, addEntry, undoToday, loadState, saveState, validateState } from './state.js';
import { createScene } from './scene.js';
const $ = id => document.getElementById(id);
let state, busy = false, storageAvailable = true, scene;
const thumbs = new Map();
function error(message) { $('storage-error').textContent = message; $('storage-error').hidden = !message; }
try { state = loadState(); localStorage.setItem('little-ritual:probe','1');localStorage.removeItem('little-ritual:probe'); }
catch { state = freshState();storageAvailable = false;error('저장된 기록을 읽거나 저장할 수 없어요. 브라우저 저장소 설정을 확인해주세요. 기존 데이터는 덮어쓰지 않아요.'); }
try { scene = createScene($('scene')); }
catch (e) { $('render-error').hidden = false; console.error('3D initialization failed',e); }
function persist(next) {
 try { saveState(next); state = next; error('');return true; }
 catch { error('기록을 저장하지 못했어요. 저장 공간과 브라우저 설정을 확인한 뒤 다시 시도해주세요.');return false; }
}
function updateCollection() {
 const list = $('collection-list');
 $('collection-count').textContent = state.jars.length;
 if(!state.jars.length) {
  list.innerHTML = '<div class="empty-collection"><div class="empty-jar" aria-hidden="true"></div><div><p>첫 번째 빛깔을 기다리고 있어요</p><span>하루하루 모은 마음이, 이곳에 오래 남을 거예요.</span></div><span class="empty-number">01 — ∞</span></div>';return;
 }
 list.replaceChildren();
 state.jars.forEach((record,i)=>{
  const card=document.createElement('figure');card.className='jar-card';
  const key=JSON.stringify(record);if(!thumbs.has(key)&&scene)thumbs.set(key,scene.thumbnail(record));
  const img=document.createElement('img');img.src=thumbs.get(key)||'';img.alt=`${i+1}번째 완성된 유리병, 구슬 30개`;img.width=122;img.height=130;
  const caption=document.createElement('figcaption');caption.textContent=`NO. ${String(i+1).padStart(2,'0')}`;
  const date=document.createElement('time');date.dateTime=record.date;date.textContent=record.date.replaceAll('-','.');caption.append(date);card.append(img,caption);list.append(card);
 });
}
function sync({collection=false}={}) {
 const today=completedToday(state);const entries=currentEntries(state);
 $('habit-name').textContent=state.name||'나의 첫 번째 습관';
 $('count').textContent=entries.length;$('progress').style.width=`${entries.length/30*100}%`;
 $('jar-number').textContent=`JAR NO. ${String(state.jars.length+1).padStart(2,'0')}`;
 $('today-date').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).format(new Date());
 $('add-marble').disabled=busy||today||!state.name||!storageAvailable||!scene;
 $('edit-habit').disabled=busy||!storageAvailable;
 $('undo').hidden=!today||state.entries.at(-1)?.date!==localDate();$('undo').disabled=busy;
 $('status').textContent=today?'오늘의 습관을 지켰어요':'오늘의 작은 약속, 지키셨나요?';
 $('scene').setAttribute('aria-label',`투명한 유리병 안에 구슬 ${entries.length}개. ${today?'오늘 기록 완료':'오늘 기록 가능'}`);
 document.querySelector('.marble-instruction').innerHTML=today?'오늘도 잘했어요 <span>✓</span>':'오늘의 구슬 <span aria-hidden="true">↖</span>';
 document.querySelector('.marble-hint').textContent=today?'다음 구슬은 내일 만나요':'터치해서 병에 넣어주세요';
 scene?.load(entries.map(e=>e.position),today);
 if(collection)updateCollection();
}
function openHabit() {
 $('habit-input').value=state.name;$('cancel-edit').hidden=!state.name;
 $('habit-form').querySelector('.primary').innerHTML=state.name?'이름 저장하기 <span>↗</span>':'나의 유리병 시작하기 <span>↗</span>';
 $('habit-dialog').showModal();
}
$('habit-dialog').addEventListener('cancel',e=>{if(!state.name)e.preventDefault();});
$('edit-habit').onclick=openHabit;
$('cancel-edit').onclick=()=>$('habit-dialog').close();
document.querySelectorAll('.suggestions button').forEach(b=>b.onclick=()=>{$('habit-input').value=b.textContent;$('habit-input').focus();});
$('habit-form').onsubmit=e=>{e.preventDefault();const name=$('habit-input').value.trim();if(!name){$('habit-input').setCustomValidity('습관 이름을 입력해주세요.');$('habit-input').reportValidity();return;}if(persist({...state,name})){sync();$('habit-dialog').close();}};
$('habit-input').oninput=()=>$('habit-input').setCustomValidity('');
async function add() {
 if(busy||!scene||!storageAvailable||!state.name)return;
 busy=true;
 async function operation(){
  try {
   state=loadState();if(completedToday(state))return;
   const date=localDate();sync();document.querySelector('.ritual').classList.add('busy');$('status').textContent='작은 실천이 쌓이고 있어요…';
   const position=await scene.drop();
   const next=addEntry(state,{date,position});
   if(!persist(next))return;
   $('count').textContent=next.entries.length%30||30;$('progress').style.width=`${(next.entries.length%30||30)/30*100}%`;
   if(next.entries.length%30===0){
    $('status').textContent='서른 번의 실천, 나만의 빛깔이 되었어요';
    await scene.complete(next.jars.at(-1).color);
    updateCollection();$('collection-list').scrollTo({left:$('collection-list').scrollWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   }
  }catch(e){error('기록을 처리하지 못했어요. 새로고침 후 다시 확인해주세요.');console.error(e);}
 }
 try { if(navigator.locks) await navigator.locks.request('little-ritual-write',operation);else await operation(); }
 finally {busy=false;document.querySelector('.ritual').classList.remove('busy');sync();}
}
$('add-marble').onclick=add;
$('scene').addEventListener('pointerup',e=>{if(scene?.hit(e))add();});
$('undo').onclick=async()=>{
 if(busy)return;
 const operation=()=>{try{state=loadState();if(persist(undoToday(state)))sync({collection:true});}catch{error('기록을 읽지 못했어요. 새로고침 후 확인해주세요.');}};
 if(navigator.locks)await navigator.locks.request('little-ritual-write',operation);else operation();
};
$('about').onclick=()=>$('about-dialog').showModal();$('close-about').onclick=()=>$('about-dialog').close();
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`little-ritual-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{if(busy)throw new Error('구슬이 자리를 잡은 뒤 다시 시도해주세요.');if(file.size>10_000_000)throw new Error('백업 파일이 너무 커요.');const restored=validateState(JSON.parse(await file.text()));if(!confirm('현재 기록을 백업 파일의 기록으로 바꿀까요?'))return;if(persist(restored)){storageAvailable=true;sync({collection:true});$('about-dialog').close();}}
 catch(e){alert(e.message||'백업 파일을 불러올 수 없어요.');}finally{$('import').value='';}
};
let previousDay=localDate();
function checkDay(){if(busy)return;const day=localDate();if(day!==previousDay){previousDay=day;sync();}}
setInterval(checkDay,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkDay();});window.addEventListener('focus',checkDay);
window.addEventListener('storage',e=>{if(e.key===KEY&&!busy){try{state=loadState();sync({collection:true});}catch{error('다른 탭의 기록을 읽을 수 없어요.');}}});
sync({collection:true});if(!state.name&&storageAvailable)openHabit();
