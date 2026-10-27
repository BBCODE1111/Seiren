// Generated from Khimaira/packages/piano-motion/motion.js; edit the canonical source and sync.
import {renderTexture as renderLegacyTexture,applyPianoPhrase as applyLegacyPhrase} from './piano-motion-v1.js';
/**
 * Original realizations of rhythm/rest/tie and targeted-fill concepts.
 * Source/page/time, counterexamples and limits: docs/course-study-20261027.md.
 * Pure performance layer: never chooses or rewrites a chord or melody.
 */
export const PIANO_MOTION_VERSION='2.0.0';
export const texturePatterns={
 textureDotted:'TEXTURE · Dotted / 附點推進',
 textureTied:'TEXTURE · Tied / 跨拍延留',
 textureSpace:'TEXTURE · Space / 留白回答',
 textureBroken:'TEXTURE · Broken / 柱式與分解',
 textureTriplet:'TEXTURE · Triplet answer / 三連音回應',
 texturePentatonic:'TEXTURE · Pentatonic answer / 五聲對話',
};
export const isTexture=pattern=>Object.hasOwn(texturePatterns,pattern);

// Variations belong to a selected pattern, not to a growing list of patterns.
// Each reply keeps that pattern's placement; 3/4 and 6/8 have independent slots.
const profile=(four,three,compound)=>({four,three,compound});
export const phraseProfiles={
 pianoWhole:profile([2,3],[1,2],[1.5,2.5]),
 pianoHalf:profile([2.5,3.5],[2,2.5],[1.5,2.5]),
 pianoQuarter:profile([1.5,3.5],[1.5,2.5],[1,2.5]),
 pianoBassReply:profile([1.5,3.5],[1.5,2.5],[1,2.5]),
 pianoBackbeat:profile([1,3.5],[1,2.5],[1,2.5]),
 pianoPush:profile([2.5,3.5],[1.5,2.5],[1,2.5]),
 pianoBallad:profile([2.5,3.5],[2,2.5],[1.5,2.5]),
 pianoBroken:profile([2.5,3.5],[1.5,2.5],[1,2.5]),
 pianoAnswer:profile([3,3.5],[2,2.5],[2,2.5]),
 pianoHandTurn:profile([1.75,3.75],[1.5,2.5],[1,2.5]),
 pianoKpop:profile([2.75,3.5],[1.5,2.5],[1,2.5]),
 pianoJpop:profile([2.5,3.5],[1.5,2.5],[1,2.5]),
 popWhole:profile([2,3],[1,2],[1.5,2.5]),
 popHalf:profile([2.5,3.5],[2,2.5],[1.5,2.5]),
 popQuarter:profile([1.5,3.5],[1.5,2.5],[1,2.5]),
 popBackbeat:profile([1,3.5],[1,2.5],[1,2.5]),
 popPush:profile([1.5,3.5],[1.5,2.5],[1,2.5]),
 popBassChord:profile([1.5,3.5],[1.5,2.5],[1,2.5]),
 popSplit:profile([1,3.5],[1,2.5],[1,2.5]),
 popEighth:profile([2.5,3.5],[1.5,2.5],[1,2.5]),
 popBallad:profile([2.5,3.5],[2,2.5],[1.5,2.5]),
 popAnswer:profile([3,3.5],[2,2.5],[2,2.5]),
 popLift:profile([2.5,3.5],[1.5,2.5],[1,2.5]),
 popCadence:profile([2.5,3],[2,2.5],[1.5,2.5]),
 textureDotted:profile([3,3.75],[2,2.75],[2.25,2.5]),
 textureTied:profile([3,3.5],[2],[2.5]),
 textureSpace:profile([3,3.5],[2.5],[2]),
 textureBroken:profile([2.75,3.5],[1.5,2],[2,2.5]),
 textureTriplet:profile([2],[2],[1.5]),
 texturePentatonic:profile([1.5,2],[1.5,2],[1.5,2]),
};
const anchors={
 pianoWhole:[[0],[0],[0]],pianoHalf:[[0,2],[0,2],[0,1.5]],pianoQuarter:[[1,3],[1,2],[1,2]],
 pianoBassReply:[[.5,2.5],[.5,2],[.5,2]],pianoBackbeat:[[1,3],[1,2],[.5,2]],pianoPush:[[1.5,3.5],[.5,2.5],[1,2.5]],
 pianoBallad:[[0,2.5],[0,2.5],[0,2]],pianoBroken:[[2,2.5],[1,1.5],[.5,1]],pianoAnswer:[[0,2],[0,2],[0,2]],
 pianoHandTurn:[[1,1.75,3,3.75],[1,2.5],[.5,2.5]],pianoKpop:[[.75,2.75],[.5,2.5],[1,2.5]],pianoJpop:[[1,3],[1,2],[1,2]],
 popWhole:[[0],[0],[0]],popHalf:[[0,2],[0,2],[0,1.5]],popQuarter:[[1,3],[1,2],[1,2]],
 popBackbeat:[[1,3],[1,2],[.5,2]],popPush:[[1.5,3],[.5,2.5],[1,2.5]],popBassChord:[[.5,2.5],[.5,2],[.5,2]],
 popSplit:[[1,3],[1,2.5],[.5,2.5]],popEighth:[[0,1,2,3],[0,1,2],[0,1.5]],popBallad:[[0,2],[0,2.5],[0,2]],
 popAnswer:[[0,1.5],[0,2.5],[0,2.5]],popLift:[[0,2,3.5],[0,1.5],[0,1.5,2.5]],popCadence:[[0,2.5],[0,2.5],[0,2.5]],
 textureDotted:[[1,1.75,3,3.75],[0,.75,2,2.75],[0,.75,1.5,2.25]],textureTied:[[1.75],[.75],[.5]],
 textureSpace:[[0,3,3.5],[0,2.5],[0,2]],textureBroken:[[1,1.5],[1,1.5],[.5,1]],
 textureTriplet:[[3,3+1/3,3+2/3],[2,2+1/3,2+2/3],[1.5,2,2.5]],texturePentatonic:[[2.5,3],[1.5,1.75],[1,1.25]]
};
for(const [id,[four,three,compound]] of Object.entries(anchors))phraseProfiles[id].anchors={four,three,compound};
export function sparseVoices(group,chord){
 if(group.length<2)return group;
 const third=Number.isInteger(chord?.root)?group.find(n=>[3,4].includes(mod(n.note-chord.root))):null;
 return [...new Set([third??group[0],group.at(-1)])];
}
export const phraseModes=['original','space','two','four','auto'];
export const normalizePhraseMode=value=>phraseModes.includes(value)?value:'original';
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
   if(pattern==='textureTriplet')return [[0,1.1,'block'],[1.5,.4,'low'],[2,.4,'high'],[2.5,.4,'low']];
   if(pattern==='texturePentatonic')return [[0,.8,'block'],[1,.22,'pent1'],[1.25,.22,'pent2'],[2,.7,'block']];
   return [[0,.5,'block'],[.5,.5,'low'],[1,.5,'high'],[1.5,.5,'block'],[2,.5,'low'],[2.5,.5,'high']];
  }
  if(pattern==='textureSpace')return [[0,.8,'block'],[2.5,.45,'high']];
  if(pattern==='textureTied')return [[0,.75,'block'],[.75,1.25,'block'],[2,.8,'high']];
  if(pattern==='textureDotted')return [[0,.75,'block'],[.75,.25,'low'],[1,.8,'block'],[2,.75,'high'],[2.75,.25,'low']];
  if(pattern==='textureTriplet')return [[0,1.8,'block'],[2,.27,'low'],[2+1/3,.27,'high'],[2+2/3,.27,'low']];
  if(pattern==='texturePentatonic')return [[0,.8,'block'],[1.5,.22,'pent1'],[1.75,.22,'pent2'],[2.5,.4,'high']];
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
  case 'textureTriplet':return [[0,1.8,'block'],[2,.8,'block'],[3,.27,'low'],[3+1/3,.27,'high'],[3+2/3,.27,'low']];
  case 'texturePentatonic':return [[0,1.3,'block'],[1.5,.4,'high'],[2,.4,'block'],[2.5,.38,'pent1'],[3,.45,'pent2']];
  default:return [];
 }
}

