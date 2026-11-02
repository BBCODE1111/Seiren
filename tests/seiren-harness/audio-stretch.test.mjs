import test from 'node:test';
import assert from 'node:assert/strict';
import {stretchChannels,stretchRatio} from '../../audio-stretch.js';

test('original speed is sample-exact and never mutates the recording',()=>{
 const source=Float32Array.from({length:1000},(_,i)=>Math.sin(i)*.4),before=source.slice();
 const [out]=stretchChannels([source],22050,1);
 assert.deepEqual(out,before);assert.deepEqual(source,before);assert.notEqual(out,source);
 for(const ratio of [0,.49,2.01,NaN,Infinity])assert.throws(()=>stretchRatio(ratio,1));
});

test('tempo changes duration while preserving pitch and stereo phase',()=>{
 for(const sampleRate of [22050,44100,48000])for(const ratio of [.5,.8,1.25,2]){
  const length=sampleRate*3,left=Float32Array.from({length},(_,i)=>.3*Math.sin(2*Math.PI*220*i/sampleRate)),right=left.map(x=>x*.5);
  const result=stretchChannels([left,right],sampleRate,ratio);
  assert.equal(result[0].length,Math.ceil(length/ratio));
  const lo=Math.round(result[0].length*.2),hi=Math.round(result[0].length*.8);let crossings=0,energy=0;
  for(let i=0;i<result[0].length;i++){
   assert.ok(Number.isFinite(result[0][i]));assert.ok(Math.abs(result[1][i]-result[0][i]*.5)<1e-6);
   if(i>lo&&i<hi&&result[0][i-1]<0&&result[0][i]>=0)crossings++;
   energy+=result[0][i]**2;
  }
  assert.ok(Math.abs(crossings*sampleRate/(hi-lo)-220)<1.5,`${sampleRate} / ${ratio}: pitch shifted`);
  assert.ok(Math.sqrt(energy/result[0].length)>.19,'audio became silent');
 }
});

test('moderate tempo changes keep separated syllable attacks near the beat clock',()=>{
 const sampleRate=44100,source=Float32Array.from({length:sampleRate*4},(_,i)=>{
  const t=i/sampleRate,p=t%1;return p>.2&&p<.35?.4*Math.sin(2*Math.PI*220*t):0;
 });
 for(const ratio of [.8,1.25]){
  const [out]=stretchChannels([source],sampleRate,ratio),attacks=[];let active=false;
  for(let i=0;i<out.length;i+=220){const block=out.subarray(i,i+220),energy=block.reduce((s,v)=>s+v*v,0)/block.length;if(energy>.01&&!active)attacks.push(i/sampleRate);active=energy>.01;}
  assert.equal(attacks.length,4);
  attacks.forEach((time,i)=>assert.ok(Math.abs(time-(i+.2)/ratio)<.035,'attack drift exceeds 35ms'));
 }
});

test('silence, short recordings and the final held syllable are retained',()=>{
 for(const ratio of [.5,.8,1.25,2]){
  const sr=22050,silence=new Float32Array(sr),out=stretchChannels([silence],sr,ratio)[0];
  assert.ok(out.every(v=>v===0));
  const short=Float32Array.from({length:Math.round(sr*.15)},(_,i)=>.3*Math.sin(2*Math.PI*220*i/sr));
  const rendered=stretchChannels([short],sr,ratio)[0];
  assert.equal(rendered.length,Math.ceil(short.length/ratio));
  assert.ok(rendered.slice(-Math.round(sr*.02)).some(v=>Math.abs(v)>.05));
 }
});
