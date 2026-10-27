import {playMelodyTone} from './melody-synth.js?v=seiren-pop-1';
import {beatToSeconds,secondsToBeat,tempoAt} from './midi.js?v=seiren-pop-1';
import {Piano} from './piano.js?v=seiren-pop-1';
import {pickupTail,validatePickup} from './timeline.js';

// First pass may contain BAR 0. Every following pass has its own BAR 1 origin.
export function cycleTiming({startBeat=0,loopStartBeat=Math.max(0,startBeat),totalBeats,tempoMap}) {
 const start=beatToSeconds(startBeat,tempoMap),loopStart=beatToSeconds(loopStartBeat,tempoMap),end=beatToSeconds(totalBeats,tempoMap);
 const firstSeconds=end-start,cycleSeconds=end-loopStart;
 if(!(firstSeconds>0&&cycleSeconds>0))throw Error('Invalid playback region.');
 return {firstSeconds,cycleSeconds,start,loopStart,end,
  index:elapsed=>elapsed<firstSeconds?0:1+Math.floor((elapsed-firstSeconds)/cycleSeconds),
  origin:cycle=>cycle===0?0:firstSeconds+(cycle-1)*cycleSeconds};
}
export class MelodyPlayer {
 constructor(){this.context=null;this.playing=false;this.generation=0;this.voices=new Set();this.sources=new Set();this.timer=null;}
 async unlock(){this.context ||=new (window.AudioContext||window.webkitAudioContext)();await this.context.resume();this.piano ||=new Piano(this.context);await this.piano.load();this.melodyBus ||=this.context.createGain();if(!this.connected){this.melodyBus.connect(this.piano.mixInput||this.context.destination);this.connected=true;}return this.context;}
 setMix(melody=.35,harmony=1){if(this.melodyBus)this.melodyBus.gain.setTargetAtTime(melody,this.context.currentTime,.015);if(this.piano)this.piano.master.gain.setTargetAtTime(.68*harmony,this.context.currentTime,.015);}
 setLoop(enabled){
  this.loop=!!enabled;if(!this.playing)return;
  const now=this.context.currentTime;
  this.stopCycle=enabled?Infinity:this.timing.index(Math.max(0,now-this.origin))+1;
  // Cancel lookahead notes as well as complete original-audio buffers already queued.
  for(const [key,event] of this.scheduled) if(event.cycle>=this.stopCycle||!enabled&&event.pickup){
   try{if(event.voice?.cancel)event.voice.cancel();else event.voice?.stop();}catch{}
   this.scheduled.delete(key);
  }
  if(!enabled)for(const key of this.audioCycles.keys())if(key.startsWith('pickup:')||Number(key.split(':')[1])>=this.stopCycle)this.audioCycles.delete(key);
  for(const source of this.sources)if(source.cycle>=this.stopCycle||!enabled&&source.pickup){try{source.stop();}catch{}}
 }
 tone(note,when,duration){return playMelodyTone(this.context,this.melodyBus,this.voices,note,when,duration,this.instrument);}
 async play({melody,accompaniment,tempoMap,totalBeats,sourceBuffer=null,offset=0,downbeatTime=offset,mode='notes',instrument='warm',harmonyInstrument='piano',bassInstrument='piano',melodyGain=.35,harmonyGain=1,startBeat=0,loopStartBeat=Math.max(0,startBeat),pickupBeats=0,repeatPickup=true,loop=false,countIn=false,metronome=false,meter={numerator:4,denominator:4},onTick=()=>{},onStop=()=>{}}){
  validatePickup(pickupBeats,meter);
  if(!Number.isFinite(downbeatTime)||startBeat< -pickupBeats-1e-7||loopStartBeat<0)throw Error('Invalid downbeat or pickup start.');
  this.stop();const generation=this.generation;await this.unlock();if(generation!==this.generation)return false;
  this.timing=cycleTiming({startBeat,loopStartBeat,totalBeats,tempoMap});
  this.cycleSeconds=this.timing.cycleSeconds;
  this.instrument=instrument;this.setMix(melodyGain,harmonyGain);this.onStop=onStop;this.origin=this.context.currentTime+.06;this.loop=loop;this.stopCycle=loop?Infinity:1;
  const pulse=meter.denominator===8?1.5:1,barBeats=meter.numerator*4/meter.denominator,beatSeconds=60/tempoAt(startBeat,tempoMap);
  const click=(when,strong)=>{const o=this.context.createOscillator(),g=this.context.createGain();o.frequency.value=strong?1200:850;g.gain.setValueAtTime(.12,when);g.gain.exponentialRampToValueAtTime(.001,when+.045);o.connect(g).connect(this.context.destination);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start(when);o.stop(when+.05);return o;};
  if(countIn){for(let beat=0;beat<barBeats;beat+=pulse)click(this.origin+beat*beatSeconds,beat===0);this.origin+=barBeats*beatSeconds;}
  const repeat=repeatPickup&&pickupBeats>0&&loopStartBeat===0;
  const all=[...(mode==='notes'?melody.map(n=>({...n,melody:true})):[]),...accompaniment.map(n=>({...n,melody:false}))];
  const tail=mode==='notes'&&repeat?pickupTail(melody,totalBeats,pickupBeats).map(n=>({...n,melody:true})):[];
  const eventSlice=from=>[...all,...tail].flatMap(n=>{
   const start=Math.max(n.start,from),end=Math.min(n.end,totalBeats);
   return end>start?[{...n,seconds:beatToSeconds(start,tempoMap),endSeconds:beatToSeconds(end,tempoMap),releaseSeconds:n.gateEnd===undefined?undefined:Math.max(0,beatToSeconds(end,tempoMap)-beatToSeconds(Math.max(start,Math.min(n.gateEnd,end)),tempoMap))}]:[];
  });
  const firstEvents=eventSlice(startBeat),loopEvents=eventSlice(loopStartBeat);
  this.scheduled=new Map();const audioCycles=this.audioCycles=new Map();this.playing=true;
  let sourceGain=1;if(sourceBuffer){const data=sourceBuffer.getChannelData(0);let sum=0,count=0;for(let i=0;i<data.length;i+=32){sum+=data[i]*data[i];count++;}sourceGain=Math.min(1,.055/Math.max(.001,Math.sqrt(sum/Math.max(1,count))));}
  const bufferSlice=(key,cycle,when,bufferOffset,duration,pickup=false)=>{
   if(audioCycles.has(key)||when>this.context.currentTime+.16)return;
   const now=this.context.currentTime,silence=Math.max(0,-bufferOffset),late=Math.max(0,now-(when+silence));
   const start=Math.max(now,when+silence),at=Math.max(0,bufferOffset)+late,length=Math.min(duration-silence-late,sourceBuffer.duration-at);
   audioCycles.set(key,when+duration);
   if(length<=.001)return;
   const s=this.context.createBufferSource(),g=this.context.createGain();s.buffer=sourceBuffer;g.gain.value=sourceGain;s.connect(g).connect(this.melodyBus);s.startTime=start;s.cycle=cycle;s.pickup=pickup;this.sources.add(s);
   s.start(start,at,length);s.onended=()=>{this.sources.delete(s);s.disconnect();g.disconnect();};
  };
  const pump=()=>{
   if(!this.playing)return;const now=this.context.currentTime,elapsed=Math.max(0,now-this.origin),cycle=this.timing.index(elapsed);
   if(cycle>=this.stopCycle){this.stop();return;}
   const last=Math.min(this.stopCycle-1,this.loop?this.timing.index(Math.max(0,now+.16-this.origin)):cycle);
   for(const[key,event]of this.scheduled)if(event.end<now)this.scheduled.delete(key);
   for(const[key,end]of audioCycles)if(end<now)audioCycles.delete(key);
   for(let c=cycle;c<=last;c++){
    const origin=this.origin+this.timing.origin(c),from=c===0?startBeat:loopStartBeat,fromSeconds=c===0?this.timing.start:this.timing.loopStart;
    if(metronome)for(let beat=Math.ceil(from/pulse)*pulse;beat<totalBeats;beat+=pulse){
     const when=origin+(beatToSeconds(beat,tempoMap)-fromSeconds),key='click:'+c+':'+beat;
     if(when>=now&&when<now+.16&&!this.scheduled.has(key))this.scheduled.set(key,{cycle:c,when,end:when+.05,voice:click(when,Math.abs(beat%barBeats)<1e-7)});
    }
    if(mode==='original'&&sourceBuffer){
     bufferSlice('main:'+c,c,origin,downbeatTime+fromSeconds,this.timing.end-fromSeconds);
     if(repeat&&this.loop){const duration=-beatToSeconds(-pickupBeats,tempoMap);bufferSlice('pickup:'+c,c,origin+this.timing.end-fromSeconds-duration,downbeatTime-duration,duration,true);}
    }
    const events=c===0?firstEvents:loopEvents;
    for(let i=0;i<events.length;i++){
     const n=events[i];if(n.pickupRepeat&&!this.loop)continue;
     const key=c+':'+i,attack=origin+(n.seconds-fromSeconds),when=Math.max(now,attack),end=origin+(n.endSeconds-fromSeconds);
     if(end<=now||attack>now+.16||this.scheduled.has(key)||end-when<.002)continue;
     const preset=n.role==='bass'?bassInstrument:harmonyInstrument;
     const voice=n.melody?this.tone(n,when,end-when):preset!=='piano'?playMelodyTone(this.context,this.piano.master,this.voices,n,when,end-when,preset):this.piano.note(n.pitch,when,end-when,n.velocity,{strict:true,alignAttack:true,...(n.releaseSeconds===undefined?{}:{release:n.releaseSeconds})});
     this.scheduled.set(key,{voice,when,end,cycle:c,pickup:!!n.pickupRepeat});
    }
   }
   const sourceSeconds=(cycle===0?this.timing.start:this.timing.loopStart)+elapsed-this.timing.origin(cycle);
   const counting=countIn&&now<this.origin;
   onTick(counting?startBeat-(this.origin-now)/beatSeconds:secondsToBeat(sourceSeconds,tempoMap),{countIn:counting,countInBeats:Math.max(0,(this.origin-now)/beatSeconds),cycle});
  };
  this.pump=pump;this.timer=setInterval(pump,25);pump();return true;
 }
 stop(){this.generation++;clearInterval(this.timer);this.timer=null;for(const s of [...this.voices,...this.sources])try{s.stop();}catch{}this.voices.clear();this.sources.clear();this.piano?.stop();const was=this.playing;this.playing=false;if(was)this.onStop?.();}
}
