# Khimaira / Seiren 共用樂理維護

共用核心版本：1.0.0。此次只搬移基礎樂理，保留兩個產品原本的音樂輸出與相容差異。

## 單一來源與發布

唯一編輯來源是 `Khimaira/packages/music-core/core.js`。目前兩個網站仍為獨立儲存庫，因此來源暫放在 Khimaira 的獨立 package 目錄；這不代表 Seiren 使用 Khimaira 的生成策略，也沒有合併產品或儲存庫。

`Khimaira/dist/music-core.js` 與 `Seiren/music-core.js` 是自動同步的相同發布副本。不要直接編輯它們、建立跨網站 import、使用指向另一個 checkout 的 symlink，或以人工複製取代同步檢查。兩個網站各自攜帶核心，可獨立部署；原本的 `music.js` 路徑及公開 API 保持不變。

從 Khimaira 根目錄執行：

```sh
node scripts/sync-music-core.mjs --seiren ../Seiren
node scripts/sync-music-core.mjs --check --seiren ../Seiren
node --test tests/*.test.js
```

從 Seiren 根目錄執行：

```sh
node --test tests/seiren-harness/*.test.mjs
```

僅有 Khimaira checkout 時，省略 `--seiren` 可同步／檢查本產品；只有 Seiren checkout 時，既有版本仍可執行，checksum 測試可檢查發布副本是否被手動修改。要升級兩個產品，需取得 canonical source 與兩個 checkout，完成跨產品檢查。將新版核心、adapter、manifest 與測試資料一起納入各自的版本提交。

核心有實質修改時提高 `MUSIC_CORE_VERSION`，並同步更新兩個 adapter 的 `music-core.js?v=...` import。網站發布時依各產品現有流程更新入口快取版本。此次未發布線上網站。

## 收到一項新需求時，先判斷責任

| 需求 | 修改位置 | 驗證 |
| --- | --- | --- |
| 和弦解析、音程、組成音、音名拼字 | 共用核心；確認適用的相容設定 | 兩邊測試、同步檢查、既有輸出差異 |
| 和弦進行、替代、終止式、風格改寫 | Khimaira 的 `style-engine.js`、`harmony-actions.js` 等 | Khimaira 回歸；確認沒有改到共用規則 |
| 依旋律配和弦、避讓、樂句、弱起 | Seiren 的 `harmony.js`、`melody-arranger.js`、`fusion.js` 等 | Seiren 回歸、音域／衝突／鎖定／匯出 |
| TEXTURE 新織體／加花的純節奏與候選音規則 | `packages/piano-motion/motion.js`；產品各自接入旋律保護 | 同步檢查、兩邊音樂／MIDI 測試、外掛逐音比對 |
| 舊演奏音型、吉他按法、聲部配置、MIDI | 各產品；不要因名稱相同直接覆蓋 | 受影響產品的音符、時間與 MIDI 測試 |
| 畫面、音訊辨識、播放器、專案儲存 | 各自產品 | 該產品操作及相容性測試 |

向使用者說明此需求影響共用核心、Khimaira、Seiren 哪些部分，然後在授權範圍內實作。無須為正常實作選擇重複要求確認。需要共用的新功能可逐步抽出，但不要擴大一個小需求去重寫兩套生成器。

2026-10-27 追加：同步命令同時管理 `piano-motion` 1.0.0 與其 manifest。它是獨立的純演奏模組，沒有改變 music-core 1.0.0 或上述樂理相容契約。來源／反例與產品差異記錄在 `docs/course-study-20261027.md`；新增共用音型先檢查此文件，保留舊 Piano／POP 音型及各產品 Generate 策略。

## 必須保留的相容差異

`createTheory('khimaira-v1')` 與 `createTheory('seiren-v1')` 是明確的既有行為契約，沒有預設設定；拼錯設定名稱會報錯。

- Khimaira 的 `parse` 保留雙升／雙降音、擴充別名與 `bassName`；Seiren 保留原支援範圍及物件形狀。此次沒有自動替 Seiren 開啟全部新別名。
- Khimaira 依三度音程判斷 `minor`；Seiren 保留原先依和弦種類名稱判斷。因此 `Bdim` 的 `minor` 在兩邊不同，不可為了共用而直接統一。
- Khimaira 的 `spellChord` 保留作者輸入的功能拼字，例如 `D7/F#`；Seiren 的同名函式依傳入調性重拼，例如 E 小調下 `Gbsus2/Db → F#sus2/C#`。
- `spellPitch(pitch, keyNumber, mode)` 與 `pitchName(pitch, keyObject, octave)` 的參數與拼字規則不同，不可交換使用。
- 減七和弦的七音拼字、升記號調的 E#、轉調斜線低音、和弦別名及 AM／Am 區別均有回歸案例。
- `generate`、`approach`、`pianoVoicing`、`guitarShapes`、`midiBytes`、`events`、`scales` 仍由各自的 `music.js` 或原有模組負責。MIDI 力度／分軌、音域、拍號、弱起及旋律保護沒有在此次統一。

這些差異不代表每個行為都永遠不能改。若需求確實要改，應提出具體輸入／輸出範例、檢查呼叫端與生成後果，再更新相應設定與測試；不要把行為改變藏在重構內。

## 保護已修正問題

`compatibility-corpus.mjs` 固定測試輸入，`fixtures/*-before.json` 保存搬移前輸出的 SHA-256。每個產品包含 4,568 組解析／組成音案例、4,568 組 approach，以及拼字／移調和 528 組基本生成案例。fixture 是輸出契約，不可因測試失敗直接重新生成。演奏、MIDI、旋律策略與按法由原有產品測試覆蓋；一次性的整合輸出比對另存於驗證紀錄。

刻意改變樂理規則時，先記錄哪些案例應改變及原因；以修正前後的可檢查結果確認後，僅更新相應群組。其他群組必須保持通過。只做重構時，所有群組都應逐位元一致。樂風清單及伴奏音型可以獨立擴充，因此共用核心的永久 golden 測試不鎖死這些產品清單。

Seiren 額外的 `Seiren-QA/tests` 是舊版測試集；改動前就有兩項與現行策略不一致，詳見本次驗證紀錄。不要為了讓舊預期通過，撤銷已修正的旋律避讓或新流行和聲策略。

若同一工作區還有其他開發在修改檔案，保留其變更，使用凍結副本比對同一組程式碼搭配舊／新 `music.js`。不要把另一項工作的變更歸入本次重構，或直接重設整個儲存庫。

## 瀏覽器與外掛

安裝 Playwright 並有 Chrome 時，從 Khimaira 執行：

```sh
node scripts/verify-shared-music-browser.cjs ../Seiren /tmp/chord-core-browser
```

腳本在隨機本機連接埠獨立提供兩個網站，檢查共用模組載入、編輯、移調復原、生成、真實 Web Audio 輸出、MIDI 下載及桌面／手機尺寸，並在輸出目錄保存報告與截圖。`NODE_PATH` 可指向已安裝的 Playwright。

核心發布檔保留在網站根層，符合 Khimaira 現有外掛打包器的依賴追蹤方式。原有 `plugin-1.2.test.js` 會檢查打包後引擎與網站的檔案及生成／演奏一致性；這不等同於完成所有 DAW 原生測試。
