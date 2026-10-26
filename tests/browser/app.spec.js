import { test, expect } from '@playwright/test';
async function seed(page,n){
 await page.goto('/');
 await page.evaluate(async n=>{
  const {freshState,addEntry,saveState,localDate}=await import('/src/state.js');
  const {createPhysics}=await import('/src/physics.js');
  let s=freshState('하루 10분 책 읽기');let positions=[];
  for(let i=0;i<n;i++){
   const p=createPhysics(positions);const b=p.add([Math.sin(i*2.4)*.15,3.9,Math.cos(i*2.4)*.15]);b.velocity.set(Math.sin(i)*.3,0,Math.cos(i)*.3);for(let j=0;j<840;j++)p.world.step(1/120);
   const pos=[b.position.x,b.position.y,b.position.z];positions.push(pos);
   const d=new Date();d.setDate(d.getDate()-(n-i));s=addEntry(s,{date:localDate(d),position:pos},()=>.2);if(positions.length===30)positions=[];
  }
  saveState(s);
 },n);
 await page.reload();
}
test('first habit, real drop, daily lock, persistence, undo',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.getByLabel('나의 습관',{exact:true}).fill('하루 10분 책 읽기');await page.getByRole('button',{name:'나의 유리병 시작하기'}).click();
 await expect(page.locator('#count')).toHaveText('0');await page.screenshot({path:'/tmp/little-ritual-empty.png',fullPage:true});
 await page.getByRole('button',{name:'오늘의 구슬 넣기'}).click();await expect(page.locator('#status')).toHaveText('오늘의 습관을 지켰어요',{timeout:20000});await expect(page.locator('#count')).toHaveText('1');await expect(page.locator('#add-marble')).toBeDisabled();
 const saved=await page.evaluate(()=>localStorage.getItem('little-ritual:v1'));await page.reload();await expect(page.locator('#count')).toHaveText('1');expect(await page.evaluate(()=>localStorage.getItem('little-ritual:v1'))).toBe(saved);
 await page.getByRole('button',{name:'오늘 기록 취소'}).click();await expect(page.locator('#count')).toHaveText('0');await expect(page.locator('#add-marble')).toBeEnabled();expect(errors).toEqual([]);
});
test('29th state, full completion, stable color, 30th undo',async({page})=>{
 await seed(page,29);await expect(page.locator('#count')).toHaveText('29');await page.screenshot({path:'/tmp/little-ritual-29.png',fullPage:true});
 await page.locator('#add-marble').click();await expect(page.locator('.jar-card')).toHaveCount(1,{timeout:25000});await expect(page.locator('#count')).toHaveText('0');await expect(page.locator('#status')).toHaveText('오늘의 습관을 지켰어요');
 const color=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-ritual:v1')).jars[0].color);await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('little-ritual:v1')).jars[0].color)).toBe(color);await page.screenshot({path:'/tmp/little-ritual-complete.png',fullPage:true});
 await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('29');await expect(page.locator('.jar-card')).toHaveCount(0);await expect(page.locator('#add-marble')).toBeEnabled();
});
test('mobile touch, new local day and horizontal shelf',async({page})=>{
 await page.setViewportSize({width:390,height:844});await seed(page,1);await page.screenshot({path:'/tmp/little-ritual-mobile.png',fullPage:true});await page.locator('#add-marble').dispatchEvent('click');await expect(page.locator('#count')).toHaveText('2',{timeout:20000});
 await page.evaluate(async()=>{const {loadState,saveState}=await import('/src/state.js');const s=loadState();s.entries.at(-1).date='2020-01-01';saveState(s);});await page.reload();await expect(page.locator('#add-marble')).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

 test('touch screen and horizontally scrolling collection',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 await seed(page,90);await expect(page.locator('.jar-card')).toHaveCount(3);
 expect(await page.locator('#collection-list').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/little-ritual-collection-mobile.png',fullPage:true});
 await page.locator('#add-marble').tap();await expect(page.locator('#count')).toHaveText('1',{timeout:20000});await context.close();
 });
