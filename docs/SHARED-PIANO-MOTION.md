# Shared piano motion 1.1.0

唯一來源為 `motion.js`。使用 `../music-core/README.md` 的同步流程更新 Khimaira 與 Seiren，禁止手改網站發布副本。

`renderTexture(plan, pattern, options)` 接收既有和弦聲部計劃：`{beat, beats, notes:[bass,...upper]}`；旋律統一為 `{pitch,start,end}`，時間以四分音符拍數計。輸出 `{beat,note,duration,velocity,role,articulation,fill}`。無 DOM、網路、解析器或隱含產品狀態，不更改輸入。

選項：`barBeats`、`meter`、`key:{root,mode}`、`melody`、`gate`、`human`、`seed`、`fillMode:off|phrase|light`、`totalBeats`。產品 adapter 必須傳完整曲長，包含尾端休止；`plan` 不含休止區段。已知 major/minor 且目前和弦音均順階，才允許短鄰音／五聲裝飾；否則退回和弦音。tie 是單一延音，不受短音 gate 截斷，但會在換和弦時結束。三等分不套 Swing。

目前 Khimaira 的 adapter 使用 4/4，並轉換 melody reference、part 欄位及呼叫既有 protectMelody；Seiren 傳拍號及原始旋律，仍由 fusion 做最終保護。不要把這層當作通用和聲安全保證或旋律配和弦生成器。

證據、反例、使用方式：`docs/course-study-20261027.md`。驗證：`tests/piano-motion.test.js`、`tests/plugin-1.2.test.js`，及 Seiren 的 `tests/seiren-harness/piano-motion.test.mjs`。實質共用規則改變時提高版本與兩邊 import 版本，同步 manifest 並重跑兩邊測試。

## Phrase variation 1.1.0

`applyPianoPhrase(events, plan, pattern, options)` 在既有 renderer 後、產品最終保護前執行。`pianoPhrase` 接受 original／space／two／four／auto，缺失或無效值保持 original；不修改原始事件與和弦計劃。新樂句使用各款獨立的 `phraseProfiles` 回應拍點，保留和弦到達、低音、休止與延留，不負責生成和弦。詳細條件與產品預設見 `docs/piano-phrases-20261027.md`。

`compatibility-corpus.mjs` 與 `fixtures/*-before-phrases.json` 是改動前演奏指紋：Khimaira 2,592、Seiren 7,776。原型必須完全一致，不可為通過測試重新產生 fixture。同步命令也管理 Seiren 的 corpus 副本與維護文件。兩站新資料可啟用樂句，舊儲存／專案必須還原 original。
