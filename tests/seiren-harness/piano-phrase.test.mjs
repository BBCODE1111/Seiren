import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from '../../performance.js';
import {popPianoPatterns} from '../../pop-piano.js';
import {texturePatterns} from '../../piano-motion.js';
import {phraseCorpus} from '../music-core/phrase-corpus.mjs';
import {renderProtected,preserveLocks} from '../../fusion.js';
import {auditHarmony} from '../../harmony.js';
import {encodeAuditedMidi} from '../../export.js';
import {parseMidi} from '../../midi.js';
import {validateProject} from '../../project.js';
const ids=Object.keys({...popPianoPatterns,...texturePatterns});
const meters=[[4,{numerator:4,denominator:4}],[3,{numerator:3,denominator:4}],[3,{numerator:6,denominator:8}]];
test('all 18 original performances retain the deployed 7776-case event contract',()=>{
 const expected=JSON.parse(readFileSync(new URL('../music-core/seiren-before-phrases.json',import.meta.url)));
 assert.deepEqual(phraseCorpus(performance,ids,meters),expected);
 assert.deepEqual(phraseCorpus(performance,ids,meters,{pianoPhrase:'original'}),expected);
});
test('each pattern has three distinct phrases in every supported meter; auto responds to melody',()=>{
 assert.equal(ids.length,18);
 for(const [barBeats,meter] of meters){const chart=Array.from({length:8},()=>({chords:[{symbol:'C',beats:barBeats}]}));
  for(const id of ids){
   const base={barBeats,meter,human:0,popFill:'off'},out=['original','space','two','four'].map(pianoPhrase=>performance(chart,id,{...base,pianoPhrase}));
   assert.equal(new Set(out.map(ns=>JSON.stringify(ns.map(n=>[n.beat,n.note,n.duration])))).size,4,id+' '+meter.numerator+'/'+meter.denominator);
   const dense=Array.from({length:8*barBeats*2},(_,i)=>({pitch:72+i%12,start:i*.5,end:i*.5+.47}));
   const held=[{pitch:72,start:0,end:8*barBeats}];
   for(const melody of [dense,held]){
    const automatic=performance(chart,id,{...base,pianoPhrase:'auto',melody});
    assert.ok(!automatic.some(n=>n.articulation==='phrase'||n.fill||n.articulation==='fill'));
    assert.deepEqual(automatic,performance(chart,id,{...base,pianoPhrase:'space',melody}));
   }
  }
 }
});
test('phrase modes preserve melody, locks, split rests and audited MIDI across keys and meters',()=>{
 const names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
 for(let root=0;root<12;root++)for(const mode of ['major','minor'])for(const [barBeats,meter] of meters){
  const symbol=names[root]+(mode==='minor'?'m7':'maj7'),key={root,mode};
  const melody=[{pitch:72+root,start:.5,end:1},{pitch:72+root+(mode==='minor'?3:4),start:barBeats,end:barBeats+.5},{pitch:79+root,start:2*barBeats,end:2*barBeats+.5}],before=structuredClone(melody);
  const chart=[{chords:[{symbol:'N.C.',beats:.5},{symbol,beats:barBeats-.5,locked:true}]},...Array.from({length:3},()=>({chords:[{symbol,beats:barBeats/2},{symbol:'G7',beats:barBeats/2}]})),{chords:[{symbol:'N.C.',beats:barBeats}]}],original=structuredClone(chart);
  for(const id of ids)for(const pianoPhrase of ['space','two','four','auto']){
   const options={barBeats,meter,key,human:.3,seed:12,popFill:'more',pianoPhrase,policy:'musical',followMelody:true};
   const out=renderProtected(chart,id,options,melody);assert.ok(out.accompaniment.length);assert.equal(auditHarmony(melody,out.accompaniment,{policy:'musical'}).length,0);
   assert.deepEqual(out,renderProtected(chart,id,options,melody));assert.deepEqual(melody,before);assert.deepEqual(chart,original);
   assert.ok(out.accompaniment.every(n=>n.start>=.5&&n.end<=4*barBeats+1e-7));
   const midi=parseMidi(encodeAuditedMidi({melody,accompaniment:out.accompaniment,policy:'musical',includeMelody:true,separateBass:true}));
   const actual=midi.tracks.filter(t=>t.channel!==0).flatMap(t=>t.notes).sort((a,b)=>a.start-b.start||a.pitch-b.pitch),expected=[...out.accompaniment].sort((a,b)=>a.start-b.start||a.pitch-b.pitch);
   assert.equal(actual.length,expected.length);
   actual.forEach((n,i)=>{assert.equal(n.pitch,expected[i].pitch);assert.ok(Math.abs(n.start-expected[i].start)<.003);assert.ok(Math.abs(n.end-expected[i].end)<.003);});
   const lead=midi.tracks.filter(t=>t.channel===0).flatMap(t=>t.notes);assert.equal(lead.length,melody.length);lead.forEach((n,i)=>{assert.equal(n.pitch,melody[i].pitch);assert.ok(Math.abs(n.start-melody[i].start)<.003&&Math.abs(n.end-melody[i].end)<.003);});
  }const lockState=bars=>bars.map(b=>b.chords.map(c=>({symbol:c.symbol,beats:c.beats,locked:!!c.locked})));assert.deepEqual(lockState(preserveLocks(chart,original,barBeats)),lockState(original));
 }
});
test('project migration keeps missing or invalid phrase choices on original and retains explicit choices',()=>{
 const project={format:'seiren-project',version:2,bars:[{chords:[{symbol:'C',beats:4}]}],settings:{pattern:'popHalf'}};
 assert.equal(validateProject(project).settings.pianoPhrase,'original');assert.ok(!('pianoPhrase' in project.settings));
 for(const pianoPhrase of ['original','space','two','four','auto'])assert.equal(validateProject({...project,settings:{...project.settings,pianoPhrase}}).settings.pianoPhrase,pianoPhrase);
 assert.equal(validateProject({...project,settings:{pianoPhrase:'bad'}}).settings.pianoPhrase,'original');
});
test('phrase changes preserve BAR 0 pickup and tempo-map export alignment',()=>{
 const melody=[{pitch:72,start:-1,end:-.5},{pitch:76,start:0,end:1},{pitch:79,start:7,end:7.5}],before=structuredClone(melody);
 const chart=Array.from({length:2},()=>({chords:[{symbol:'C',beats:4}]})),tempoMap=[{beat:-1,bpm:90},{beat:4,bpm:120}];
 for(const id of ids)for(const pianoPhrase of ['space','two','four','auto']){
  const out=renderProtected(chart,id,{pianoPhrase,policy:'musical',human:0},melody);
  const midi=parseMidi(encodeAuditedMidi({melody,accompaniment:out.accompaniment,tempoMap,pickupBeats:1,includeMelody:true,separateBass:true,policy:'musical'}));
  assert.equal(midi.pickupBeats,1);assert.deepEqual(midi.tracks.find(t=>t.channel===0).notes.map(n=>[n.pitch,n.start,n.end]),melody.map(n=>[n.pitch,n.start,n.end]));
  // MIDI stores integer microseconds/quarter and may repeat the initial tempo at beat 0.
  // Check effective tempo, including both sides of the change, instead of marker encoding.
  const tempoAt=(map,beat)=>map.filter(t=>t.beat<=beat).at(-1).bpm;
  for(const beat of [-1,0,3.9,4,7.5])assert.ok(Math.abs(tempoAt(midi.tempoMap,beat)-tempoAt(tempoMap,beat))<.001);
  assert.ok(midi.tempoMap.some(t=>t.beat===4&&t.bpm===120));assert.deepEqual(melody,before);
 }
});
