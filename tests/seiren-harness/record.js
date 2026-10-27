// Records Seiren's real Web Audio output (tap on destination) for a given listen mode.
const {chromium}=require('playwright');const fs=require('fs');
const [,,sample,outPrefix,mode,style,pattern]=process.argv;
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();const logs=[];page.on('console',m=>logs.push(m.text()));page.on('pageerror',e=>logs.push('ERR '+e.message));
 await page.addInitScript(()=>{
  window.__recs=[];
  const orig=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(target,...rest){
   if(target instanceof AudioDestinationNode){const ctx=target.context;
    if(!ctx.__tap){const rec={sr:ctx.sampleRate,chunks:[],energy:0};window.__recs.push(rec);const sp=ctx.createScriptProcessor(4096,2,2);sp.onaudioprocess=e=>{if(window.__recording){const a=e.inputBuffer.getChannelData(0),b=e.inputBuffer.getChannelData(1);const m=new Float32Array(a.length);for(let i=0;i<a.length;i++){m[i]=(a[i]+b[i])/2;rec.energy+=m[i]*m[i];}rec.chunks.push(m);}};orig.call(sp,target);ctx.__tap=sp;ctx.__sr=ctx.sampleRate;}
    orig.call(this,ctx.__tap);}
   return orig.call(this,target,...rest);
  };
 });
 await page.goto('http://localhost:5181/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__seiren&&window.__seiren.lab);
 await page.setInputFiles('#ml-file',sample);
 await page.waitForFunction(()=>{const l=window.__seiren.lab;return l.notes?.length&&!l.busy;},null,{timeout:240000});
 if(await page.evaluate(()=>window.__seiren.lab.reviewRequired))await page.click('#ml-confirm');
 await page.waitForTimeout(300);
 if(style&&style!=='-')await page.evaluate(s=>window.__seiren.generate(s),style);
 if(pattern&&pattern!=='-')await page.evaluate(p=>window.__seiren.setPattern(p),pattern);
 await page.evaluate(m=>{const l=window.__seiren.lab;l.mode=m;},mode);
 const info=await page.evaluate(()=>{const s=window.__seiren,l=s.lab;return {mode:l.mode,bpm:l.bpm,tempoMap:l.tempoMap,downbeat:l.downbeatTime,pickup:s.pickup(),bars:s.bars,acc:s.render().accompaniment,notes:l.notes,bufferDur:l.buffer?.duration,bufferSR:l.buffer?.sampleRate};});
 await page.evaluate(()=>{window.__recording=true;});
 const t=await page.evaluate(()=>performance.now());
 await page.click('#play');
 await page.waitForFunction(()=>document.querySelector('#play')?.getAttribute('aria-pressed')==='true',null,{timeout:20000}).catch(()=>{});
 const origin=await page.evaluate(()=>{const p=[...Object.values(window)].find(v=>v&&v.constructor&&v.constructor.name==='MelodyPlayer');return null;});
 await page.waitForTimeout(Math.ceil((info.tempoMap[0]?60/info.tempoMap[0].bpm:0.75)*(info.bars.length*4)*1000)+2500);
 await page.evaluate(()=>{window.__recording=false;const rec=window.__recs.sort((a,b)=>b.energy-a.energy)[0];const n=rec.chunks.reduce((s,a)=>s+a.length,0);window.__all=new Float32Array(n);let o=0;for(const a of rec.chunks){window.__all.set(a,o);o+=a.length;}window.__allSR=rec.sr;window.__nrec=window.__recs.map(r=>[r.sr,r.energy,r.chunks.length]);});
 const n=await page.evaluate(()=>window.__all.length);const chunks=[];
 for(let i=0;i<n;i+=200000){chunks.push(await page.evaluate(([i])=>{const sl=window.__all.slice(i,i+200000);let s='';const u=new Uint8Array(sl.buffer);for(let k=0;k<u.length;k+=8192)s+=String.fromCharCode(...u.subarray(k,k+8192));return btoa(s);},[i]));}
 fs.writeFileSync(outPrefix+'.f32',Buffer.concat(chunks.map(c=>Buffer.from(c,'base64'))));
 info.recSR=await page.evaluate(()=>window.__allSR);info.recs=await page.evaluate(()=>window.__nrec);
 fs.writeFileSync(outPrefix+'.json',JSON.stringify({...info,logs:logs.slice(-15)}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
