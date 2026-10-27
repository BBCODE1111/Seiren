import {yinPitch} from './analysis.js?v=seiren-4';
import {normalizeTempoMap,secondsToBeat} from './midi.js?v=seiren-4';
const median=a=>{const s=[...a].sort((a,b)=>a-b);return s[Math.floor(s.length/2)]||0;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Radix-2 FFT, positive log-magnitude differences: independent of transcribed notes.
function magnitudes(frame){
 const n=frame.length,re=Float64Array.from(frame),im=new Float64Array(n);
 for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[re[i],re[j]]=[re[j],re[i]];}
 for(let len=2;len<=n;len*=2){const angle=-2*Math.PI/len,cr=Math.cos(angle),ci=Math.sin(angle);for(let i=0;i<n;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const a=i+j,b=a+len/2,tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b];re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const next=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=next;}}}
 return re.slice(0,n/2).map((v,i)=>Math.log1p(10*Math.hypot(v,im[i])));
}
export function onsetEnvelope(samples,sampleRate){
 const size=512,hop=Math.max(1,Math.round(sampleRate*.01)),window=Float32Array.from({length:size},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(size-1)));
 let previous=new Float64Array(size/2);const raw=[];
 for(let center=0;center<samples.length;center+=hop){const frame=Float32Array.from(window,(w,i)=>(samples[center+i-size/2]||0)*w),spectrum=magnitudes(frame);let flux=0;for(let k=2;k<spectrum.length;k++)flux+=Math.max(0,spectrum[k]-previous[k]);raw.push(flux);previous=spectrum;}
 const clean=raw.map((v,i)=>{const local=raw.slice(Math.max(0,i-10),i+11);return Math.max(0,v-local.reduce((a,b)=>a+b,0)/local.length*.7);});
 const peak=Math.max(1e-9,...clean);return {values:clean.map(v=>v/peak),hopSeconds:hop/sampleRate,duration:samples.length/sampleRate};
}
// Score one tempo against the onset envelope (same measure as tempoCandidates), so tempos
// implied by the loop length can be compared with autocorrelation peaks on equal terms.
export function tempoScore(envelope,bpm){
 const {values:x,hopSeconds:hop}=envelope,n=x.length,lag=60/bpm/hop;if(!(lag>1)||lag>n/2)return 0;
 const peaks=x.flatMap((v,i)=>v>.15&&v>=(x[i-1]||0)&&v>(x[i+1]||0)?[{i,v}]:[]);if(peaks.length<4)return 0;
 let cross=0,a=0,b=0;for(let i=Math.ceil(lag);i<n;i++){const p=i-lag,j=Math.floor(p),v=x[j]*(1-p+j)+(x[j+1]||0)*(p-j);cross+=x[i]*v;a+=x[i]**2;b+=v*v;}
 const correlation=cross/Math.sqrt(a*b||1),weight=peaks.reduce((s,p)=>s+p.v,0);let alignment=0;
 for(const phase of peaks.slice(0,12)){const fit=peaks.reduce((s,p)=>{const position=(p.i-phase.i)/lag,error=Math.abs(position-Math.round(position));return s+p.v*Math.exp(-((error/.06)**2));},0)/weight;alignment=Math.max(alignment,fit);}
 return clamp(correlation*.75+alignment*.25,0,1);
}
export function tempoCandidates(envelope){
 const {values:x,hopSeconds:hop}=envelope,n=x.length,peaks=x.flatMap((v,i)=>v>.15&&v>=(x[i-1]||0)&&v>(x[i+1]||0)?[{i,v}]:[]);
 if(peaks.length<4)return [];
 const scores=[];
 for(let bpm=40;bpm<=240;bpm+=.5){const lag=60/bpm/hop;if(lag>n/2)continue;let cross=0,a=0,b=0;
  for(let i=Math.ceil(lag);i<n;i++){const p=i-lag,j=Math.floor(p),v=x[j]*(1-p+j)+(x[j+1]||0)*(p-j);cross+=x[i]*v;a+=x[i]**2;b+=v*v;}
  const correlation=cross/Math.sqrt(a*b||1);let alignment=0;const weight=peaks.reduce((s,p)=>s+p.v,0);for(const phase of peaks.slice(0,12)){const fit=peaks.reduce((s,p)=>{const position=(p.i-phase.i)/lag,error=Math.abs(position-Math.round(position));return s+p.v*Math.exp(-((error/.06)**2));},0)/weight;alignment=Math.max(alignment,fit);}scores.push({bpm,score:correlation*.75+alignment*.25+.001*bpm/240});
 }
 scores.sort((a,b)=>b.score-a.score);const selected=[];
 for(const c of scores)if(c.score>.1&&selected.every(p=>Math.abs(Math.log2(c.bpm/p.bpm))>.08)){selected.push(c);if(selected.length===3)break;}
 return selected.map(c=>({...c,score:clamp(c.score,0,1)}));
}
// Local onset evidence + a logarithmic inter-beat-interval transition cost (Ellis, 2007).
export function trackBeats(envelope,bpm){
 const {values:x,hopSeconds:hop}=envelope;if(!Number.isFinite(bpm)||bpm<30||bpm>300)throw Error('Invalid tracker tempo.');
 if(!x.length||Math.max(...x)<.01)return {beats:[],confidence:0};
 const period=60/bpm/hop,lo=Math.max(1,Math.floor(period*.65)),hi=Math.ceil(period*1.45),scores=new Float64Array(x.length),back=new Int32Array(x.length).fill(-1);
 const strength=x.map((v,i)=>Math.max(v,(x[i-1]||0)*.65,(x[i+1]||0)*.65));
 for(let i=0;i<x.length;i++){let best=0;for(let lag=lo;lag<=hi&&lag<=i;lag++){const value=scores[i-lag]-8*Math.log(lag/period)**2;if(value>best){best=value;back[i]=i-lag;}}scores[i]=best+strength[i]*2;}
 let end=0;for(let i=0;i<x.length;i++)if(scores[i]>scores[end])end=i;
 const indices=[];for(let i=end;i>=0;i=back[i]){indices.push(i);if(back[i]<0)break;}indices.reverse();
 while(indices.length&&strength[indices[0]]<.12)indices.shift();while(indices.length&&strength[indices.at(-1)]<.12)indices.pop();
 const beats=indices.map(i=>i*hop),support=indices.reduce((s,i)=>s+strength[i],0)/Math.max(1,indices.length);
 return {beats,confidence:clamp(support*Math.min(1,beats.length/8),0,1)};
}
export function timingFromBeats(beats,downbeatTime=0){
 if(beats.length<4||beats.some((t,i)=>!Number.isFinite(t)||t<0||i&&t<=beats[i-1]))throw Error('At least four ordered beats are required.');
 const map=beats.slice(0,-1).map((t,i)=>({beat:i,bpm:60/(beats[i+1]-t)}));
 if(map.some(t=>t.bpm<30||t.bpm>300))throw Error('Beat intervals are outside 30–300 BPM.');
 const origin=secondsToBeat(downbeatTime-beats[0],map);
 return normalizeTempoMap(map.map(t=>({...t,beat:t.beat-origin})));
}
export function pitchContour(samples,sampleRate,progress=()=>{}){
 const size=1024,hop=Math.round(sampleRate*.04),curve=[];
 for(let center=0;center<samples.length;center+=hop){const frame=Float32Array.from({length:size},(_,i)=>samples[center+i-size/2]||0),p=yinPitch(frame,sampleRate);curve.push({time:center/sampleRate,midi:p&&p.confidence>=.8?p.midi:null,confidence:p?.confidence||0});if(curve.length%100===0)progress(center/samples.length);}
 return curve;
}
export function analyzeAudioFeatures(samples,sampleRate=22050,progress=()=>{}){
 // Average pairs before downsampling; pitch analysis is intended for clean monophonic sources.
 const pcm=sampleRate===22050?Float32Array.from({length:Math.floor(samples.length/2)},(_,i)=>(samples[i*2]+samples[i*2+1])*.5):samples,rate=sampleRate===22050?11025:sampleRate;
 const envelope=onsetEnvelope(pcm,rate);progress(.2);const candidates=tempoCandidates(envelope),best=candidates[0],rhythm=best?trackBeats(envelope,best.bpm):{beats:[],confidence:0};
 const pitch=pitchContour(pcm,rate,p=>progress(.2+.8*p));
 return {envelope,candidates,bpm:best?.bpm||120,...rhythm,pitch};
}
export function tapEstimate(times){
 const intervals=times.slice(1).map((t,i)=>t-times[i]);if(intervals.length<3)return null;
 const interval=median(intervals),spread=median(intervals.map(t=>Math.abs(t-interval)));
 return {bpm:Math.round(60000/interval*2)/2,confidence:clamp(1-spread/interval*4,0,1)};
}
