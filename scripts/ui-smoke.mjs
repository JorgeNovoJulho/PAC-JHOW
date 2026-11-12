import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const port=8789;
const server=spawn('python3',['-m','http.server',String(port)],{stdio:'ignore'});
const url='http://127.0.0.1:'+port+'/';
const targets=[
 {name:'android-small',width:320,height:640,mobile:true},
 {name:'android-360',width:360,height:780,mobile:true},
 {name:'android-390',width:390,height:844,mobile:true},
 {name:'android-412',width:412,height:915,mobile:true},
 {name:'windows-desktop',width:1366,height:768,mobile:false}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
mkdirSync('ui-smoke-results',{recursive:true});
let failures=0;
try{
 for(const item of targets){
  const context=await browser.newContext({viewport:{width:item.width,height:item.height},deviceScaleFactor:1,hasTouch:item.mobile,isMobile:item.mobile,userAgent:item.mobile?'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1300);
  const status=await page.evaluate(()=>{
    const r=id=>document.getElementById(id)?.getBoundingClientRect();
    const canvas=r('game'),hud=r('hud'),controls=r('pac-touch-controls'),scene=r('scene');
    const visible=rect=>rect&&rect.width>20&&rect.height>20;
    const portrait=innerHeight>innerWidth;
    const touch=document.documentElement.classList.contains('pac-mobile');
    return {touch,canvas:visible(canvas),hud:visible(hud),controls:visible(controls),
      order:!touch||!portrait||Boolean(controls&&scene&&controls.top>=scene.top),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+4,
      controlButtons:document.querySelectorAll('#pac-touch-controls [data-key]').length};
  });
  await page.screenshot({path:'ui-smoke-results/'+item.name+'.png',fullPage:true});
  const fails=[];
  if(errors.length)fails.push('JS: '+errors.join('; '));
  if(!status.canvas||!status.hud)fails.push('canvas/HUD invisible');
  if(status.horizontalOverflow)fails.push('horizontal page overflow');
  if(item.mobile&&(!status.touch||!status.controls||!status.order||status.controlButtons!==4))fails.push('mobile controls invalid');
  if(!item.mobile&&status.touch)fails.push('desktop was switched to mobile UI');
  if(item.mobile){
    await page.evaluate(()=>document.getElementById('btn-settings')?.click());
    await page.waitForTimeout(180);
    const modal=await page.evaluate(()=>{
      const p=document.querySelector('#ov-settings .panel');
      const box=p?.getBoundingClientRect();
      return {shown:document.getElementById('ov-settings')?.classList.contains('show'),width:box?.width||0,windowWidth:innerWidth};
    });
    if(!modal.shown||modal.width>modal.windowWidth+1)fails.push('settings modal not responsive');
  }
  if(!item.mobile){
    await page.waitForFunction(()=>window.PAC_MUSIC_LIBRARY?.ready===true,{timeout:10000}).catch(()=>{});
    const features=await page.evaluate(async()=>{
      const saveBtn=document.getElementById('btn-save-game');
      document.getElementById('btn-play')?.click();
      saveBtn?.click();
      const saved=JSON.parse(localStorage.getItem('movel-studio-pacman-save')||'null');
      let libraryAdded=false;
      try{
        await window.PAC_MUSIC_LIBRARY.add(
          new File([new Uint8Array(256)],'smoke-test.mp3',{type:'audio/mpeg'}),
          'smoke-test.mp3',{start:false});
        libraryAdded=AudioSys.trackCount()===7;
      }catch(e){return {saveButton:!!saveBtn,saved,libraryAdded,error:String(e)};}
      return {saveButton:!!saveBtn,saved,libraryAdded};
    });
    if(!features.saveButton||!features.saved?.level||!features.libraryAdded)fails.push('save / playlist failed: '+JSON.stringify(features));
    await page.reload({waitUntil:'domcontentloaded'});
    try{await page.waitForFunction(()=>window.PAC_MUSIC_LIBRARY?.ready===true,{timeout:10000});}catch(_){}
    const persistent=await page.evaluate(()=>({
      tracks:AudioSys.trackCount(),
      playlist:window.PAC_MUSIC_LIBRARY?.list().map(x=>x.name),
      saved:JSON.parse(localStorage.getItem('movel-studio-pacman-save')||'null')
    }));
    if(persistent.tracks!==7||!persistent.playlist?.includes('smoke-test.mp3')||!persistent.saved?.level)
      fails.push('playlist persistence failed: '+JSON.stringify(persistent));
  }
  if(!item.mobile){
    // Nine actual rendered maze screenshots for human approval.
    for(let level=2;level<=20;level++){
      const stat=await page.evaluate(level=>{
        document.querySelectorAll('.overlay.show').forEach(el=>el.classList.remove('show'));
        initLevel(level);
        return {level:game.level,pellets:game.dotsTotal,rows:game.grid.length,cols:game.grid[0].length};
      },level);
      await page.waitForTimeout(70);
      await page.locator('#game').screenshot({path:'ui-smoke-results/maze-level-'+String(level).padStart(2,'0')+'.png'});
      if(stat.level!==level||stat.rows!==31||stat.cols!==28||stat.pellets<210)
        fails.push('maze-level-'+level+': '+JSON.stringify(stat));
    }
  }
  if(fails.length){failures++;console.error('FAIL '+item.name,JSON.stringify({fails,status,errors}));}
  else console.log('PASS '+item.name,JSON.stringify(status));
  await context.close();
 }
}finally{await browser.close();server.kill();}
if(failures)process.exit(1);
