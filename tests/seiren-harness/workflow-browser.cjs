// Real UI and Web Audio tests; no production hooks. Run against a local HTTP site.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..'),out=process.env.SEIREN_SCREENSHOT_DIR||'/tmp/seiren-web-20261103';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url());});
 await page.addInitScript(()=>{
  window.audioStarts=[];const start=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(when,offset,duration){window.audioStarts.push({length:this.buffer?.length,sampleRate:this.buffer?.sampleRate,rate:this.playbackRate.value,when,offset,duration});return start.apply(this,arguments);};
 });
 const url=process.argv[2]||'http://127.0.0.1:5181/';
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('seiren-project')));
 const loadProject=async p=>{await page.setInputFiles('#loadProject',{name:'test-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});};
 const setBpm=async value=>{await page.locator('#ml-settings-button').click();await page.locator('#ml-bpm').fill(String(value));await page.locator('#ml-bpm').press('Enter');await page.keyboard.press('Escape');};
 try{
  await page.goto(url,{waitUntil:'networkidle'});
  await page.setInputFiles('#ml-file',path.join(root,'examples/melody-108.mid'));
  await page.waitForFunction(()=>document.querySelectorAll('#ml-notes tr').length>0);
  const initial=await snapshot();assert.ok(initial.melody.notes.length);
  await page.locator('.chord-event').first().click();await page.locator('#editorLock').click();
  const locked=(await snapshot()).bars[0].chords[0];assert.equal(locked.locked,true);
  for(let i=0;i<7;i++)await page.locator('#generate').click();
  assert.equal(await page.locator('#harmonyVersions option').count(),7);
  const latest=await snapshot();assert.deepEqual(latest.melody.notes,initial.melody.notes);
  assert.deepEqual(latest.bars[0].chords[0],locked);
  await page.locator('.harmony-versions summary').click();
  const first=await page.locator('#harmonyVersions option').nth(1).getAttribute('value');
  await page.locator('#harmonyVersions').selectOption(first);await page.locator('#recallHarmony').click();
  assert.deepEqual((await snapshot()).melody.notes,initial.melody.notes);
  await page.locator('#workflowUndo').click();assert.deepEqual((await snapshot()).bars,latest.bars);
  assert.deepEqual((await snapshot()).source,latest.source);
  await page.locator('.harmony-versions summary').click();
  // Failed imports must leave the current project intact.
  await page.setInputFiles('#ml-file',{name:'broken.mid',mimeType:'audio/midi',buffer:Buffer.from('MThd')});
  await page.waitForFunction(()=>!document.querySelector('#ml-error').hidden);
  assert.deepEqual((await snapshot()).melody.notes,initial.melody.notes);
  const invalid=structuredClone(latest);invalid.settings.style='not-a-style';await loadProject(invalid);
  assert.deepEqual((await snapshot()).bars,latest.bars);
  // Draft state survives reopening; confirmation is explicit.
  const draft=structuredClone(latest);draft.melody.reviewRequired=true;draft.bars=draft.bars.map(()=>({chords:[]}));draft.source=draft.bars;
  await loadProject(draft);await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#generate').isDisabled(),true);
  assert.equal((await snapshot()).melody.reviewRequired,true);
  await page.locator('#ml-confirm').click();assert.equal((await snapshot()).melody.reviewRequired,false);
  const pickupBytes=await page.evaluate(async()=>{
   const {encodeMidi}=await import('./midi.js');return [...encodeMidi({melody:[{pitch:67,start:-1,end:-.5},{pitch:72,start:0,end:1},{pitch:76,start:3,end:6}],pickupBeats:1,meter:{numerator:3,denominator:4},tempoMap:[{beat:0,bpm:90}],totalBeats:6})];
  });
  await page.setInputFiles('#ml-file',{name:'pickup-3-4.mid',mimeType:'audio/midi',buffer:Buffer.from(pickupBytes)});
  await page.waitForFunction(()=>document.querySelector('#ml-status').textContent.includes('pickup-3-4.mid'));
  const pickupProject=await snapshot();assert.equal(pickupProject.melody.pickupBeats,1);assert.equal(pickupProject.melody.meter.numerator,3);
  await setBpm(120);await page.locator('#generate').click();assert.deepEqual((await snapshot()).melody.notes,pickupProject.melody.notes);
  // Audio transcription and original-recording tempo changes run the real worker.
  await page.setInputFiles('#ml-file',path.join(root,'examples/melody-108.wav'));
  await page.waitForFunction(()=>!document.querySelector('#ml-review').hidden&&!document.querySelector('#ml-confirm').disabled,{},{timeout:120000});
  assert.equal(await page.locator('#generate').isDisabled(),true);
  await page.locator('#ml-confirm').click();
  await page.locator('#ml-listen').selectOption('original');
  const recording=await snapshot(),sourceBpm=recording.melody.bpm;
  const audioInfo=await page.evaluate(async()=>{const ctx=new OfflineAudioContext(1,1,44100),b=await ctx.decodeAudioData(await(await fetch('./examples/melody-108.wav')).arrayBuffer());return {length:b.length,sampleRate:b.sampleRate};});
  for(const ratio of [.8,1.25]){
   await setBpm(sourceBpm*ratio);
   assert.equal(await page.locator('#ml-listen').inputValue(),'original');
   assert.equal(await page.locator('#ml-listen option[value=original]').isDisabled(),false);
   assert.deepEqual((await snapshot()).melody.notes,recording.melody.notes);
   await page.evaluate(()=>window.audioStarts=[]);await page.locator('#play').click();
   await page.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-pressed')==='true');
   const starts=await page.evaluate(()=>window.audioStarts);
   // Decode in the app uses 22050Hz. The playback buffer retains that sample rate.
   const expected=Math.ceil(audioInfo.length/audioInfo.sampleRate*22050/ratio);
   assert.ok(starts.some(s=>Math.abs(s.length-expected)<=1&&s.rate===1),'missing pitch-preserved original buffer');
   await page.locator('#stop').click();
  }
  // Rapid stop cancels pending preparation and cannot start stale playback.
  await setBpm(sourceBpm*.9);await page.locator('#play').click();await page.locator('#stop').click();await page.waitForTimeout(300);
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  // Back to unprocessed source, same notes and timeline.
  await setBpm(sourceBpm);assert.equal(await page.locator('#ml-listen').inputValue(),'original');
  const loopCheck=await page.evaluate(async()=>{
   const {MelodyPlayer}=await import('./player.js?v=seiren-web-2');
   const p=new MelodyPlayer();await p.unlock();
   const source=p.context.createBuffer(2,p.context.sampleRate*2,p.context.sampleRate);
   for(let c=0;c<2;c++){const data=source.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=Math.sin(2*Math.PI*220*i/source.sampleRate)*.1;}
   const args={melody:[],accompaniment:[],tempoMap:[{beat:0,bpm:240}],totalBeats:4,sourceBuffer:source,sourceBpm:192,downbeatTime:60/192,startBeat:-1,pickupBeats:1,loop:true,mode:'original'};
   window.audioStarts=[];const ticks=[];await p.play({...args,onTick:(beat,t)=>ticks.push({beat,cycle:t.cycle})});
   await new Promise(r=>setTimeout(r,1550));
   const starts=window.audioStarts.slice();p.setLoop(false);p.stop();await p.context.close();
   return {starts,ticks,stopped:!p.playing&&p.sources.size===0};
  });
  assert.ok(loopCheck.ticks.some(t=>t.beat<0&&t.cycle===0),'missing first pickup');
  assert.ok(loopCheck.ticks.some(t=>t.cycle===1&&t.beat>=0),'loop did not return to bar 1');
  assert.ok(loopCheck.starts.some(s=>Math.abs(s.offset)<.01),'pickup offset not scaled with tempo');
  assert.ok(loopCheck.starts.some(s=>Math.abs(s.offset-.25)<.02),'loop offset not scaled with tempo');
  assert.ok(loopCheck.stopped);
  await page.locator('#saveProject').click();
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:false});
  // Restore a compact MIDI project for mobile editing and automatic/manual following.
  await loadProject(latest);await setBpm(260);
  for(const viewport of [{width:375,height:667},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.locator('#play').click();
   await page.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-pressed')==='true');
   await page.waitForTimeout(2200);
   assert.equal(await page.locator('#followPlayback').getAttribute('aria-pressed'),'true');
   await page.locator('#grid').dispatchEvent('wheel',{deltaX:120});
   assert.equal(await page.locator('#followPlayback').getAttribute('aria-pressed'),'false');
   await page.evaluate(()=>document.querySelector('#grid').scrollLeft=0);await page.waitForTimeout(250);
   assert.equal(await page.locator('#grid').evaluate(el=>el.scrollLeft),0);
   await page.locator('#followPlayback').click();
   assert.equal(await page.locator('#followPlayback').getAttribute('aria-pressed'),'true');
   await page.locator('.seiren-inspector').scrollIntoViewIfNeeded();
   const layout=await page.evaluate(()=>{const score=document.querySelector('.score').getBoundingClientRect(),play=document.querySelector('#play').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth-innerWidth,scoreTop:score.top,playVisible:document.elementFromPoint(play.x+play.width/2,play.y+play.height/2)?.closest('#play')!==null};});
   assert.ok(layout.overflow<=1,JSON.stringify(layout));assert.ok(layout.scoreTop>=0&&layout.scoreTop<8);assert.ok(layout.playVisible);
   await page.screenshot({path:path.join(out,`mobile-${viewport.width}.png`)});await page.locator('#stop').click();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  const result={result:'PASS',versions:6,midiImport:true,lockedChordPreserved:true,threeFourMidiPickup:true,failedImportPreserved:true,draftReload:true,audioTranscription:true,pitchPreservedOriginalPlayback:[.8,1.25],tempoNotesUnchanged:true,stretchedPickupAndLoop:true,cancel:true,mobile:[375,390],errors,failures};
  fs.writeFileSync(path.join(out,'workflow.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
