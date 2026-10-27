// Fixed inputs for the pre-extraction behavior contract. Never regenerate the
// golden hashes merely to make a failure pass: review the musical change first.
import {createHash} from 'node:crypto';

export function compatibilityCorpus(music) {
  const results = {};
  const record = (name, values) => {
    results[name] = {cases: values.length, sha256: createHash('sha256').update(JSON.stringify(values)).digest('hex')};
  };
  const roots = ['C','C#','Db','D','Eb','E','F','F#','Gb','G','Ab','A','Bb','B','Cb','B#','E#','F##','Bbb'];
  const qualities = ['', 'm','maj7','m7','7','9','maj9','m9','6','m6','sus2','sus4','7sus4','dim','dim7','m7b5','aug','7b5','7b9','7#9','13','m11','add9','5','maj7#11','maj9#11','6/9','69','mMaj7','mMaj9','7alt','7#11','13b9','7b13','11','maj11','maj13','m13','madd9','9sus4','M','M7','min7','Δ7','ø','°7','°','+','sus','-7','m(maj7)','2','add2','maj','7(9,#11,no5)','m7(b5)','7(b9,b13)','maj7(9,#11)','m7(13)','wat'];
  const symbols = roots.flatMap(root => qualities.flatMap(q => ['', '/F#','/Bb','/C##'].map(bass => root+q+bass)));
  symbols.push(' C♯m7/G♯ ', 'cM', 'am', 'N.C.', '', 'C/H', null, 42);
  record('parse-and-tones', symbols.map(s => [s, music.parse(s), music.chordTones(s)]));
  record('approaches', symbols.map(s => [s, music.approach(s)]));
  const spelling = [];
  for (let key=0;key<12;key++) for (const mode of ['major','minor']) {
    for (let pitch=-1;pitch<=128;pitch++) {
      if (music.pitchName) spelling.push(music.pitchName(pitch,{root:key,mode},true), music.pitchName(pitch,{root:key,mode}));
      if (music.spellPitch) spelling.push(music.spellPitch(pitch,key,mode));
    }
    for (const s of ['D7/F#','Gbsus2/Db','F#maj7/C#','Bdim7','C7alt','Cbmaj9','Bbbm7','Csus','N.C.']) {
      spelling.push(music.spellChord(s,{root:key,mode}));
      if (music.transposeSymbol) for (const shift of [-12,-1,0,1,12]) spelling.push(music.transposeSymbol(s,shift,key,mode));
      if (music.romanNumeral) spelling.push(music.romanNumeral(s,key,mode));
    }
  }
  record('spelling-and-transposition', spelling);
  const generated=[];
  // Fixed recipe inputs; product style catalogs are free to evolve independently.
  for (const style of ['Jazz','Gospel','Fusion','Bossa nova','Rock','Japanese rock','House','Classical','Phrygian dominant','Dorian folk','unknown-fallback']) for (let key=0;key<12;key++) for (const mode of ['major','minor']) {
    const bars = [{symbol:'C',locked:false},{symbol:'Am',locked:false},{symbol:'Bdim',locked:true},{symbol:'G7',locked:false}];
    for (const random of [()=>.25,()=>.75]) generated.push(music.generate(bars,{style,key,mode,random}));
  }
  record('legacy-generation', generated);
  return results;
}
