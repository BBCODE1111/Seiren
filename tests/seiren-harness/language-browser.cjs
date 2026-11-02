// Real controls and project/download verification; no production test hooks.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const out=process.env.SEIREN_SCREENSHOT_DIR||'/tmp/seiren-language';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv[2]||'http://127.0.0.1:5181/',{waitUntil:'networkidle'});
  const language=async code=>{await page.locator(`[data-language="${code}"]`).click();await page.waitForFunction(c=>document.documentElement.lang===c,code);};
  const project=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('seiren-project')));
  const values=()=>page.locator('select').evaluateAll(es=>es.map(e=>({id:e.id,value:e.value,options:[...e.options].map(o=>o.value)})));
  assert.equal(await page.locator('#generate').innerText(),'產生和弦');
  await page.locator('.demo-menu summary').click();await page.locator('#ml-demo').click();
  await page.locator('#generate').click();
  const before=await project(),beforeValues=await values();
  await page.locator('#ml-roll [data-note="0"]').click();
  const selection=await page.locator('#ml-roll [data-note="0"]').getAttribute('class');
  await language('en');
  assert.equal(await page.locator('#generate').innerText(),'Generate harmony');
  assert.equal(await page.locator('#ml-listen option[value="original"]').innerText(),'Original audio + accompaniment');
  assert.deepEqual(await values(),beforeValues);assert.deepEqual(await project(),before);
  assert.equal(await page.locator('#ml-roll [data-note="0"]').getAttribute('class'),selection);
  await page.locator('#generate').click();
  assert.deepEqual((await project()).melody,before.melody);
  assert.match(await page.locator('#melodyStep').innerText(),/^Melody ready/);
  await page.locator('.harmony-versions summary').click();
  assert.match(await page.locator('#harmonyVersions option').nth(2).innerText(),/^Version /);
  await page.locator('.harmony-versions summary').click();
  await page.locator('#ml-settings-button').click();
  assert.equal(await page.locator('#ml-settings h3').innerText(),'MELODY SETTINGS');
  assert.match(await page.locator('#ml-tempo-notice').innerText(),/^Melody and accompaniment/);
  await page.keyboard.press('Escape');
  await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-pressed')==='true');
  const playingProject=await project();await language('zh-Hant');
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'true');assert.deepEqual(await project(),playingProject);
  await page.locator('#stop').click();assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#ml-listen option[value="original"]').innerText(),'原音檔＋和聲伴奏');
  await page.screenshot({path:path.join(out,'glass-zh-desktop.png')});
  await language('en');await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('#generate').innerText(),'Generate harmony');
  const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const d=await pending;
  const saved=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.deepEqual(saved.melody,(await project()).melody);
  const bad={...saved,settings:{...saved.settings,style:'invalid-style'}};
  await page.setInputFiles('#loadProject',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  assert.match(await page.locator('#status').innerText(),/^Invalid project setting:/);
  assert.deepEqual((await project()).bars,saved.bars);
  await page.locator('#dockMidi').click();await page.locator('#midi').waitFor({state:'visible'});
  const midiPending=page.waitForEvent('download');await page.locator('#midi').click();const midi=await midiPending;
  assert.equal(fs.readFileSync(await midi.path()).subarray(0,4).toString(),'MThd');await page.keyboard.press('Escape');
  await page.screenshot({path:path.join(out,'glass-en-desktop.png')});
  for(const width of [375,390]){
   await page.setViewportSize({width,height:844});
   for(const code of ['en','zh-Hant']){
    await language(code);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow');
    const rect=await page.locator('.language-switch').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width);
    const labels=await page.locator('.language-switch button').evaluateAll(es=>es.map(e=>({text:e.textContent,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
    assert.ok(labels.every(x=>x.w>=32&&x.h>=40));
    await page.screenshot({path:path.join(out,`glass-${code}-${width}.png`)});
   }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'language.json'),JSON.stringify({result:'PASS',languagePersistence:true,projectAndSelectionPreserved:true,playbackSwitch:true,dynamicErrors:true,midiExport:true,mobile:[375,390],errors},null,2));
  console.log(fs.readFileSync(path.join(out,'language.json'),'utf8'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
