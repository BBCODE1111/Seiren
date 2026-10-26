// Original additive presets; no additional samples or external soundfont licenses.
export const gmPrograms={piano:0,warm:80,keys:4,sine:80,flute:73,pluck:24,electric:4,organ:16,pad:89,bass:33};
export const synthPresets={
 flute:{label:'Air flute',partials:[0,1,.12,.035,.012],attack:.035,decay:.09,sustain:.82,release:.06,cutoff:2300,level:.13},
 pluck:{label:'Nylon pluck',partials:[0,1,.48,.25,.15,.08,.04,.02],attack:.004,decay:.35,sustain:.12,release:.04,cutoff:3800,level:.21},
 electric:{label:'Electric piano',partials:[0,1,.08,.42,.03,.13,.01,.04],attack:.005,decay:.45,sustain:.2,release:.08,cutoff:4200,level:.19},
 organ:{label:'Drawbar organ',partials:[0,1,.7,.45,.3,.18,.09,.05,.03],attack:.008,decay:.03,sustain:.9,release:.035,cutoff:3500,level:.075},
 pad:{label:'Silk strings',partials:[0,1,.4,.25,.17,.1,.07,.05],attack:.16,decay:.2,sustain:.85,release:.18,cutoff:1800,level:.105},
 bass:{label:'Round bass',partials:[0,1,.45,.18,.06,.02],attack:.008,decay:.16,sustain:.5,release:.045,cutoff:1200,level:.18},
 warm:{label:'Warm lead',partials:[0,1,.3,.12,.06,.025],attack:.018,decay:.11,sustain:.76,release:.065,cutoff:2600,level:.14},
 keys:{label:'Soft keys',partials:[0,1,.26,.3,.08,.08,.03],attack:.006,decay:.22,sustain:.36,release:.075,cutoff:3400,level:.16},
 sine:{label:'Pure sine',partials:[0,1],attack:.008,decay:.04,sustain:.72,release:.045,cutoff:6000,level:.10}
};
// Harmonic, band-limited oscillator with a shaped filter/envelope; no detuned voices obscure pitch.
export function synthEnvelope(duration,preset='warm'){
 const p=synthPresets[preset]||synthPresets.warm,attack=Math.min(p.attack,duration*.15),release=Math.min(p.release,duration*.25),decay=Math.min(p.decay,Math.max(0,duration-attack-release));
 return {...p,attack,decay,release};
}
export function playMelodyTone(context,bus,voices,note,when,duration,preset='warm'){
 const p=synthEnvelope(duration,preset),osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
 const real=new Float32Array(p.partials.length),imag=new Float32Array(p.partials);
 osc.setPeriodicWave(context.createPeriodicWave(real,imag));osc.frequency.value=440*2**((note.pitch-69)/12);
 filter.type='lowpass';filter.Q.value=.5;filter.frequency.setValueAtTime(p.cutoff*1.4,when);filter.frequency.exponentialRampToValueAtTime(p.cutoff,when+Math.min(.15,duration));
 const level=p.level*(note.velocity??.7)**1.15,end=when+duration;
 gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+p.attack);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level*p.sustain),when+p.attack+p.decay);gain.gain.setValueAtTime(level*p.sustain,end-p.release);gain.gain.linearRampToValueAtTime(0,end);
 osc.connect(filter).connect(gain).connect(bus);osc.start(when);osc.stop(end+.003);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();filter.disconnect();gain.disconnect();};
 return osc;
}
