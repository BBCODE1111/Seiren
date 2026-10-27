import test from 'node:test';
import assert from 'node:assert/strict';
import {renderProtected} from '../../fusion.js';
import {patterns} from '../../performance.js';
import {demoMelody,auditHarmony,overlaps} from '../../harmony.js';
import {melodyBusyAt} from '../../piano-motion.js';
import {vocalPhrases} from './fixtures/vocal-phrases.mjs';
const ids=Object.keys(patterns).filter(id=>/^pop[A-Z]|^texture/.test(id));
const chart=['C','G','Am','F','C','G','F','G'].map(symbol=>({chords:[{symbol,beats:4}]}));
const opts={human:0,popFill:'off',key:{root:0,mode:'major'},policy:'musical'};
const render=(id,pianoPhrase,melody)=>renderProtected(chart,id,{...opts,pianoPhrase},melody).accompaniment;
test('18 first-bar rhythm fingerprints remain distinct in 4/4, 3/4 and 6/8 with fills off',()=>{
 for(const [barBeats,meter] of [[4,{numerator:4,denominator:4}],[3,{numerator:3,denominator:4}],[3,{numerator:6,denominator:8}]]){
  const seen=new Map();for(const id of ids){
   const ns=renderProtected([{chords:[{symbol:'C',beats:barBeats}]}],id,{...opts,barBeats,meter},[]).notes;
   const sig=JSON.stringify(ns.map(n=>[+n.beat.toFixed(6),n.role,+n.duration.toFixed(6)]));
   assert.ok(!seen.has(sig),`${meter.numerator}/${meter.denominator}: ${id} equals ${seen.get(sig)}`);seen.set(sig,id);
   if(meter.numerator===3)assert.ok(ns.filter(n=>n.role==='bass').every(n=>n.beat===0),id+' waltz bass');
  }assert.equal(seen.size,18);
 }
});
test('demo quarter notes are not busy and AUTO retains audible phrase form',()=>{
 const melody=demoMelody();for(let beat=0;beat<32;beat++)assert.equal(melodyBusyAt(melody,beat),false);
 for(const id of ids)assert.notDeepEqual(render(id,'auto',melody),render(id,'space',melody),id);
});
test('vocal-like long tones and breaths retain AUTO and two/four contrast',()=>{
 for(const {name,notes} of vocalPhrases)for(const id of ids){
  const space=render(id,'space',notes),auto=render(id,'auto',notes);assert.notDeepEqual(auto,space,name+' '+id);
  const two=render(id,'two',notes).filter(n=>n.role!=='bass'),four=render(id,'four',notes).filter(n=>n.role!=='bass');
  assert.ok(Math.abs(two.length-four.length)/two.length>=.15,`${name} ${id}: two=${two.length} four=${four.length}`);
 }
});
test('low vocal range keeps upper voices clear, melody unchanged and actual intervals safe',()=>{
 const melody=vocalPhrases[0].notes.map(n=>({...n,pitch:n.pitch-12})),before=structuredClone(melody);
 for(const id of ids)for(const pianoPhrase of ['original','space','two','four','auto']){
  const out=render(id,pianoPhrase,melody),upper=out.filter(n=>n.role!=='bass');assert.ok(upper.length,id+' useful upper voices');
  assert.equal(auditHarmony(melody,out,{policy:'musical'}).length,0);
  for(let i=0;i<upper.length;i++)for(let j=i+1;j<upper.length;j++){
   const a=upper[i],b=upper[j];assert.ok(!(Math.min(a.pitch,b.pitch)<52&&Math.abs(a.pitch-b.pitch)>0&&Math.abs(a.pitch-b.pitch)<7&&overlaps(a,b)),id+' muddy upper interval');
  }
 }assert.deepEqual(melody,before);
});

test('light eighths alternate single offbeats and chords while retaining the old project version',async()=>{
 const {performance}=await import('../../performance.js');
 const modern=performance(chart,'popEighth',opts),legacy=performance(chart,'popEighth',{...opts,pianoRevision:1});
 for(let beat=.5;beat<32;beat++)assert.equal(modern.filter(n=>n.role!=='bass'&&n.beat===beat).length,1);
 assert.ok(legacy.filter(n=>n.role!=='bass').length>modern.filter(n=>n.role!=='bass').length);
});
test('pedal export remains melody-safe across patterns, vocal phrases, meters and pickup',async()=>{
 const {encodeAuditedMidi}=await import('../../export.js'),{parseMidi}=await import('../../midi.js'),{midiControls}=await import('../music-core/midi-test-reader.mjs');
 for(const [barBeats,meter] of [[4,{numerator:4,denominator:4}],[3,{numerator:3,denominator:4}],[3,{numerator:6,denominator:8}]])for(const phrase of vocalPhrases){
  const melody=[{pitch:64,start:-1,end:-.5},...phrase.notes.map(n=>({...n,start:n.start*barBeats/4,end:n.end*barBeats/4}))],bars=chart.map(b=>({chords:b.chords.map(c=>({...c,beats:barBeats}))}));
  for(const id of ids){
   const out=renderProtected(bars,id,{...opts,barBeats,meter,pianoPhrase:'auto'},melody);
   const data={pedal:true,pickupBeats:1,melody,accompaniment:out.accompaniment,totalBeats:8*barBeats,policy:'musical',meter,separateBass:true,chordMarkers:bars.map((b,i)=>({start:i*barBeats,symbol:b.chords[0].symbol}))};
   const bytes=encodeAuditedMidi(data),decoded=parseMidi(bytes),actual=decoded.tracks.filter(t=>t.channel===1).flatMap(t=>t.notes).map(n=>({...n,chord:out.accompaniment.find(a=>a.pitch===n.pitch&&Math.abs(a.start-n.start)<.003)?.chord}));
   assert.equal(auditHarmony(melody,actual,{policy:'musical'}).length,0,id);assert.equal(decoded.pickupBeats,1);
   const {controls}=midiControls(bytes);assert.ok(controls.some(c=>c.controller===64&&c.value===127));assert.ok(controls.every(c=>c.channel===1));assert.equal(controls.at(-1).value,0);
  }
 }
});
