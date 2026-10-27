const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [,,outFile,...samples]=process.argv;
(async()=>{const browser=await chromium.launch();const res=[];
 for(const sample of samples){const page=await browser.newPage();
  await page.goto('http://localhost:5181/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__seiren&&window.__seiren.lab);
  await page.setInputFiles('#ml-file',sample);
  await page.waitForFunction(()=>{const l=window.__seiren.lab;return (l.notes?.length&&!l.busy)||document.querySelector('#ml-error')?.textContent.trim();},null,{timeout:240000}).catch(()=>{});
  res.push({sample:path.basename(sample),...await page.evaluate(()=>{const l=window.__seiren.lab;return {bpm:l.bpm,key:l.key,downbeatTime:l.downbeatTime,pickupBeats:l.pickupBeats,tempoMap:l.tempoMap.slice(0,3),tempoMapLen:l.tempoMap.length,cands:l.features?.candidates?.map(c=>c.bpm),beats:l.features?.beats?.slice(0,8),firstNote:l.audioNotes?.[0]?.start,notes:l.notes.slice(0,4)};})});
  await page.close();}
 fs.writeFileSync(outFile,JSON.stringify(res));await browser.close();})();
