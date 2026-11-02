import Stretch from './vendor/soundtouch/Stretch.js';

export function stretchRatio(bpm,sourceBpm){
 const ratio=bpm/sourceBpm;
 if(!Number.isFinite(ratio)||ratio<.5||ratio>2)throw Error('原音保留音高變速支援原速的 0.5–2 倍；請調整 BPM，或改用 MIDI 旋律。');
 return ratio;
}

// Offline WSOLA: one stereo pipeline keeps the channels phase-linked. Never
// resample the original to change tempo. Process away from the UI/audio thread.
export function stretchChannels(channels,sampleRate,ratio,onProgress=()=>{}){
 stretchRatio(ratio,1);
 const length=channels[0]?.length;
 if(!length||channels.length>2||!channels.every(c=>c.length===length)||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('不支援的原音格式。');
 if(Math.abs(ratio-1)<1e-9)return channels.map(c=>c.slice());
 const target=Math.ceil(length/ratio),output=channels.map(()=>new Float32Array(target));
 const engine=new Stretch({sampleRate,createBuffers:true});engine.tempo=ratio;
 engine.setStretchParameters({sequenceMs:60,seekWindowMs:20,overlapMs:12,quickSeek:true});
 const block=8192,input=new Float32Array(block*2),scratch=new Float32Array(block*4);
 // Reflected context prevents the first/last syllables being consumed as analysis padding.
 const pad=Math.min(length,Math.round(sampleRate*.12)),paddedLength=length+2*pad;
 let written=0,skip=Math.round(pad/ratio);
 const drain=()=>{while(engine.outputBuffer.frameCount){const count=Math.min(block*2,engine.outputBuffer.frameCount);engine.outputBuffer.receiveSamples(scratch,count);const offset=Math.min(count,skip);skip-=offset;const take=Math.min(count-offset,target-written);for(let c=0;c<output.length;c++)for(let i=0;i<take;i++)output[c][written+i]=scratch[(i+offset)*2+c];written+=take;}};
 // Zero-padding drains the last analysis windows; truncate to the musical clock.
 for(let at=0;at<paddedLength+sampleRate*.5&&written<target;at+=block){
  input.fill(0);const count=Math.min(block,Math.max(0,paddedLength-at));
  for(let i=0;i<count;i++){let index=at+i-pad;if(index<0)index=-index-1;else if(index>=length)index=2*length-index-1;input[i*2]=channels[0][index];input[i*2+1]=(channels[1]||channels[0])[index];}
  engine.inputBuffer.putSamples(input,0,block);engine.process();drain();onProgress(Math.min(1,(at+block)/paddedLength));
 }
 if(written<target)throw Error('原音變速未完成，請重試。');
 return output;
}
