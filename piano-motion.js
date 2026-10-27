// Generated from Khimaira/packages/piano-motion/motion.js; edit the canonical source and sync.
/**
 * Original realizations of rhythm/rest/tie and targeted-fill concepts.
 * Source/page/time, counterexamples and limits: docs/course-study-20261027.md.
 * Pure performance layer: never chooses or rewrites a chord or melody.
 */
export const PIANO_MOTION_VERSION='1.0.0';
export const texturePatterns={
 textureDotted:'TEXTURE · 附點推進 / Dotted',
 textureTied:'TEXTURE · 跨拍延留 / Tied',
 textureSpace:'TEXTURE · 留白回答 / Space',
 textureBroken:'TEXTURE · 柱式與分解 / Broken',
 textureTriplet:'TEXTURE · 三連音回應 / Triplet answer',
 texturePentatonic:'TEXTURE · 五聲對話 / Pentatonic answer',
};
export const isTexture=pattern=>Object.hasOwn(texturePatterns,pattern);
const mod=n=>((n%12)+12)%12;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const epsilon=1e-7;
const overlap=(note,start,end)=>Math.min(note.end,end)-Math.max(note.start,start)>epsilon;

// [quarter-note beat, sounding duration, upper-hand selection]. Rests have no
// attacks AND no preceding sustain over them. A tie is a single long event.
export function textureGrid(pattern,barBeats=4,meter={numerator:4,denominator:4}){
 const compound=meter.denominator===8&&barBeats===3;
 if(barBeats===3){
  if(compound){
   if(pattern==='textureSpace')return [[0,.65,'block'],[2,.4,'high']];
   if(pattern==='textureTied')return [[0,.5,'block'],[.5,1.5,'block'],[2.5,.5,'high']];
   if(pattern==='textureDotted')return [[0,.75,'block'],[.75,.25,'low'],[1,.5,'high'],[1.5,.75,'block'],[2.25,.25,'low'],[2.5,.5,'high']];
   return [[0,.5,'block'],[.5,.5,'low'],[1,.5,'high'],[1.5,.5,'block'],[2,.5,'low'],[2.5,.5,'high']];
  }
  if(pattern==='textureSpace')return [[0,.8,'block'],[2.5,.45,'high']];
  if(pattern==='textureTied')return [[0,.75,'block'],[.75,1.25,'block'],[2,.8,'high']];
  if(pattern==='textureDotted')return [[0,.75,'block'],[.75,.25,'low'],[1,.8,'block'],[2,.75,'high'],[2.75,.25,'low']];
  return [[0,.8,'block'],[1,.45,'low'],[1.5,.45,'high'],[2,.8,'block']];
 }
 // This library explicitly supports 4/4, 3/4 and 6/8. Other meters get a sparse
 // beat-based fallback rather than stretching a four-beat phrase across them.
 if(barBeats!==4)return Array.from({length:Math.ceil(barBeats)},(_,i)=>[i,Math.min(.7,barBeats-i),'block']);
 switch(pattern){
  case 'textureDotted':return [[0,.9,'block'],[1,.75,'low'],[1.75,.25,'high'],[2,.8,'block'],[3,.75,'high'],[3.75,.25,'low']];
  case 'textureTied':return [[0,.8,'block'],[1,.75,'low'],[1.75,1.25,'block'],[3,.5,'low'],[3.5,.5,'high']];
  case 'textureSpace':return [[0,.85,'block'],[3,.45,'low'],[3.5,.45,'high']];
  case 'textureBroken':return [[0,.9,'block'],[1,.5,'low'],[1.5,.5,'high'],[2,.75,'block'],[2.75,.25,'low'],[3,.5,'high'],[3.5,.5,'low']];
  case 'textureTriplet':return [[0,1.8,'block'],[2,.8,'block']];
  case 'texturePentatonic':return [[0,1.3,'block'],[1.5,.4,'high'],[2,1,'block']];
  default:return [];
 }
}

