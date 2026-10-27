import {estimateTempo,inferKeys} from './analysis.js?v=seiren-4';
import {tempoScore} from './audio-features.js';
// File labels are source metadata, never acoustic ground truth. Show their provenance.
export function sourceHints(name){
 const text=name.replace(/\.[^.]+$/,'');
 // Prefer a number written next to "bpm" (e.g. "..._29_128_Bpm_..."), then a bare 2–3 digit field.
 const tagged=text.match(/(?:^|[_\s-])(\d{2,3})\s?[_-]?bpm(?=[_\s-]|$)/i)||text.match(/bpm\s?[_-]?(\d{2,3})(?=[_\s-]|$)/i);
 const fields=[...text.matchAll(/(?:^|[_\s-])(\d{2,3})(?=[_\s-]|$)/g)].map(m=>+m[1]).filter(n=>n>=40&&n<=240);
 const bpm=tagged&&+tagged[1]>=40&&+tagged[1]<=240?+tagged[1]:fields.length?fields[0]:null;
 const keyMatch=text.match(/(?:^|[_\s-])([A-G])([#b]?)(maj(?:or)?|min(?:or)?|m)(?=[_\s-]|$)/i)||text.match(/key[_\s-]?([A-G])([#b]?)(maj(?:or)?|min(?:or)?|m)?(?=[_\s-]|$)/i);
 const roots={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 const key=keyMatch?{root:(roots[keyMatch[1].toUpperCase()]+(keyMatch[2]==='#'?1:keyMatch[2]==='b'?-1:0)+12)%12,mode:keyMatch[3]?(/^maj/i.test(keyMatch[3])?'major':'minor'):null}:null;
 return {bpm,key};
}
// Tempo choice. Sample-library loops are cut on bar lines: their length equals 1/2/4/8/16/32
// bars at an integer (or .5) BPM to within a millisecond. Only that exact evidence turns on
// the loop prior; any other recording is judged on onset evidence plus a 70–150 BPM prior.
export function loopTempos(duration){
 const out=[];for(const bars of [1,2,4,8,16,32]){const raw=bars*240/duration;if(raw<55||raw>190)continue;const bpm=Math.round(raw*2)/2;if(Math.abs(duration-bars*240/bpm)<.001)out.push({bpm,bars});}
 return out;
}
export function chooseTempo(candidates,duration,envelope=null){
 const prior=bpm=>Math.exp(-((Math.log2(bpm/105))**2)/(2*.42**2));
 const evidence=(bpm,fallback=0)=>envelope?Math.max(fallback,tempoScore(envelope,bpm)):fallback;
 const loops=loopTempos(duration);
 const pool=loops.length?loops.map(l=>({bpm:l.bpm,loop:1,bars:l.bars,score:evidence(l.bpm)})):
  candidates.flatMap(c=>[1,2,.5].map(f=>({bpm:c.bpm*f,loop:0,score:evidence(c.bpm*f,c.score*(f===1?1:.85))}))).filter(c=>c.bpm>=55&&c.bpm<=190);
 pool.forEach(c=>c.total=c.score+.25*prior(c.bpm));
 pool.sort((a,b)=>b.total-a.total);return pool[0]||null;
}
// Bar 1 is not "the first note": test each beat phase and keep the one that puts long /
// accented notes on beat 1 and 3. Notes before it become a pickup (BAR 0).
export function chooseDownbeat(notes,bpm,{loop=0,beats=[]}={}){
 if(loop>.6)return {downbeatTime:0,pickupBeats:0,reason:'loop'};
 const beat=60/bpm,first=notes[0].start;
 let anchor=first;if(beats.length){const near=beats.reduce((a,b)=>Math.abs(b-first)<Math.abs(a-first)?b:a,beats[0]);if(Math.abs(near-first)<beat*.3)anchor=near;}
 let best=null;
 for(let k=0;k<4;k++){const db=anchor+k*beat;let score=0;
  for(const n of notes){const b=(n.start-db)/beat,len=(n.end-n.start)/beat,pos=((b%4)+4)%4;
   const w=Math.min(2,len)+.3;if(Math.abs(pos-Math.round(pos))>.12)continue;const r=Math.round(pos)%4;score+=r===0?w*1.6:r===2?w*.8:w*.15;}
  score-=k*.35; // small preference for no pickup
  if(!best||score>best.score)best={downbeatTime:db,pickupBeats:Math.round(k*2)/2,score};}
 return {...best,reason:'phase'};
}
// Decode one dominant melodic line, instead of treating vocal vibrato/harmonics as polyphony.
// Small pitch changes need sustained evidence; silence is a competing path.
export function decodeMelody(frames,onsets=[],{frameTime=i=>i*256/22050,minFrames=8}={}){
 let previous=[],costs=[];const rows=[],backs=[];
 for(let t=0;t<frames.length;t++){
  const row=frames[t],best=row.map((p,i)=>({pitch:i+21,p})).filter(n=>n.pitch>=36&&n.pitch<=96).sort((a,b)=>b.p-a.p).slice(0,6),peak=best[0]?.p||0;
  const states=[{pitch:null,p:Math.max(.001,1-peak)*.48},...best],next=[],back=[];
  states.forEach((n,i)=>{let score=Infinity,from=0;previous.forEach((p,j)=>{const d=n.pitch===null||p.pitch===null?0:Math.abs(n.pitch-p.pitch);const change=n.pitch===p.pitch?0:n.pitch===null||p.pitch===null?1.1:2.4+Math.min(2,d*.12);const value=costs[j]+change;if(value<score){score=value;from=j;}});next[i]=(t?score:0)-Math.log(Math.max(.001,n.p));back[i]=from;});
  const floor=Math.min(...next);costs=next.map(v=>v-floor);previous=states;rows.push(states);backs.push(back);
 }
 if(!rows.length)return [];
 let index=costs.indexOf(Math.min(...costs));const path=Array(rows.length);
 for(let t=rows.length-1;t>=0;t--){path[t]=rows[t][index];index=backs[t][index];}
 const runs=[];for(let i=0;i<path.length;i++){const p=path[i];if(runs.at(-1)?.pitch===p.pitch){runs.at(-1).endFrame=i+1;runs.at(-1).sum+=p.p;}else runs.push({pitch:p.pitch,startFrame:i,endFrame:i+1,sum:p.p});}
 // Bridge only brief dropouts of the same pitch; preserve actual rests and semitone notes.
 for(let i=1;i<runs.length-1;i++){const a=runs[i-1],r=runs[i],b=runs[i+1];if(r.endFrame-r.startFrame<minFrames&&a.pitch!==null&&a.pitch===b.pitch){a.endFrame=b.endFrame;a.sum+=r.sum+b.sum;runs.splice(i,2);i--;}}
 const articulated=[];
 for(const run of runs){
  if(run.pitch===null)continue;let start=run.startFrame;const p=run.pitch-21;
  for(let t=start+minFrames+2;t<run.endFrame-minFrames;t++){
   const onset=onsets[t]?.[p]||0,previous=frames.slice(Math.max(start,t-14),t).map(row=>row[p]);
   if(onset>.82&&onset>(onsets[t-1]?.[p]||0)&&onset>=(onsets[t+1]?.[p]||0)&&Math.min(...previous)<Math.max(...previous)*.84&&frames[t][p]-Math.min(...previous)>.08){
    const cut=t-2;articulated.push({...run,startFrame:start,endFrame:cut,sum:run.sum*(cut-start)/(run.endFrame-run.startFrame)});start=cut;t+=minFrames;
   }
  }
  articulated.push({...run,startFrame:start,sum:run.sum*(run.endFrame-start)/(run.endFrame-run.startFrame)});
 }
 return articulated.filter(r=>r.endFrame-r.startFrame>=minFrames).map(r=>({pitch:r.pitch,start:Math.max(0,frameTime(r.startFrame)),end:frameTime(r.endFrame),velocity:.7,confidence:Math.min(1,r.sum/(r.endFrame-r.startFrame))}));
}
export function transcriptionResult(notes,duration,name,features=null){
 if(!notes.length)throw Error('未辨識出穩定旋律；請換乾聲或使用旋律 MIDI。');
 const hints=sourceHints(name),tempo=features?{bpm:features.bpm,candidates:features.candidates.map(c=>c.bpm),score:features.confidence,confidence:features.confidence>=.7?'起音較清楚；請確認半速／倍速':'節拍不明確，請比較候選或 TAP',method:'spectral-flux-dp'}:estimateTempo(notes.map(n=>n.start)),keys=inferKeys(notes);
 const picked=!hints.bpm&&features?.candidates?.length?chooseTempo(features.candidates,duration,features.envelope):null;
 const bpm=hints.bpm||picked?.bpm||tempo.bpm;
 const key=hints.key?.mode?hints.key:hints.key?(keys.candidates.find(k=>k.root===hints.key.root)||{...hints.key,mode:'major'}):keys.candidates[0];
 // Labelled loops retain leading rests. Unlabelled audio: loop-length and beat-phase evidence.
 const db=hints.bpm?{downbeatTime:0,pickupBeats:0}:chooseDownbeat(notes,bpm,{loop:picked?.loop||0,beats:features?.beats||[]});
 const offset=db.downbeatTime;
 return {notes,tempo:{...tempo,bpm},key,offset,downbeatTime:offset,pickupBeats:db.pickupBeats||0,hints,coverage:notes.reduce((s,n)=>s+n.end-n.start,0)/duration,
  reviewRequired:!hints.bpm||!hints.key,
  warnings:[hints.bpm?'速度採檔名 BPM 標記，保留開頭休止。':'速度與第 1 拍尚未確認。先核對 BPM；若有弱起，請用 DOWNBEAT 點選 BAR 1 的強拍音。',hints.key?'調性採檔名標記；音高仍由音訊辨識，不強制貼齊音階。':'調性是候選，請比較相對大小調並確認。','辨識主旋律，非多軌分離。先比較原音與辨識音符；顫音、滑音及殘響仍可能需要修正。']};
}
