import test from 'node:test';
import assert from 'node:assert/strict';
import {translate} from '../../i18n.js';
import {styles} from '../../style-engine.js';
import {patterns} from '../../performance.js';

test('localization keeps chord notation, pattern codes and whitespace intact',()=>{
 for(const language of ['zh-Hant','en']){
  assert.equal(translate('Cmaj7/G',language),'Cmaj7/G');
  assert.equal(translate('  1/8T  ',language),'  1/8T  ');
 }
 assert.equal(translate('S-POP 07 · Together / R / L / R / 齊右左右','en'),'S-POP 07 · Together / R / L / R');
 assert.equal(translate('S-POP 07 · Together / R / L / R / 齊右左右','zh-Hant'),'S-POP 07 · 齊右左右');
 assert.equal(translate('原音檔＋和聲伴奏','en'),'Original audio + accompaniment');
 assert.equal(translate('PLAY','zh-Hant'),'播放');
 for(const style of Object.values(styles))assert.doesNotMatch(translate(style.description,'en'),/[\u3400-\u9fff]/u);
 for(const pattern of Object.values(patterns))assert.doesNotMatch(translate(pattern,'en'),/[\u3400-\u9fff]/u);
});
test('dynamic tempo and accessibility copy retains its numeric values',()=>{
 const s=translate('保留音高變速：108 → 86.4 BPM · 80%。首次播放需短暫處理。','en');
 assert.equal(s,'Pitch-preserving tempo: 108 → 86.4 BPM · 80%. First playback needs a moment to prepare. ');
 assert.equal(translate('旋律音符 2 Eb4，起始 -1 拍，長度 0.75 拍','en'),'Melody note 2 Eb4, start -1 beats, duration 0.75 beats');
 assert.equal(translate('51 accompaniment notes · 6 adjusted · 13 omitted','zh-Hant'),'51 個伴奏音符 · 6 個調整 · 13 個省略');
 assert.equal(translate('Ex1 · 1645 · 清楚的告白','en'),'Ex1 · 1645 · A clear confession');
});
