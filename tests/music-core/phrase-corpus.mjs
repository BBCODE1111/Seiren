import {createHash} from 'node:crypto';
const names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
// Captured from the deployed pre-phrase revision. Never regenerate to hide a
// failure: ORIGINAL and omitted settings must retain these event arrays.
export function phraseCorpus(performance,ids,meters,extra={}){
 const result={};
 for(const id of ids){const hash=createHash('sha256');let count=0;
  for(let root=0;root<12;root++)for(const mode of ['major','minor'])for(const voicing of ['close','open','rootless'])for(const seed of [1,42])for(const [barBeats,meter] of meters){
   const degrees=mode==='major'?[0,9,5,7]:[0,5,8,7],qualities=mode==='major'?['maj7','m7','maj7','7']:['m','m7','maj7','7b9'];
   const symbols=degrees.map((degree,i)=>names[(degree+root)%12]+qualities[i]);
   const bars=Array.from({length:8},(_,i)=>({chords:i===7?[]:i===2?[{symbol:symbols[2],beats:barBeats/2},{symbol:symbols[3],beats:barBeats/2}]:[{symbol:symbols[i%4],beats:barBeats}]}));
   const options={root,mode,key:{root,mode},barBeats,meter,voicing,seed,human:seed===42?.35:0,gate:.82,pianoFills:seed===42?'light':'off',popFill:seed===42?'more':'off',melodyText:'R:1 F5:2 R:9 G5:4',melody:[{pitch:77,start:1,end:3},{pitch:79,start:3*barBeats,end:4*barBeats}],...extra};
   hash.update(JSON.stringify(performance(bars,id,options)));count++;
  }result[id]={count,sha256:hash.digest('hex')};
 }return result;
}
