import {stretchChannels} from './audio-stretch.js?v=seiren-web-20261103';
self.onmessage=({data})=>{
 try{
  let last=-1;
  const channels=stretchChannels(data.channels,data.sampleRate,data.ratio,p=>{const percent=Math.floor(p*100);if(percent>=last+5){last=percent;self.postMessage({progress:p});}});
  self.postMessage({channels},channels.map(c=>c.buffer));
 }catch(error){self.postMessage({error:error.message});}
};
