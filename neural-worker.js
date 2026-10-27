import {analyzeAudioFeatures,trackBeats} from './audio-features.js';
import {transcribeFrames,frameTime} from './vendor/neural-runtime.js?v=seiren-pop-1';
import {decodeMelody,transcriptionResult} from './transcription.js?v=seiren-pop-1';
self.onmessage=async({data})=>{
 try{const {frames,onsets}=await transcribeFrames(data.samples,p=>self.postMessage({progress:p*.7}));const notes=decodeMelody(frames,onsets,{frameTime});self.postMessage({progress:.7,stage:'節拍與 F0 音高曲線'});const features=analyzeAudioFeatures(data.samples,22050,p=>self.postMessage({progress:.7+p*.3,stage:'節拍與 F0 音高曲線'}));const result=transcriptionResult(notes,data.samples.length/22050,data.name,features);if(result.hints.bpm||result.tempo.bpm!==features.bpm)Object.assign(features,trackBeats(features.envelope,result.tempo.bpm));result.features=features;self.postMessage({result});}
 catch(error){self.postMessage({error:'音訊辨識未完成：'+error.message+' 可重新分析或改用旋律 MIDI。'});}
};
