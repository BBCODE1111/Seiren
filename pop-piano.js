// Original pop piano performances: a stable bar grid with optional phrase-end answers.
import {isTexture,renderTexture,applyPianoPhrase} from './piano-motion.js?v=1.1.0';
const mod=n=>((n%12)+12)%12;
export const popPianoPatterns={
 popWhole:{label:'POP 01 · Whole-bar pillars',hits:[0],bass:[0],hold:true},
 popHalf:{label:'POP 02 · Half-note pillars',hits:[0,2],bass:[0,2],hold:true},
 popQuarter:{label:'POP 03 · Quarter-note pillars',hits:[0,1,2,3],bass:[0,2]},
 popBackbeat:{label:'POP 04 · Soft backbeat',hits:[1,3],bass:[0,2]},
 popPush:{label:'POP 05 · Gentle syncopation',hits:[0,1.5,3],bass:[0,2]},
 popBassChord:{label:'POP 06 · Bass then chord',hits:[.5,2.5],bass:[0,2]},
 popSplit:{label:'POP 07 · Together / R / L / R',hits:[0,1,3],bass:[0,2],fifth:true},
 popEighth:{label:'POP 08 · Light eighths',hits:[0,.5,1,1.5,2,2.5,3,3.5],bass:[0,2],light:true},
 popBallad:{label:'POP 09 · Ballad pillars + answer',hits:[0,2],bass:[0],hold:true,fill:true},
 popAnswer:{label:'POP 10 · Call and response',hits:[0,1.5],bass:[0,2],fill:true},
 popLift:{label:'POP 11 · Chorus lift',hits:[0,1,2,2.5,3.5],bass:[0,2],fill:true},
 popCadence:{label:'POP 12 · Cadence + small fill',hits:[0,2.5],bass:[0,2],hold:true,fill:true}
};
export const isPopPiano=pattern=>Object.hasOwn(popPianoPatterns,pattern)||isTexture(pattern);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlap=(m,a,b)=>Math.min(m.end,b)-Math.max(m.start,a)>1e-7;
export function popPianoPerformance(plan,pattern,options={}){
 if(isTexture(pattern))return applyPianoPhrase(renderTexture(plan,pattern,{...options,fillMode:options.popFill==='off'?'off':options.popFill==='more'?'light':'phrase'}),plan,pattern,options);
 const cfg=popPianoPatterns[pattern];if(!cfg||!plan.length)return [];
 const bb=options.barBeats||4,end=Math.max(...plan.map(s=>s.beat+s.beats)),melody=options.melody||[];
 const gate=clamp(Number(options.gate??.82),.1,1),human=clamp(Number(options.human??.25),0,1),out=[];
 let state=(options.seed??42)>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 const chordAt=t=>plan.find(s=>t>=s.beat-1e-7&&t<s.beat+s.beats-1e-7);
 const add=(t,pitches,duration,velocity,role,articulation='rhythmic')=>{
  const s=chordAt(t);if(!s)return;
  // Human feel changes dynamics, never the clock of a straight vocal.
  for(let i=0;i<pitches.length;i++){
   const pitch=clamp(pitches[i],21,108),d=Math.min(duration*(articulation==='held'?1:gate),s.beat+s.beats-t,end-t);
   if(d>.015)out.push({beat:t,note:pitch,duration:d,velocity:clamp(velocity+(random()-.5)*.07*human+(i===pitches.length-1&&role!=='bass'?.025:0),.25,.86),role,articulation});
  }
 };
 for(let bar=0;bar<end-1e-7;bar+=bb){
  const barEnd=Math.min(bar+bb,end),onsets=melody.filter(n=>n.start>=bar&&n.start<barEnd),busy=onsets.length>=bb*1.5;
  // 3/4 and compound meters use their own pulse grid, not a stretched 4/4 pattern.
  const compound=options.meter?.denominator===8&&bb===3;
  const hits=bb===4?cfg.hits:cfg.hold?[0,compound?1.5:2].filter(t=>t<bb):Array.from({length:Math.ceil(bb/(compound?1.5:1))},(_,i)=>i*(compound?1.5:1));
  const bass=bb===4?cfg.bass:[0,compound?1.5:Math.min(2,bb)].filter(t=>t<bb);
  for(const [i,local] of bass.entries()){
   const t=bar+local,s=chordAt(t);if(!s)continue;
   const fifth=s.notes[0]+7,canFifth=cfg.fifth&&i%2&&s.notes.some(n=>mod(n)===mod(fifth));
   add(t,[canFifth?fifth:s.notes[0]],Math.min(1.8,bb-local),.60,'bass','anchor');
  }
  for(let i=0;i<hits.length;i++){
   const local=hits[i],t=bar+local,s=chordAt(t);if(!s)continue;
   const fractional=Math.abs(local-Math.round(local))>.01;
   if(busy&&cfg.light&&fractional)continue;
   const upper=s.notes.slice(1),pitches=busy||cfg.light?upper.slice(0,3):upper.slice(0,4);
   const until=(hits[i+1]??bb)-local,duration=cfg.hold?until*.91:Math.min(cfg.light?.32:.72,until*.86);
   add(t,pitches,duration,(busy?.49:.57)+(local===0?.04:0)-(fractional?.035:0),'chords',cfg.hold?'held':'pillar');
  }
  // A changed chord gets one arrival even when it falls between the groove's attacks.
  for(const s of plan.filter(s=>s.beat>=bar&&s.beat<barEnd)){
   if(!out.some(n=>n.role==='bass'&&Math.abs(n.beat-s.beat)<1e-7))add(s.beat,[s.notes[0]],Math.min(1.5,s.beats),.59,'bass','anchor');
   if(s.beat>bar+1e-7&&!out.some(n=>n.role==='chords'&&Math.abs(n.beat-s.beat)<1e-7))add(s.beat,s.notes.slice(1,4),Math.min(.65,s.beats),.53,'chords','pillar');
  }
  const fillMode=options.popFill||'auto',barNumber=Math.round(bar/bb)+1;
  const phraseEnd=barNumber%(fillMode==='more'?2:4)===0||barEnd>=end-1e-7;
  if(fillMode==='off'||!cfg.fill||!phraseEnd||busy||bb<2)continue;
  const start=barEnd-1,s=chordAt(start);if(!s||s.beat+s.beats<barEnd-1e-7)continue;
  const active=melody.filter(m=>overlap(m,start,barEnd));
  // A true gap or a settled long note can take a quiet response; a new lyric cannot.
  if(melody.length&&active.some(m=>m.start>start-.25||m.end-m.start<1.25))continue;
  const upper=s.notes.slice(1,5);if(upper.length<2)continue;
  const next=chordAt(barEnd),target=next?.notes[1]??upper[0];
  const toward=[...upper].sort((a,b)=>Math.abs(b-target)-Math.abs(a-target));
  const times=pattern==='popCadence'?[start+.25,start+.5,start+.75]:[start+.25,start+.75];
  // Only original chord-tone figures: no borrowed proprietary MIDI phrases.
  times.forEach((t,i)=>add(t,[toward[Math.min(i,toward.length-1)]],.2,.43,'chords','fill'));
 }
 out.sort((a,b)=>a.beat-b.beat||a.note-b.note);
 // Release a held pillar before its fill re-articulates the same key, so live
 // playback and MIDI cannot disagree about which note-off ends the voice.
 const nextAttack=new Map();
 for(let i=out.length-1;i>=0;i--){const n=out[i],next=nextAttack.get(n.note);if(next!==undefined)n.duration=Math.min(n.duration,next-n.beat);nextAttack.set(n.note,n.beat);}
 return applyPianoPhrase(out.filter(n=>n.duration>1e-7),plan,pattern,options);
}
