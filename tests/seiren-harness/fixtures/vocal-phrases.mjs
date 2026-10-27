// Original vocal-like phrases, not transcriptions of unavailable recordings.
// Repeated over the audit's C–G–Am–F–C–G–F–G chart; all timings are quarter beats.
const pitches=[[64,67],[67,62],[69,72],[65,69],[64,72],[67,74],[65,69],[67,62]];
export const vocalPhrases=[
 {name:'legato with a breath',notes:pitches.flatMap(([a,b],i)=>[{pitch:a,start:i*4,end:i*4+1.5},{pitch:b,start:i*4+1.75,end:i*4+3}])},
 {name:'syncopated entrance',notes:pitches.flatMap(([a,b],i)=>[{pitch:a,start:i*4+.5,end:i*4+2},{pitch:b,start:i*4+2.25,end:i*4+3.1}])},
 {name:'long tone then short answer',notes:pitches.flatMap(([a,b],i)=>i%2?[{pitch:a,start:i*4,end:i*4+.75},{pitch:b,start:i*4+1,end:i*4+2.5}]:[{pitch:a,start:i*4,end:i*4+2.75}])}
];
