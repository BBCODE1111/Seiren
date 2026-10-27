import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PIANO_MOTION_VERSION,texturePatterns} from '../../piano-motion.js';
import {performance} from '../../performance.js';
import {parseChart} from '../../solutions.js';
import {arrangeMelody} from '../../melody-arranger.js';
import {chartFromSegments,renderProtected} from '../../fusion.js';
import {auditHarmony} from '../../harmony.js';
import {encodeAuditedMidi} from '../../export.js';
import {parseMidi} from '../../midi.js';
const ids=Object.keys(texturePatterns);
test('Seiren independently carries the pinned piano motion module',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../music-core/motion-manifest.json',import.meta.url)));
 assert.equal(PIANO_MOTION_VERSION,manifest.version);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../../piano-motion.js',import.meta.url))).digest('hex'),manifest.sha256);
});
test('all six textures honor fill controls, silence and held melody in Seiren',()=>{
 const chart=parseChart('| C | C | C | C |');
 for(const id of ids){
  assert.ok(performance(chart,id,{popFill:'auto'}).some(n=>n.fill));
  assert.equal(performance(chart,id,{popFill:'off'}).filter(n=>n.fill).length,0);
  assert.equal(performance(chart,id,{melody:[{pitch:72,start:0,end:16}]}).filter(n=>n.fill).length,0);
  const silent=performance(parseChart('| C | C | C | N.C. |'),id,{popFill:'auto'});assert.equal(silent.filter(n=>n.fill).length,0);assert.ok(silent.every(n=>n.beat+n.duration<=12));
 }
});
test('textures preserve melody and export protected notes across keys, modes, meters and pickups',()=>{
 for(let root=0;root<12;root++)for(const mode of ['major','minor'])for(const [bb,meter] of [[4,{numerator:4,denominator:4}],[3,{numerator:3,denominator:4}],[3,{numerator:6,denominator:8}]]){
  const third=mode==='minor'?3:4;
  const melody=[{pitch:72+root,start:.5,end:1},{pitch:72+root+third,start:bb,end:bb+.75},{pitch:79+root,start:2*bb,end:2*bb+.5},{pitch:72+root,start:3*bb,end:3*bb+.75}],copy=structuredClone(melody),key={root,mode};
  const result=arrangeMelody(melody,{style:'Mandopop',key,seed:root,beatsPerBar:bb,meter,pickup:true});
  const chart=chartFromSegments(result.segments,bb,result.totalBeats);
  for(const id of ids){
   const opts={barBeats:bb,meter,key,human:0,popFill:'more',policy:'musical',followMelody:true};
   const out=renderProtected(chart,id,opts,melody);assert.ok(out.accompaniment.length);assert.equal(auditHarmony(melody,out.accompaniment,{policy:'musical'}).length,0);
   assert.deepEqual(out,renderProtected(chart,id,opts,melody));assert.deepEqual(melody,copy);
   const midi=parseMidi(encodeAuditedMidi({melody,accompaniment:out.accompaniment,policy:'musical',includeMelody:true,separateBass:true}));
   const actual=midi.tracks.filter(t=>t.channel!==0).flatMap(t=>t.notes).sort((a,b)=>a.start-b.start||a.pitch-b.pitch),expected=[...out.accompaniment].sort((a,b)=>a.start-b.start||a.pitch-b.pitch);
   assert.equal(actual.length,expected.length);
   actual.forEach((n,i)=>{assert.equal(n.pitch,expected[i].pitch);assert.ok(Math.abs(n.start-expected[i].start)<.003);assert.ok(Math.abs(n.end-expected[i].end)<.003);});
   const lead=midi.tracks.filter(t=>t.channel===0).flatMap(t=>t.notes);assert.equal(lead.length,melody.length);
   lead.forEach((n,i)=>{assert.equal(n.pitch,melody[i].pitch);assert.ok(Math.abs(n.start-melody[i].start)<.003);assert.ok(Math.abs(n.end-melody[i].end)<.003);});
  }
 }
});
test('dense chromatic melody remains safe with useful accompaniment',()=>{
 const melody=Array.from({length:32},(_,i)=>({pitch:60+i%12,start:i*.5,end:i*.5+.47})),chart=parseChart('| C | Am | F | G |');
 for(const id of ids){const out=renderProtected(chart,id,{policy:'musical',popFill:'more',followMelody:true},melody);assert.ok(out.accompaniment.length);assert.equal(auditHarmony(melody,out.accompaniment,{policy:'musical'}).length,0);assert.equal(out.accompaniment.filter(n=>n.fill).length,0);}
});
