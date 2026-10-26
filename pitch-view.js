// Split at silence, low confidence and octave-sized jumps; never bridge unvoiced gaps.
export function contourSegments(curve,{minBeat=-Infinity,endBeat=Infinity,minPitch=0,maxPitch=127}={}){
 const segments=[];let run=[];
 const flush=()=>{if(run.length>1)segments.push(run);run=[];};
 for(const p of curve||[]){if(!Number.isFinite(p.beat)||!Number.isFinite(p.midi)||p.confidence<.8||p.beat<minBeat||p.beat>endBeat||p.midi<minPitch||p.midi>maxPitch){flush();continue;}if(run.length&&(p.beat<=run.at(-1).beat||Math.abs(p.midi-run.at(-1).midi)>7))flush();run.push(p);}
 flush();return segments;
}