/** All notes use {pitch,start,end}; product adapters translate their own formats. */
export function renderTexture(plan,pattern,options={}){
 if(!isTexture(pattern)||!plan.length)return [];
 const bb=Number(options.barBeats)||4,meter=options.meter||{numerator:4,denominator:4};
 const melody=options.melody||[],gate=clamp(Number(options.gate??.82),.1,1),human=clamp(Number(options.human??.25),0,1);
 const end=Number(options.totalBeats)||Math.max(...plan.map(s=>s.beat+s.beats));
 const fillMode=options.fillMode||'phrase',out=[];
 let seed=(options.seed??42)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const chordAt=t=>plan.find(s=>t>=s.beat-epsilon&&t<s.beat+s.beats-epsilon);
 const emit=(beat,pitches,duration,velocity,role,articulation='texture')=>{
  const chord=chordAt(beat);if(!chord)return;
  for(const note of pitches){
   const length=Math.min(duration*(articulation==='tied'?1:gate),chord.beat+chord.beats-beat,end-beat);
   if(Number.isFinite(note)&&note>=21&&note<=108&&length>epsilon)out.push({beat,note,duration:length,velocity:clamp(velocity+(random()-.5)*.06*human,.22,.88),role,articulation,fill:articulation==='fill'});
  }
 };
 for(let bar=Math.floor(Math.min(0,plan[0].beat)/bb)*bb;bar<end-epsilon;bar+=bb){
  const finish=Math.min(bar+bb,end),compound=meter.denominator===8&&bb===3,pulse=compound?1.5:1;
  const active=melody.filter(n=>overlap(n,bar,finish));
  const busy=active.filter(n=>n.start>=bar-epsilon).length>=Math.max(4,bb*1.5);
  const bassHits=bb===4?[0,2]:compound?[0,1.5]:bb===3?[0,2]:[0];
  for(const local of bassHits){const chord=chordAt(bar+local);if(chord)emit(bar+local,[chord.notes[0]],Math.min(pattern==='textureSpace'?.8:1.5,finish-bar-local),.6,'bass');}
  for(const [local,duration,selection] of textureGrid(pattern,bb,meter)){
   const beat=bar+local,chord=chordAt(beat);if(!chord)continue;
   if(busy&&Math.abs(local/pulse-Math.round(local/pulse))>.01)continue;
   const upper=[...new Set(chord.notes.slice(1))];
   const pitches=selection==='low'?upper.slice(0,1):selection==='high'?upper.slice(-1):upper.slice(0,busy?3:4);
   emit(beat,pitches,duration,busy?.46:selection==='block'?.58:.49,'chords',duration>pulse?'tied':'texture');
  }
  // A split chord is an arrival, not a restarted rhythm template. Silence/N.C.
  // is absent from plan, so there is no phantom bass or carry-over old harmony.
  for(const chord of plan.filter(s=>s.beat>=bar-epsilon&&s.beat<finish-epsilon)){
   if(!out.some(n=>n.role==='bass'&&Math.abs(n.beat-chord.beat)<epsilon))emit(chord.beat,[chord.notes[0]],Math.min(.8,chord.beats),.59,'bass');
   if(chord.beat>bar+epsilon&&!out.some(n=>n.role==='chords'&&Math.abs(n.beat-chord.beat)<epsilon))emit(chord.beat,chord.notes.slice(1,4),Math.min(.6,chord.beats),.52,'chords');
  }
  const phrase=Math.round(bar/bb)+1,phraseEnd=phrase%(fillMode==='light'?2:4)===0||finish>=end-epsilon;
  if(fillMode==='off'||!phraseEnd||busy||finish<bar+bb-epsilon)continue;
  // A full metrical pulse, aligned to the bar: do not squeeze a tuplet into an
  // arbitrarily short gap or continue into a new lyric at the next downbeat.
  const start=finish-pulse,chord=chordAt(start);
  if(!chord||start<bar||chord.beat+chord.beats<finish-epsilon||melody.some(n=>overlap(n,start,finish)))continue;
  const next=chordAt(finish),upper=[...new Set(chord.notes.slice(1))].sort((a,b)=>a-b);
  if(upper.length<2)continue;
  const target=next?.notes[1]??upper[Math.floor(upper.length/2)];
  const landing=[...upper].sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||a-b)[0];
  const key=options.key,root=typeof key==='number'?key:key?.root,mode=typeof key==='object'?key.mode:options.mode;
  const knownKey=Number.isInteger(root)&&['major','minor'].includes(mode);
  const scale=knownKey?(mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(n=>mod(n+root)):[];
  const chordPCs=[...new Set(chord.notes.map(mod))];
  const scaleCompatible=knownKey&&chordPCs.every(pc=>scale.includes(pc));
  let pitches,step=compound?.5:.25;
  const descending=(Math.floor(phrase/2)+(options.seed??42))%2===0;
  if(pattern==='textureTriplet'){
   step=pulse/3;pitches=descending?[upper.at(-1),upper[0],landing]:[upper[0],upper.at(-1),landing];
  }else if(pattern==='textureSpace'&&scaleCompatible){
   // A weak neighboring tone resolves within the same chord and true melody
   // gap. No chromatic/altered note is injected into a held singer's phrase.
   const neighbor=[landing+(descending?-1:1),landing+(descending?-2:2)].find(n=>n>=21&&n<=108&&scale.includes(mod(n))&&!chordPCs.includes(mod(n)));
   pitches=neighbor===undefined?[upper[0],upper.at(-1),landing]:[landing,neighbor,landing];
  }else if(pattern==='texturePentatonic'&&scaleCompatible){
   const pent=(mode==='minor'?[0,3,5,7,10]:[0,2,4,7,9]).map(n=>mod(n+root));
   const pool=Array.from({length:13},(_,i)=>landing-6+i).filter(n=>n>=21&&n<=108&&pent.includes(mod(n)));
   const destinations=upper.filter(n=>pent.includes(mod(n)));
   if(pool.length>=3&&destinations.length){
    const last=[...destinations].sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||a-b)[0];
    const ordered=descending?[...pool].reverse():pool;
    pitches=[...ordered.filter(n=>n!==last).slice(0,3),last];
   }
  }
  if(!pitches){const ordered=descending?[...upper].reverse():upper;pitches=[ordered[0],ordered[1%ordered.length],ordered.at(-1),landing];}
  const slots=Math.floor((pulse+epsilon)/step);pitches=pitches.slice(-slots);
  const fillStart=finish-pitches.length*step;
  // Remove only upper-hand material replaced by the fill; bass and chord chart
  // remain unchanged. Shorten old upper sustains before any non-chord neighbor.
  for(const n of out)if(n.role==='chords'&&n.beat<finish&&n.beat+n.duration>fillStart){
   if(n.beat>=fillStart-epsilon)n.duration=0;else n.duration=fillStart-n.beat;
  }
  pitches.forEach((pitch,i)=>emit(fillStart+i*step,[pitch],step*.84,.43,'chords','fill'));
 }
 out.sort((a,b)=>a.beat-b.beat||a.note-b.note);
 const merged=[];
 for(const n of out){
  if(n.duration<=epsilon)continue;
  const previous=merged.at(-1);
  if(previous&&previous.note===n.note&&Math.abs(previous.beat-n.beat)<epsilon){previous.duration=Math.max(previous.duration,n.duration);previous.velocity=Math.max(previous.velocity,n.velocity);if(n.role==='bass')previous.role='bass';}
  else merged.push({...n});
 }
 const nextAttack=new Map();
 for(let i=merged.length-1;i>=0;i--){const n=merged[i],next=nextAttack.get(n.note);if(next!==undefined)n.duration=Math.min(n.duration,next-n.beat);nextAttack.set(n.note,n.beat);}
 return merged.filter(n=>n.duration>epsilon);
}
