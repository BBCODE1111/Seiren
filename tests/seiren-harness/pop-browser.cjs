// Run against a served site. No application test hook is required or shipped.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--autoplay-policy=no-user-gesture-required']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url());});
 await page.addInitScript(()=>{
  window.__testEnergy=0;const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(target,...args){if(target instanceof AudioDestinationNode){const ctx=target.context;if(!ctx.__testTap){const tap=ctx.createScriptProcessor(2048,2,2);tap.onaudioprocess=e=>{for(const n of e.inputBuffer.getChannelData(0))window.__testEnergy+=n*n;};connect.call(tap,target);ctx.__testTap=tap;}connect.call(this,ctx.__testTap);}return connect.call(this,target,...args);};
 });
 const url=process.argv[2]||'http://127.0.0.1:5181/';
 await page.goto(url,{waitUntil:'networkidle'});
 assert.equal(await page.locator('#style').inputValue(),'Mandopop');
 assert.equal(await page.locator('#style option').first().getAttribute('value'),'Mandopop');
 assert.equal(await page.locator('[data-compare-style]').first().getAttribute('data-compare-style'),'Mandopop');
 const ideas=await page.locator('#library option').count();assert.ok(ideas>=36);
 await page.locator('#library').selectOption('mandarin-canon-clear');await page.locator('#loadPreset').click();
 assert.equal(await page.locator('#pattern').inputValue(),'popSplit');
 await page.locator('.demo-menu summary').click();await page.locator('#ml-demo').click();
 await page.locator('[data-compare-style="Mandopop"]').click();
 const layout=await page.evaluate(()=>({editor:document.querySelector('.seiren-editor').getBoundingClientRect().top,inspector:document.querySelector('.seiren-inspector').getBoundingClientRect().top}));assert.ok(Math.abs(layout.editor-layout.inspector)<2);
 const charts=new Set;for(let i=0;i<6;i++){await page.locator('#generate').click();charts.add(await page.locator('#grid').innerText());}assert.ok(charts.size>=3);
 const patterns=await page.locator('#pattern option').evaluateAll(es=>es.map(e=>e.value).filter(v=>/^pop[A-Z]/.test(v)));assert.equal(patterns.length,12);
 let downloads=0;
 for(const pattern of patterns){
  await page.locator('#pattern').selectOption(pattern);
  const before=await page.evaluate(()=>window.__testEnergy);await page.locator('#play').click();
  await page.waitForFunction(n=>window.__testEnergy>n+.01,before,{timeout:20000});await page.locator('#stop').click();
  await page.locator('#dockMidi').click();const pending=page.waitForEvent('download');await page.locator('#midi').click();const d=await pending;assert.equal(await d.failure(),null);const file=await d.path();assert.ok(fs.readFileSync(file).subarray(0,4).equals(Buffer.from('MThd')));downloads++;
  await page.keyboard.press('Escape');
 }
 await page.locator('#pattern').selectOption('popCadence');await page.locator('#popFill').selectOption('off');
 const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const saved=await pending;const file=await saved.path();
 const project=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(project.settings.popFill,'off');assert.equal(project.settings.pattern,'popCadence');
 await page.locator('#popFill').selectOption('more');await page.setInputFiles('#loadProject',file);await page.waitForFunction(()=>document.getElementById('popFill').value==='off');assert.equal(await page.locator('#popFill').inputValue(),'off');
 await page.locator('#popFill').selectOption('auto');
 if(process.env.SEIREN_SCREENSHOT_DIR){fs.mkdirSync(process.env.SEIREN_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:process.env.SEIREN_SCREENSHOT_DIR+'/mandarin-desktop.png',fullPage:true});}
 await page.setViewportSize({width:390,height:844});await page.locator('.demo-menu summary').click();await page.locator('#ml-demo').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(process.env.SEIREN_SCREENSHOT_DIR)await page.screenshot({path:process.env.SEIREN_SCREENSHOT_DIR+'/mandarin-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 console.log(JSON.stringify({result:'PASS',ideas,generatedCharts:charts.size,patterns:patterns.length,midiDownloads:downloads,audioOutput:true,projectRoundTrip:true,mobile:true,errors,failures}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
