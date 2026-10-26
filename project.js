import {synthPresets} from './melody-synth.js?v=seiren-4';
import {validatePickup} from './timeline.js';
import {validateMelody} from './harmony.js?v=seiren-4';
import {parse} from './music.js?v=seiren-4';
export function validateProject(data){
 const legacy=data?.format==='khimaira-project'&&data.version===1;
 if(!legacy&&!(data?.format==='seiren-project'&&data.version===2))throw Error('Unsupported project format.');
 data=structuredClone(data);
 if(legacy){data.format='seiren-project';data.version=2;if(data.melody)Object.assign(data.melody,{pickupBeats:0,downbeatTime:data.melody.offset??0,repeatPickup:true});}
 if(!Array.isArray(data.bars)||!data.bars.length||data.bars.length>512)throw Error('Invalid chart length.');
 const m=data.melody;
 if(m){
  if(!Array.isArray(m.notes))throw Error('Invalid melody.');validatePickup(m.pickupBeats,m.meter);if(!Number.isFinite(m.downbeatTime)||typeof m.repeatPickup!=='boolean')throw Error('Invalid alignment.');if(m.notes.length)validateMelody(m.notes,{pickupBeats:m.pickupBeats});
  if(!Number.isFinite(m.bpm)||m.bpm<30||m.bpm>300||!Number.isInteger(m.key?.root)||m.key.root<0||m.key.root>11||!['major','minor'].includes(m.key.mode))throw Error('Invalid tempo or key.');
  if(!Number.isInteger(m.meter?.numerator)||m.meter.numerator<1||m.meter.numerator>32||![1,2,4,8,16,32].includes(m.meter.denominator))throw Error('Invalid meter.');
  if(!['strict','musical'].includes(m.policy)||!Object.hasOwn(synthPresets,m.instrument)||!['melody','harmony'].every(k=>Number.isFinite(m.mix?.[k])&&m.mix[k]>=0&&m.mix[k]<=1))throw Error('Invalid melody settings.');
  if(m.pitchCurve&&(!Array.isArray(m.pitchCurve)||m.pitchCurve.length>6000||m.pitchCurve.some((p,i)=>!Number.isFinite(p.beat)||Math.abs(p.beat)>2048||i&&p.beat<=m.pitchCurve[i-1].beat||p.midi!==null&&(!Number.isFinite(p.midi)||p.midi<0||p.midi>127)||!Number.isFinite(p.confidence)||p.confidence<0||p.confidence>1)))throw Error('Invalid pitch contour.');
  if(m.beatMarkers&&(!Array.isArray(m.beatMarkers)||m.beatMarkers.length>1000||m.beatMarkers.some((b,i)=>!Number.isFinite(b)||Math.abs(b)>2048||i&&b<=m.beatMarkers[i-1])))throw Error('Invalid beat markers.');
  if(m.tempoMap&&(!Array.isArray(m.tempoMap)||!m.tempoMap.length||m.tempoMap.length>1000||m.tempoMap.some((t,i)=>!Number.isFinite(t.beat)||t.beat< -m.pickupBeats||i&&t.beat<=m.tempoMap[i-1].beat||!Number.isFinite(t.bpm)||t.bpm<=0||t.bpm>1000)))throw Error('Invalid tempo map.');
 }
 for(const chart of [data.bars,data.source||data.bars]){
  if(!Array.isArray(chart)||chart.length>512)throw Error('Invalid chart.');
  for(const bar of chart){if(!Array.isArray(bar.chords)||bar.chords.length>64||bar.chords.some(c=>!(c.symbol==='N.C.'||parse(c.symbol))||!Number.isFinite(c.beats)||c.beats<=0||c.beats>32))throw Error('Invalid chord.');}
 }
 return data;
}
