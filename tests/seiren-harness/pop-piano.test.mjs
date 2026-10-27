import test from 'node:test';
import assert from 'node:assert/strict';
import {popPianoPatterns} from '../../pop-piano.js';
import {performance} from '../../performance.js';
import {parseChart} from '../../solutions.js';
import {parse} from '../../music.js';
import {styles,mutate} from '../../style-engine.js';
import {mandarinStudies} from '../../mandarin-pop.js';
import {examplePool} from '../../example-pool.js';
import {arrangeMelody} from '../../melody-arranger.js';
import {chartFromSegments,renderProtected,preserveLocks} from '../../fusion.js';
import {demoMelody,auditHarmony} from '../../harmony.js';
import {encodeAuditedMidi} from '../../export.js';
import {parseMidi} from '../../midi.js';
const patterns=Object.keys(popPianoPatterns),chart=parseChart('| C | Am | F | G |');
const sparse=[{pitch:72,start:0,end:.5},{pitch:76,start:4,end:4.5},{pitch:69,start:8,end:8.5},{pitch:74,start:12,end:12.5}];
const busy=Array.from({length:32},(_,i)=>({pitch:[72,74,76,79][i%4],start:i*.5,end:i*.5+.42}));

test('twelve genuinely different pop patterns keep a deterministic bar grid',()=>{
 assert.equal(patterns.length,12);const signatures=new Set;
 for(const pattern of patterns){const notes=performance(chart,pattern,{human:0,popFill:'off'});assert.deepEqual(performance(chart,pattern,{human:0,popFill:'off'}),notes);assert.ok(notes.length);assert.ok(notes.every(n=>n.beat>=0&&n.duration>0&&n.beat+n.duration<=16));signatures.add(JSON.stringify(notes.map(n=>[n.beat,n.note,n.duration])));}
 assert.equal(signatures.size,12);
 const whole=performance(chart,'popWhole',{popFill:'off',human:0});assert.deepEqual([...new Set(whole.map(n=>n.beat))],[0,4,8,12]);
 const quarter=performance(chart,'popQuarter',{popFill:'off',human:0});assert.deepEqual([...new Set(quarter.map(n=>n.beat))],Array.from({length:16},(_,i)=>i));
});
test('together/right/left/right uses a chord-tone fifth in the second left-hand pulse',()=>{
 const notes=performance(parseChart('| C |'),'popSplit',{human:0,popFill:'off'});
 assert.deepEqual([...new Set(notes.filter(n=>n.role==='chords').map(n=>n.beat))],[0,1,3]);
 const bass=notes.filter(n=>n.role==='bass');assert.deepEqual(bass.map(n=>n.beat),[0,2]);assert.equal(bass[1].note-bass[0].note,7);
});
test('fills answer gaps, stay in the chord and disappear under busy melody or OFF',()=>{
 const opts={melody:sparse,human:0,popFill:'auto'};
 const fills=performance(chart,'popCadence',opts).filter(n=>n.articulation==='fill');assert.equal(fills.length,3);
 assert.ok(fills.every(n=>n.beat>=15&&parse('G').pcs.includes(n.note%12)));
 assert.equal(performance(chart,'popCadence',{...opts,popFill:'off'}).filter(n=>n.articulation==='fill').length,0);
 assert.equal(performance(chart,'popCadence',{...opts,melody:busy}).filter(n=>n.articulation==='fill').length,0);
 const occupied=[...sparse,{pitch:72,start:15,end:16}];assert.equal(performance(chart,'popCadence',{...opts,melody:occupied}).filter(n=>n.articulation==='fill').length,0);
 const more=performance(chart,'popCadence',{...opts,popFill:'more'}).filter(n=>n.articulation==='fill');assert.equal(more.length,6);
});
test('dense melody reduces eighth-note accompaniment while retaining meter anchors',()=>{
 const opts={popFill:'off',human:0};const light=performance(chart,'popEighth',{...opts,melody:sparse}),dense=performance(chart,'popEighth',{...opts,melody:busy});assert.ok(dense.length<light.length);
 assert.deepEqual(dense.filter(n=>n.role==='bass').map(n=>n.beat),light.filter(n=>n.role==='bass').map(n=>n.beat));
});
test('split chords, N.C., 3/4 and 6/8 keep their boundaries',()=>{
 for(const bb of [3,4])for(const meter of [{numerator:bb,denominator:4},...(bb===3?[{numerator:6,denominator:8}]:[])])for(const pattern of patterns){
  const c=[{chords:[{symbol:'C',beats:bb/2},{symbol:'Dm7',beats:bb/2}]},{chords:[{symbol:'N.C.',beats:bb}]}];
  const notes=performance(c,pattern,{barBeats:bb,meter,popFill:'more',human:0});assert.ok(notes.length);
  for(const n of notes)assert.ok(n.beat+n.duration<=(n.beat<bb/2?bb/2:bb)+1e-7);
  assert.ok(notes.some(n=>n.beat===bb/2&&n.role==='bass'));
 }
});
test('new performances remain safe and export the same protected notes across keys',()=>{
 for(let key=0;key<12;key++)for(const pattern of patterns){
  const melody=demoMelody().map(n=>({...n,pitch:n.pitch+key}));
  const result=arrangeMelody(melody,{style:'Mandopop',key:{root:key,mode:'major'},seed:key});
  const c=chartFromSegments(result.segments,4,result.totalBeats),out=renderProtected(c,pattern,{policy:'musical',human:0,popFill:'more',followMelody:true},melody);
  assert.ok(out.accompaniment.length);assert.equal(auditHarmony(melody,out.accompaniment,{policy:'musical'}).length,0);
  const midi=parseMidi(encodeAuditedMidi({melody,accompaniment:out.accompaniment,policy:'musical',includeMelody:true,separateBass:true}));
  assert.equal(midi.tracks.filter(t=>t.channel!==0).flatMap(t=>t.notes).length,out.accompaniment.length);
 }
});
test('Mandarin pop leads the style list and offers all three families plus minor studies',()=>{
 assert.equal(Object.keys(styles)[0],'Mandopop');assert.equal(styles.Mandopop.pattern,'popHalf');assert.equal(mandarinStudies.length,36);
 for(const family of ['1645','canon','4536251'])assert.ok(mandarinStudies.filter(s=>s.family===family).length>=10);
 const pool=examplePool('Mandopop');assert.ok(pool.length>=36);assert.ok(pool.some(s=>s.title.includes('下降低音')));assert.ok(pool.some(s=>s.mode==='minor'));
 for(const s of mandarinStudies)for(const bar of s.bars)for(const c of parseChart('| '+bar+' |')[0].chords)assert.ok(parse(c.symbol));
 for(const style of ['Japanese rock','K-pop'])assert.ok(examplePool(style).some(s=>s.id.startsWith('mandarin-')));
});
test('Generate uses different functional families without melody and adapts with melody',()=>{
 const source=Array.from({length:8},()=>({chords:[]})),ideas=new Set;
 for(let seed=0;seed<36;seed++){const c=mutate(source,{style:'Mandopop',seed,randomness:'high'});ideas.add(c[0].reason);assert.equal(c.length,8);}
 assert.ok(ideas.size>=30);
 const melody=demoMelody(),before=structuredClone(melody),charts=new Set;
 for(let seed=0;seed<12;seed++){const r=arrangeMelody(melody,{style:'Mandopop',seed});charts.add(r.segments.map(s=>s.symbol).join('|'));assert.ok(r.idea);assert.deepEqual(melody,before);}
 assert.ok(charts.size>=3,`${charts.size} distinct ideas`);
 for(const mode of ['major','minor']){const c=mutate(source,{style:'Mandopop',mode,seed:5});assert.ok(c.every(b=>b.chords.every(c=>parse(c.symbol))));}
 const locked=[{chords:[{symbol:'C',beats:4,locked:true}]}];assert.equal(preserveLocks(chart,locked)[0].chords[0].symbol,'C');
});