export function pentatonicRun(landing,key,descending=false,count=4){
 const root=typeof key==='number'?key:key?.root,mode=key?.mode;
 if(!Number.isInteger(root)||!['major','minor'].includes(mode))return [];
 const pcs=(mode==='minor'?[0,3,5,7,10]:[0,2,4,7,9]).map(n=>mod(n+root));
 const pool=Array.from({length:88},(_,i)=>21+i).filter(n=>pcs.includes(mod(n))),index=pool.indexOf(landing);
 if(index<0)return [];
 const run=descending?pool.slice(index,index+count).reverse():pool.slice(Math.max(0,index-count+1),index+1);
 return run.length===count?run:[];
}
function pentatonicBody(chord,key){
 const root=typeof key==='number'?key:key?.root,mode=key?.mode;
 if(!Number.isInteger(root)||!['major','minor'].includes(mode))return [];
 const scale=(mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(n=>mod(n+root));
 if(chord.notes.some(n=>!scale.includes(mod(n))))return [];
 for(const target of [...chord.notes.slice(1)].reverse()){const run=pentatonicRun(target,key,false,2);if(run.length)return run;}
 return [];
}

/** All notes use {pitch,start,end}; product adapters translate their own formats. */
export function renderTexture(plan,pattern,options={}){
 if(options.pianoRevision===1)return renderLegacyTexture(plan,pattern,options);
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
  const bassHits=bb===4?[0,2]:compound?[0,1.5]:[0];
  for(const local of bassHits){const chord=chordAt(bar+local);if(chord)emit(bar+local,[chord.notes[0]],Math.min(pattern==='textureSpace'?.8:1.5,finish-bar-local),.6,'bass');}
  for(const [local,duration,selection] of textureGrid(pattern,bb,meter)){
   const beat=bar+local,chord=chordAt(beat);if(!chord)continue;
   if(busy&&Math.abs(local/pulse-Math.round(local/pulse))>.01)continue;
   const upper=[...new Set(chord.notes.slice(1))];
   const motif=selection.startsWith('pent')?pentatonicBody(chord,options.key):[];
   const pitches=selection==='low'?upper.slice(0,1):selection==='high'?upper.slice(-1):selection.startsWith('pent')?[motif[selection==='pent1'?0:1]??upper[selection==='pent1'?0:upper.length-1]]:upper.slice(0,busy?3:4);
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
   const destinations=upper.filter(n=>pentatonicRun(n,key,descending).length);
   const last=destinations.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||a-b)[0];
   if(last!==undefined)pitches=pentatonicRun(last,key,descending);

  }
  if(!pitches){const ordered=descending?[...upper].reverse():upper;pitches=[ordered[0],ordered[1%ordered.length],ordered.at(-1),landing];}
  const slots=Math.floor((pulse+epsilon)/step);pitches=pitches.slice(-slots);
  const fillStart=finish-pitches.length*step;
  // Remove only upper-hand material replaced by the fill; bass and chord chart
  // remain unchanged. Shorten old upper sustains before any non-chord neighbor.
  for(const n of out)if(n.role==='chords'&&!['held','tied'].includes(n.articulation)&&n.beat<finish&&n.beat+n.duration>fillStart){
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

// Density is local onset activity, never the occupancy of an entire sung bar.
export function melodyBusyAt(melody,beat){
 const start=Math.floor(beat+epsilon);
 return melody.filter(n=>n.start>=start-epsilon&&n.start<start+1-epsilon).length>=2;
}
export function phraseReplyAllowed(melody,beat,duration){
 if(melodyBusyAt(melody,beat))return false;
 const sounding=melody.filter(m=>overlap(m,beat,beat+duration));
 // A settled long tone may support a chord-tone reply; a new syllable may not.
 if(sounding.length)return sounding.every(m=>m.start<=beat-.75+epsilon&&m.end-m.start>=1.5&&m.end>=beat+duration-epsilon)&&!melody.some(m=>m.start>beat-epsilon&&m.start<beat+.75-epsilon);
 return !melody.some(m=>overlap(m,beat,beat+.75));
}

/** Preserve the original event list unless explicitly enabled. Product adapters
 * run their final melody protection AFTER this optional phrase arrangement. */
export function applyPianoPhrase(events,plan,pattern,options={}){
 if(options.pianoRevision===1)return applyLegacyPhrase(events,plan,pattern,options);
 const mode=normalizePhraseMode(options.pianoPhrase),cfg=phraseProfiles[pattern];
 if(mode==='original'||!cfg||!plan.length)return events;
 const bb=Number(options.barBeats)||4,compound=bb===3&&options.meter?.denominator===8;
 const melody=options.melody||[],end=options.totalBeats??Math.max(...plan.map(s=>s.beat+s.beats));
 const chordAt=beat=>plan.find(s=>beat>=s.beat-epsilon&&beat<s.beat+s.beats-epsilon);
 const isBass=n=>n.role==='bass'||n.part==='bass';
 const isFill=n=>n.fill||n.articulation==='fill';
 const output=[];
 for(let bar=Math.floor(Math.min(0,plan[0].beat)/bb)*bb;bar<end-epsilon;bar+=bb){
  const finish=Math.min(bar+bb,end),index=Math.round(bar/bb),phase=((index%4)+4)%4;
  const form=mode==='space'?'space':mode==='two'?(phase%2?'answer':'normal'):['normal','space','lift','answer'][phase];
  const notes=events.filter(n=>n.beat>=bar-epsilon&&n.beat<finish-epsilon);
  const upper=notes.filter(n=>!isBass(n)&&!isFill(n)).sort((a,b)=>a.beat-b.beat||a.note-b.note);
  const groups=[];
  for(const n of upper){const previous=groups.at(-1);if(previous&&(n.phraseAttack??n.beat)-(previous[0].phraseAttack??previous[0].beat)<.02)previous.push(n);else groups.push([n]);}
  let selected=notes.filter(isBass).map(n=>({...n}));
  // In variations even old POP fills yield to sustained/new melody notes.
  selected.push(...notes.filter(n=>isFill(n)&&!melodyBusyAt(melody,n.beat)&&!melody.some(m=>overlap(m,n.beat,n.beat+n.duration))).map(n=>({...n})));
  groups.forEach((group,i)=>{
   group.sort((a,b)=>a.note-b.note);
   const chord=chordAt(group[0].beat),arrival=chord&&Math.abs(group[0].beat-chord.beat)<.02;
   const tied=group.some(n=>['tied','held'].includes(n.articulation));
   const anchor=(cfg.anchors[bb===3?(compound?'compound':'three'):'four']||[]).some(at=>Math.abs(group[0].beat-bar-at)<.06);
   const localForm=melodyBusyAt(melody,group[0].beat)?'space':form;
   if(localForm==='space'&&i%2&&!arrival&&!tied&&!anchor)return;
   if(mode==='two'&&localForm==='answer'&&!anchor&&!arrival&&!tied)return;
   let voices=group;
   if(localForm==='space')voices=sparseVoices(group,chord);
   if(localForm==='answer')voices=mode==='two'?[group.at(-1)]:group;
   // The four-bar lift and final answer retain the full harmonic voicing.
   selected.push(...voices.map(n=>({...n,velocity:n.velocity*(localForm==='space'?.88:localForm==='answer'?.94:1)})));
  });
  // Sparse patterns retain their rests; ties retain one attack. Reply slots are
  // authored per pattern/meter, never a random density multiplier or swing shift.
  if(['answer','lift'].includes(form)&&finish>=bar+bb-epsilon){
   const slots=form==='lift'&&pattern==='textureTriplet'?(bb===4?[2,2+1/3,2+2/3]:compound?[1.5,2,2.5]:[2,2+1/3,2+2/3]):bb===4?cfg.four:bb===3?(compound?cfg.compound:cfg.three):[];
   for(const [i,local] of slots.entries()){
    const beat=bar+local,chord=chordAt(beat);if(!chord)continue;
    const duration=Math.min(.36*(options.gate??.82),chord.beat+chord.beats-beat,finish-beat);
    if(duration<.06||!phraseReplyAllowed(melody,beat,duration))continue;
    // A reply can sit over held harmony. Never re-strike its held pitch.
    if(notes.some(n=>!isBass(n)&&isFill(n)&&overlap({start:n.beat,end:n.beat+n.duration},beat,beat+duration)))continue;
    const upper=[...new Set(chord.notes.slice(1))].sort((a,b)=>a-b);if(!upper.length)continue;
    const sustained=selected.filter(n=>['held','tied'].includes(n.articulation)&&n.beat<beat&&n.beat+n.duration>beat+epsilon);
    const reverse=(Math.floor(index/4)+(options.seed??42))%2===1;
    let pitch=(i+(reverse?1:0))%2?upper.at(-1):upper[0];
    while(sustained.some(n=>n.note===pitch)&&pitch+12<=96)pitch+=12;
    if(sustained.some(n=>n.note===pitch))continue;
    if(mode==='two')selected=selected.filter(n=>isBass(n)||isFill(n)||['held','tied'].includes(n.articulation)||Math.abs(n.beat-beat)>=.02);
    for(const n of selected)if(!isBass(n)&&!['held','tied'].includes(n.articulation)&&n.beat<beat&&n.beat+n.duration>beat)n.duration=beat-n.beat;
    const sample=events.find(n=>!isBass(n));
    let random=(Math.imul((options.seed??42)^(index*131+i*17),1664525)+1013904223)>>>0;
    const velocity=clamp((form==='lift'?.53:.47)+[0,-.025,.015,-.045][phase]+(random/4294967296-.5)*.06*clamp(Number(options.human??.25),0,1),.25,.86);
    selected.push({beat,note:pitch,duration,velocity,articulation:'phrase',fill:false,
     ...(sample&&'part' in sample?{part:'upper'}:{}),...(sample&&'role' in sample?{role:'chords'}:{})});

   }
  }
  output.push(...selected);
 }
 // Changes of harmony, leading/trailing silence and repeated keys remain hard
 // boundaries after rearranging. Absolute bars preserve phase when cueing later.
 const sorted=output.flatMap(n=>{const chord=chordAt(n.beat);if(!chord)return [];return [{...n,duration:Math.min(n.duration,chord.beat+chord.beats-n.beat,end-n.beat)}];}).filter(n=>n.duration>epsilon).sort((a,b)=>a.beat-b.beat||a.note-b.note);
 const last=new Map(),clean=[];
 for(const n of sorted){const previous=last.get(n.note);
  if(previous&&Math.abs(previous.beat-n.beat)<epsilon){previous.duration=Math.max(previous.duration,n.duration);previous.velocity=Math.max(previous.velocity,n.velocity);continue;}
  if(previous)previous.duration=Math.min(previous.duration,n.beat-previous.beat);
  clean.push(n);last.set(n.note,n);
 }
 return clean.filter(n=>n.duration>epsilon);
}
