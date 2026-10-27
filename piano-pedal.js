// Optional export pedal. Inputs and output times are quarter-note beats.
// Re-pedal at melody boundaries as well as harmony boundaries: sustained MIDI
// notes must not cross into a syllable that the protected key-down list avoided.
export function pedalIntervals({chordSpans=[],notes=[],melody=[],totalBeats}={}){
 if(!notes.length)return [];
 const end=totalBeats??Math.max(...notes.map(n=>n.end));
 let spans=chordSpans;
 if(!spans.length){
  const changes=[];for(const n of [...notes].sort((a,b)=>a.start-b.start))if(!changes.length||n.chord!==changes.at(-1).symbol)changes.push({start:n.start,symbol:n.chord});
  spans=changes.map((c,i)=>({...c,end:changes[i+1]?.start??end}));
 }
 const cuts=melody.flatMap(n=>[n.start,n.end]);
 return spans.flatMap((c,i)=>{
  const start=c.start,finish=Math.min(c.end??spans[i+1]?.start??end,end);
  if(c.symbol==='N.C.'||!Number.isFinite(start)||finish<=start)return [];
  const boundaries=[start,...cuts.filter(t=>t>start&&t<finish),finish].sort((a,b)=>a-b);
  return boundaries.slice(0,-1).flatMap((a,j)=>boundaries[j+1]>a?[{start:a,end:boundaries[j+1]}]:[]);
 });
}
export function pedalMidiEvents(spans,ppq,channel=0,shift=0){
 if(!spans.length)return [];
 const events=[{tick:0,order:-1,bytes:[0xb0+channel,64,0]}];
 for(const span of spans){
  const on=Math.max(0,Math.round((span.start+shift)*ppq))+10,off=Math.max(0,Math.round((span.end+shift)*ppq)-10);
  if(off<=on)continue;
  events.push({tick:on,order:-1,bytes:[0xb0+channel,64,127]},{tick:off,order:-1,bytes:[0xb0+channel,64,0]});
 }
 events.push({tick:Math.max(0,...spans.map(s=>Math.round((s.end+shift)*ppq))),order:-1,bytes:[0xb0+channel,64,0]});
 return events.sort((a,b)=>a.tick-b.tick||a.bytes[2]-b.bytes[2]);
}
