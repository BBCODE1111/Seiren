import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as music from '../../music.js';
import {MUSIC_CORE_VERSION} from '../../music-core.js';
import {compatibilityCorpus} from '../music-core/compatibility-corpus.mjs';

test('Seiren ships the pinned shared module without needing a sibling checkout',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../music-core/manifest.json',import.meta.url)));
  const core=readFileSync(new URL('../../music-core.js',import.meta.url));
  assert.equal(MUSIC_CORE_VERSION,manifest.version);
  assert.equal(createHash('sha256').update(core).digest('hex'),manifest.sha256);
});
test('Seiren retains its pre-extraction theory and basic generation outputs',()=>{
  const expected=JSON.parse(readFileSync(new URL('../music-core/seiren-before.json',import.meta.url)));
  const actual=compatibilityCorpus(music);
  for(const group of Object.keys(expected))assert.deepEqual(actual[group],expected[group],group);
});
