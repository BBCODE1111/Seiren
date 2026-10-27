import test from 'node:test';
import assert from 'node:assert/strict';
import {compatible, demoMelody} from '../../harmony.js';
import {performance} from '../../performance.js';
import {arrangeMelody} from '../../melody-arranger.js';
import {styles} from '../../style-engine.js';
import {chartFromSegments, renderProtected} from '../../fusion.js';
import {parse} from '../../music.js';
import {sourceHints, loopTempos, chooseTempo, chooseDownbeat, transcriptionResult} from '../../transcription.js';

test('musical harmony rejects lower semitones and minor ninths in every register', () => {
  for (let melody = 48; melody <= 84; melody++) {
    for (const distance of [1, 13, 25, 37]) assert.equal(compatible(melody - distance, melody, 'musical'), false);
    for (const distance of [11, 23, 35]) assert.equal(compatible(melody - distance, melody, 'musical'), true);
    assert.equal(compatible(melody + 1, melody, 'musical'), false);
  }
  assert.equal(compatible(53, 71, 'musical', 'G7'), true);
  assert.equal(compatible(53, 71, 'musical', 'F'), false);
  assert.equal(compatible(60, 71, 'strict'), false);
});

test('colour chords avoid the semitone below a sustained tonic', () => {
  for (const pitch of [60, 67, 72]) for (const style of ['Jazz', 'Gospel', 'Neo-soul', 'Soul']) for (let seed = 0; seed < 3; seed++) {
    const result = arrangeMelody([{pitch, start:0, end:4}], {key:{root:pitch % 12, mode:'major'}, style, seed});
    for (const segment of result.segments) assert.ok(!parse(segment.symbol).pcs.includes((pitch + 11) % 12), `${style}: ${segment.symbol}`);
  }
});

test('all styles and three variations preserve melody without audible semitone clashes', () => {
  const melody = demoMelody(), original = structuredClone(melody);
  for (const [style, cfg] of Object.entries(styles)) for (let seed = 0; seed < 3; seed++) {
    const result = arrangeMelody(melody, {style, seed});
    const chart = chartFromSegments(result.segments, 4, result.totalBeats);
    const {accompaniment} = renderProtected(chart, cfg.pattern, {policy:'musical', followMelody:true, voicing:cfg.voicing, human:0, swing:0}, melody);
    assert.ok(accompaniment.length, style);
    for (const a of accompaniment) for (const m of melody) {
      if (Math.min(a.end, m.end) - Math.max(a.start, m.start) <= .1) continue;
      const distance = a.pitch - m.pitch;
      assert.ok(((distance % 12) + 12) % 12 !== 11 && Math.abs(distance) !== 1, `${style}: ${a.pitch} against ${m.pitch}`);
    }
  }
  assert.deepEqual(melody, original);
});

test('blues offbeats follow the requested straight or swung feel', () => {
  const chart = [{chords:[{symbol:'C', beats:4}]}];
  for (const swing of [0, .16]) {
    const notes = performance(chart, 'blues', {swing, human:0});
    const offbeats = notes.filter(n => n.beat % 1 > .1);
    assert.ok(offbeats.length);
    for (const note of offbeats) assert.ok(Math.abs(note.beat % 1 - (.5 + swing)) < 1e-9);
  }
});

test('explicit BPM labels take precedence over numbered sample fields', () => {
  assert.deepEqual(sourceHints('vocal_29_128_Bpm_Key_G#.wav'), {bpm:128, key:{root:8, mode:null}});
  assert.equal(sourceHints('vocal_80_take_BPM_128_Cmaj.wav').bpm, 128);
  assert.deepEqual(sourceHints('vocal_108BPM_Cmaj.wav'), {bpm:108, key:{root:0, mode:'major'}});
  assert.deepEqual(sourceHints('untagged.wav'), {bpm:null, key:null});
});

test('exact loop lengths select a plausible tempo and retain leading rests', () => {
  const duration = 16 * 60 / 120;
  assert.ok(loopTempos(duration).some(c => c.bpm === 120 && c.bars === 4));
  assert.deepEqual(loopTempos(duration + .013), []);
  const chosen = chooseTempo([{bpm:240, score:.9}], duration);
  assert.equal(chosen.bpm, 120);
  assert.deepEqual(chooseDownbeat([{start:.5, end:1, pitch:60}], 120, chosen), {downbeatTime:0, pickupBeats:0, reason:'loop'});
  assert.equal(chooseTempo([{bpm:240, score:.9}], duration + .013).bpm, 120);
});

test('non-loop downbeat phase preserves the preceding pickup', () => {
  const notes = [{start:0, end:.1, pitch:67}, {start:.5, end:1.5, pitch:60}, {start:1.5, end:2.5, pitch:64}, {start:2.5, end:3.5, pitch:60}];
  const db = chooseDownbeat(notes, 120);
  assert.equal(db.downbeatTime, .5);
  assert.equal(db.pickupBeats, 1);
  const result = transcriptionResult(notes, 4.013, 'untagged.wav', {bpm:120, candidates:[{bpm:120, score:1}], confidence:1, beats:[0,.5,1,1.5,2,2.5,3]});
  assert.equal(result.downbeatTime, .5);
  assert.equal(result.pickupBeats, 1);
});
