// Generated from Khimaira/packages/music-core/core.js; edit the canonical source and sync.
/**
 * Shared music theory 1.0.0. Canonical source; generated deployment copies are
 * checked by scripts/sync-music-core.mjs. No UI, playback or generation imports.
 * Profiles preserve the two apps' existing contracts, including known differences.
 */
export const MUSIC_CORE_VERSION = '1.0.0';
export const names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export const mod=n=>((n%12)+12)%12;
const pc=s=>mod(({C:0,D:2,E:4,F:5,G:7,A:9,B:11})[s[0]]+[...s.slice(1)].reduce((n,a)=>n+(a==='#'?1:a==='b'?-1:0),0));
const qualities={'maj7#11':[0,4,7,11,18],'maj9#11':[0,4,7,11,14,18],'6/9':[0,4,7,9,14],'69':[0,4,7,9,14],'mMaj7':[0,3,7,11],'mMaj9':[0,3,7,11,14],'7alt':[0,4,10,13,15,20],'7#11':[0,4,7,10,18],'13b9':[0,4,7,10,13,21],'7b13':[0,4,7,10,20],'':[0,4,7],m:[0,3,7],maj7:[0,4,7,11],m7:[0,3,7,10],'7':[0,4,7,10],'9':[0,4,7,10,14],maj9:[0,4,7,11,14],m9:[0,3,7,10,14],'6':[0,4,7,9],m6:[0,3,7,9],sus2:[0,2,7],sus4:[0,5,7],'7sus4':[0,5,7,10],dim:[0,3,6],dim7:[0,3,6,9],m7b5:[0,3,6,10],aug:[0,4,8],'7b5':[0,4,6,10],'7b9':[0,4,7,10,13],'7#9':[0,4,7,10,15],'13':[0,4,7,10,14,21],m11:[0,3,7,10,14,17],add9:[0,4,7,14],'5':[0,7]};
Object.assign(qualities,{'11':[0,4,7,10,14,17],maj11:[0,4,7,11,14,17],maj13:[0,4,7,11,14,21],m13:[0,3,7,10,14,17,21],madd9:[0,3,7,14],'9sus4':[0,5,7,10,14]});
function intervalsFor(q, seirenCompatibility) {
  if (seirenCompatibility && q === '7b5') return null;
  if (qualities[q]) return qualities[q];
  const match = q.match(/^([^()]+|)\(([^()]+)\)$/);
  if (!match || !qualities[match[1]] || (seirenCompatibility && match[1] === '7b5')) return null;
  let intervals = [...qualities[match[1]]];
  const alterations = {'b9':13,'9':14,'#9':15,'11':17,'#11':18,'b13':20,'13':21,'b5':6,'#5':8,'no5':-7};
  for (const token of match[2].split(',')) {
    if (!(token in alterations)) return null;
    const interval = alterations[token];
    if (['b9','9','#9'].includes(token)) intervals = intervals.filter(n => ![13,14,15].includes(n));
    if (['11','#11'].includes(token)) intervals = intervals.filter(n => ![17,18].includes(n));
    if (['b13','13'].includes(token)) intervals = intervals.filter(n => ![20,21].includes(n));
    if (['b5','#5','no5'].includes(token)) intervals = intervals.filter(n => ![6,7,8].includes(n));
    if (interval >= 0) intervals.push(interval);
  }
  return [...new Set(intervals)].sort((a,b) => a-b);
}

