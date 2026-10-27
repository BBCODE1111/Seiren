const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [,,outDir,...samples]=process.argv;
(async()=>{
 const browser=await chromium.launch();
 for(const sample of samples){
  const page=await browser.newPage();const logs=[];page.on('pageerror',e=>logs.push(e.message));
  await page.goto('http://localhost:5181/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__seiren&&window.__seiren.lab);
  await page.setInputFiles('#ml-file',sample);
  try{await page.waitForFunction(()=>{const l=window.__seiren.lab;return (l.notes?.length&&!l.busy)||document.querySelector('#ml-error')?.textContent.trim();},null,{timeout:240000});}catch(e){logs.push('timeout');}
  const pre=await page.evaluate(()=>{const l=window.__seiren.lab;return {reviewRequired:l.reviewRequired,bpm:l.bpm,key:l.key,downbeatTime:l.downbeatTime,pickupBeats:l.pickupBeats,tempoMap:l.tempoMap,audioNotes:l.audioNotes,beats:l.features?.beats,candidates:l.features?.candidates,error:document.querySelector('#ml-error')?.textContent.trim()};});
  if(pre.reviewRequired)await page.click('#ml-confirm').catch(()=>{});
  await page.waitForTimeout(300);
  const snap=label=>page.evaluate(label=>{const s=window.__seiren,l=s.lab,r=s.render();return {label,bars:s.bars,pickup:s.pickup(),barBeats:s.barBeats(),acc:r.accompaniment,adjusted:r.adjusted,removed:r.removed,pattern:s.el('pattern').value,style:s.el('style').value,key:l.key};},label);
  const runs=[await snap('default')];
  const styles=await page.evaluate(()=>window.__seiren.styles());
  for(const st of styles){for(let v=0;v<3;v++){try{await page.evaluate(([st,v])=>window.__seiren.generate(st,v>0),[st,v]);runs.push(await snap(st+'#'+v));}catch(e){logs.push(st+': '+e.message);}}}
  const notes=await page.evaluate(()=>window.__seiren.lab.notes);
  fs.writeFileSync(path.join(outDir,path.basename(sample).replace(/\.\w+$/,'')+'.json'),JSON.stringify({sample:path.basename(sample),pre,notes,runs,logs}));
  console.log('done',path.basename(sample),runs.length,logs.length);
  await page.close();
 }
 await browser.close();
})();
