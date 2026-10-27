import {parse,pitchName} from './music.js?v=seiren-pop-1';
import {parseBar} from './solutions.js?v=seiren-pop-1';
import {compatible,overlaps} from './harmony.js?v=seiren-pop-1';
import {asianPopStudies} from './mandarin-pop.js?v=seiren-pop-1';
const mod=n=>((n%12)+12)%12;
export function transposePopChord(symbol,key){
 const c=parse(symbol);return pitchName(c.root+key.root,key)+c.q+(symbol.includes('/')?'/'+pitchName(c.bass+key.root,key):'');
}
function fit(symbol,notes,start,end,policy){
 const c=parse(symbol);if(!c)return -Infinity;
 let score=0,total=0,hard=false;
 for(const n of notes.filter(n=>overlaps(n,{start,end}))){
  const duration=Math.min(end,n.end)-Math.max(start,n.start),anchor=n.end-n.start>=.45||Math.abs(n.start-Math.round(n.start))<.08;
  const w=duration*(anchor?2:.35),pc=mod(n.pitch);total+=w;
  score+=w*(c.pcs.includes(pc)?2.4:.15);
  if(anchor&&c.pcs.includes(mod(n.pitch-1))){score-=w*4;hard=true;}
  if(policy==='strict'&&![...c.pcs,c.bass].every(p=>compatible(p,n.pitch,'strict')))hard=true;
 }
 return {score:total?score/total:0,hard};
}
function simplePool(key){
 const scale=(key.mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(n=>mod(n+key.root));
 return scale.map((root,i)=>pitchName(root,key)+(mod(scale[(i+2)%7]-root)===3?(mod(scale[(i+4)%7]-root)===6?'dim':'m'):''));
}
function spansFor(study,total,bb,key){
 const spans=[];for(let bar=0;bar<total/bb;bar++){
  let t=bar*bb;for(const c of parseBar(study.bars[bar%study.bars.length],bb)){
   spans.push({start:t,end:t+c.beats,symbol:transposePopChord(c.symbol,key)});t+=c.beats;
  }
 }return spans;
}
export function arrangeAsianPop(melody,{key,style,seed=0,beatsPerBar=4,policy='musical',previous=[],pickupBeats,pickup=true}={}){
 const totalBeats=Math.ceil(Math.max(...melody.map(n=>n.end))/beatsPerBar)*beatsPerBar;
 let studies=asianPopStudies(style).filter(s=>s.mode===key.mode);
 if(!studies.length)return null; // Keep the existing minor-style arranger when no curated family matches.
 const ranked=studies.map(study=>{
  const segments=spansFor(study,totalBeats,beatsPerBar,key);
  const score=segments.reduce((sum,s)=>sum+fit(s.symbol,melody,s.start,s.end,policy).score*(s.end-s.start),0)/totalBeats-study.level*.08;
  return {study,segments,score};
 }).sort((a,b)=>b.score-a.score);
 // A bounded shortlist provides variation without admitting a badly fitting progression.
 const shortlist=ranked.filter(s=>s.score>=ranked[0].score-.5).slice(0,6);
 const chosen=shortlist[mod(seed)%shortlist.length],segments=[],fallback=simplePool(key);
 for(let i=0;i<chosen.segments.length;i++){
  const s=chosen.segments[i],active=melody.filter(n=>overlaps(n,s)),c=parse(s.symbol),next=parse(chosen.segments[i+1]?.symbol);
  const pc=pitchName(c.root,key),qualities=c.minor?['m','m7','madd9']:['','add9','6','sus2','sus4'];
  const candidates=[s.symbol,...qualities.map(q=>pc+q),...fallback];
  if(next)candidates.push(pitchName(next.root+7,key)+'7');
  const unique=[...new Set(candidates)].map(symbol=>({symbol,...fit(symbol,melody,s.start,s.end,policy)}));
  let safe=unique.filter(c=>!c.hard);
  if(!safe.length)safe=unique; // The final performed-note audit remains authoritative for dense chromatic phrases.
  const best=Math.max(...safe.map(c=>c.score));
  let options=safe.filter(c=>c.score>=best-.7);
  options.sort((a,b)=>{
   const preference=x=>(x.symbol===s.symbol?.65:0)+(parse(x.symbol).root===c.root?.2:0)-(previous.some(p=>p.start===s.start&&p.symbol===x.symbol)?.08:0);
   return b.score+preference(b)-a.score-preference(a);
  });
  const symbol=active.length?options[0].symbol:s.symbol;
  segments.push({...s,symbol,core:symbol,idea:chosen.study.title});
 }
 const first=Math.min(...melody.map(n=>n.start));
 if(pickup&&pickupBeats===undefined&&first>=Math.max(1,beatsPerBar-2)&&first<beatsPerBar){
  const rest=segments.filter(s=>s.start>=beatsPerBar);segments.splice(0,segments.length,{start:0,end:beatsPerBar,symbol:'N.C.',core:'N.C.'},...rest);
 }
 return {segments,totalBeats,idea:chosen.study.title};
}