/** Select an explicit compatibility contract; no app receives silent behavior changes. */
export function createTheory(profile) {
 if(!['khimaira-v1','seiren-v1'].includes(profile))throw new Error('Unknown music theory profile: '+profile);
 const seirenCompatibility=profile==='seiren-v1';
 // Seiren's older accepted aliases, diminished classification and result shape
 // remain explicit contracts. Adopting Khimaira behavior is a separate change.
  function parse(symbol) {
    const pattern = seirenCompatibility
      ? /^([A-Ga-g][#b]?)([^/]*)(?:\/([A-Ga-g][#b]?))?$/
      : /^([A-Ga-g][#b]{0,2})([^/]*)(?:\/([A-Ga-g][#b]{0,2}))?$/;
    const match = String(symbol).trim().replaceAll('♭','b').replaceAll('♯','#').replace('6/9','69').match(pattern);
    if (!match) return null;
    let q = match[2].replace(/^M$/,'').replace(/^M(?=7|9)/,'maj')
      .replace(/^min/,'m').replace(/^Δ/,'maj').replace(/^ø7?$/,'m7b5').replace(/^°7$/,'dim7');
    if (!seirenCompatibility) {
      q = q.replace(/^°$/,'dim').replace(/^\+$/,'aug').replace(/^sus$/,'sus4')
        .replace(/^-/,'m').replace(/^m\(maj7\)$/,'mMaj7').replace(/^(2|add2)$/,'add9').replace(/^maj$/,'');
    }
    const intervals = intervalsFor(q, seirenCompatibility);
    if (!intervals) return null;
    const rootName = match[1][0].toUpperCase() + match[1].slice(1);
    const root = pc(rootName);
    const bassName = match[3] ? match[3][0].toUpperCase() + match[3].slice(1) : null;
    return {
      symbol, root, rootName, q, intervals,
      pcs: [...new Set(intervals.map(n => mod(root+n)))],
      bass: bassName ? pc(bassName) : root,
      ...(!seirenCompatibility ? {bassName} : {}),
      minor: seirenCompatibility ? q.startsWith('m') && !q.startsWith('maj') : intervals.includes(3) && !intervals.includes(4),
    };
  }

  function chordTones(symbol) {
    const chord = parse(symbol);
    if (!chord) return [];
    const base = letters.indexOf(chord.rootName[0]);
    const degrees = {0:0,1:1,2:1,3:2,4:2,5:3,6:4,7:4,8:4,9:5,10:6,11:6,13:1,14:1,15:1,17:3,18:3,20:5,21:5};
    return chord.intervals.map(interval => {
      let degree = degrees[interval] ?? 0;
      if (chord.q === 'dim7' && interval === 9) degree = 6;
      const letter = (base+degree)%7;
      let delta = mod(chord.root+interval)-naturals[letter];
      while (delta > 6) delta -= 12;
      while (delta < -6) delta += 12;
      return letters[letter] + (delta > 0 ? '#'.repeat(delta) : 'b'.repeat(-delta));
    });
  }

  // Diatonic letters are retained for scale tones and local ii–V targets.
  const letters=['C','D','E','F','G','A','B'],naturals=[0,2,4,5,7,9,11];
  function spellInterval(root,semitones,steps){
   const letter=(letters.indexOf(root[0])+steps+70)%7;
   let delta=mod(pc(root)+semitones-naturals[letter]);if(delta>6)delta-=12;
   return letters[letter]+(delta>0?'#'.repeat(delta):'b'.repeat(-delta));
  }
  function keyName(key,mode='major'){
   return (mode==='minor'?['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B']:['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'])[mod(key)];
  }
  function spellPitch(pitch,key=0,mode='major'){
   const tonic=keyName(key,mode),scale=mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],degree=scale.indexOf(mod(pitch-key));
   if(degree>=0)return spellInterval(tonic,scale[degree],degree);
   const sharp=(mode==='minor'?[1,4,6,8,11]:[2,4,6,7,9,11]).includes(mod(key));
   return (sharp?['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']:names)[mod(pitch)];
  }
  function spellChord(symbol,key){
   if(seirenCompatibility)return symbol.replace(/([A-G][#b]?)/g,t=>pitchName(pc(t),key));
   // Authored accidentals encode function: F# in D7/F# must not become Gb.
   const c=parse(symbol);return c?c.rootName+c.q+(c.bassName?'/'+c.bassName:''):symbol;
  }
  function transposeSymbol(symbol,semitones,key=0,mode='major'){
   const c=parse(symbol);if(!c)return symbol;
   if(mod(semitones)===0)return spellChord(symbol);
   const from=keyName(key-semitones,mode),to=keyName(key,mode);
   const steps=(letters.indexOf(to[0])-letters.indexOf(from[0])+7)%7;
   return spellInterval(c.rootName,semitones,steps)+c.q+(c.bassName?'/'+spellInterval(c.bassName,semitones,steps):'');
  }
  function romanNumeral(symbol,key=0,mode='major'){
   const c=parse(symbol);if(!c)return '';
   const d=mod(c.root-key),scale=mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
   const degree=(letters.indexOf(c.rootName[0])-letters.indexOf(keyName(key,mode)[0])+7)%7;
   let alteration=mod(d-scale[degree]);if(alteration>6)alteration-=12;
   const prefix=alteration>0?'♯'.repeat(alteration):'♭'.repeat(-alteration);
   let numeral=['I','II','III','IV','V','VI','VII'][degree];if(c.minor)numeral=numeral.toLowerCase();
   const diminished=c.intervals.includes(3)&&c.intervals.includes(6);
   const quality=diminished?(c.intervals.includes(10)?'ø':'°'):c.q==='aug'?'+':'';
   return prefix+numeral+quality;
  }
  function pitchName(pitch,key={root:0,mode:'major'},octave=false){
   const major=mod(key.root+(key.mode==='minor'?3:0));
   const sharp=[7,2,9,4,11,6].includes(major);
   return (major===6?['C','C#','D','D#','E','E#','F#','G','G#','A','A#','B']:sharp?['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']:names)[mod(pitch)]+(octave?Math.floor(pitch/12)-1:'');
  }

 return seirenCompatibility
  ? {parse,chordTones,pitchName,spellChord}
  : {parse,chordTones,spellInterval,keyName,spellPitch,spellChord,transposeSymbol,romanNumeral};
}
