// Keep only the last render. A cancelled or stale render never replaces it.
export class OriginalAudioStretch {
 cancel(){if(this.worker){this.worker.terminate();this.worker=null;this.reject?.(new DOMException('已取消原音變速','AbortError'));this.reject=null;}}
 async prepare(source,ratio,context,onProgress=()=>{}){
  if(Math.abs(ratio-1)<1e-9)return source;
  if(this.cached?.source===source&&this.cached.ratio===ratio)return this.cached.buffer;
  this.cancel();
  const channels=Array.from({length:Math.min(2,source.numberOfChannels)},(_,i)=>source.getChannelData(i).slice());
  const worker=this.worker=new Worker(new URL('./audio-stretch-worker.js?v=seiren-web-20261103',import.meta.url),{type:'module'});
  return new Promise((resolve,reject)=>{
   this.reject=reject;
   const finish=()=>{worker.terminate();if(this.worker===worker){this.worker=null;this.reject=null;}};
   worker.onerror=()=>{finish();reject(Error('原音變速失敗，請重試或切換 MIDI 旋律。'));};
   worker.onmessage=({data})=>{
    if(this.worker!==worker)return;
    if(data.progress!==undefined){onProgress(data.progress);return;}
    finish();
    if(data.error){reject(Error(data.error));return;}
    try{const buffer=context.createBuffer(data.channels.length,data.channels[0].length,source.sampleRate);data.channels.forEach((c,i)=>buffer.copyToChannel(c,i));this.cached={source,ratio,buffer};resolve(buffer);}catch(error){reject(error);}
   };
   worker.postMessage({channels,sampleRate:source.sampleRate,ratio},channels.map(c=>c.buffer));
  });
 }
}
