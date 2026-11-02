# Seiren 網頁版：旋律流程與原音變速

日期：2026-11-03。使用者要求融合近期 Khimaira 優化，優先穩定「旋律產生和弦」與網頁操作；追加要求改 BPM 後仍能聽原音，盡量保留音高與聲音特質。

## 沿用的經驗與維護邊界

參考工作區 `Khimaira-mobile-follow/docs/reviews/ROUND2-IMPLEMENTATION.md`、`reviews/mobile-follow-20261031/DISCUSSION-AND-HANDOFF.md`，以及 Seiren 的 `AGENTS.md`、`seirenmelody.md`、`docs/SHARED-MUSIC-CORE.md`。

- 沿用最近結果比較、來源／結果可見、完整還原、手機橫向置頂譜與手動暫停跟隨。
- 保留 Seiren 以旋律為主的生成器、最終旋律保護、和弦鎖定、既有 POP／TEXTURE 及播放／MIDI 共用事件；沒有把 Khimaira MORPH 覆蓋到 Seiren。
- 本次未修改共用核心、另一個產品或外掛。開始時工作目錄已有 `music-core.js`、`music.js`、核心 manifest／文件與外掛等未提交變更，原樣保留；本次測試是在這個既有工作目錄上執行。

## 實作

`melody-workflow-ui.js`、`melody-workflow.css`：旋律狀態與四步提示、單獨試聽旋律、直接可見的原音／MIDI 選擇、和弦譜置頂與跟隨。滑動譜面或鋼琴捲軸後暫停跟隨，按「回到播放」恢復。和弦靈感移至下方，保留所有原控制項。

`app.js`：最近六個和弦版本，顯示小節前後差異；切換保留旋律、調性、速度與拍點。UNDO 包含 source、seed、生成手法與伴奏設定，避免只還原表面和弦。換旋律、改音符／拍號／對齊／調性會清除不適用歷史。版本比較只在本次工作階段，專案保存目前結果。

`melody-workspace.js`、`project.js`：保存未確認的辨識狀態，重新開啟仍需確認。分析時停用相關編輯與生成，取消後忽略舊進度；匯入驗證使用實際弱起界線、排除空音軌，拒絕超出支援的初始 MIDI 速度與過長拍號。切換旋律保護策略不再重新產生整份譜而丟失鎖定。相同 BPM 的重複 MIDI 標記不再被當成多段變速而鎖住速度；旋律專案可正確恢復 261–300 BPM。專案設定先驗證再套用；無法讀取的瀏覽器專案嘗試備份至 `seiren-project-recovery`。

## 原音保留音高變速

使用 SoundTouchJS core 2.1.1 的 WSOLA `Stretch`，本機提供、MPL-2.0，保留未修改原始發布碼與聲明。來源與版本見 `vendor/soundtouch/NOTICE.md`。

- `audio-stretch.js`：固定 BPM 的比例為目標 BPM／來源 BPM；支援 0.5–2 倍。兩聲道共用時間伸縮路徑，維持立體聲相位關係。前後反射上下文避免短錄音的起音、尾音被分析窗口吃掉；完成後按目標長度裁切。
- `audio-stretch-worker.js`／`audio-stretch-client.js`：背景計算、進度、取消、只快取最近一次結果。原始 AudioBuffer 不會被修改或轉移；比率 1 直接使用原始錄音。過期的處理結果不能開始播放。
- `player.js`：處理完成後才啟動旋律／和弦的同一時鐘；原音 downbeatTime 除以同一比例，首圈弱起、重複弱起與後續 LOOP 都使用變速後時間。音源 playbackRate 維持 1，不以改採樣播放率冒充保留音高。FOLLOW RECORDING 沿用錄音速度圖與原始音訊。
- 確認前 BPM 用於校正辨識拍格；確認後 BPM 才改音樂播放速度。設定面板「原音／TAP」仍播放未變速原音供校正。
- 原音與處理結果不上傳；專案／MIDI 仍不含錄音，沒有增加音訊檔匯出。

建議先在 80%–125% 比率內使用；這是產品建議，不是經真人聽評證明的保真界線。較大幅度、短促子音、鼓點或複雜混音可能出現顫動、瞬態／音色改變；不宣稱無損或完全保留共振峰。

## 驗證

- 修改前：32／32 原有單元測試通過。
- 修改後：37／37 單元測試通過，含既有 12 調、大小調、拍號、鎖定、旋律保護與 MIDI 矩陣，未重製 golden。
- 新的變速回歸：22.05／44.1／48 kHz × 0.5／0.8／1.25／2；時長、220 Hz 基音（誤差小於 1.5 Hz）、立體聲相位、原速逐樣本一致、靜音、0.15 秒片段與尾音。0.8／1.25 比率下合成音節起音與理想時鐘誤差小於 35 ms。這些為客觀合成訊號測試，不是人聲聽感評分。
- 原有 `pop-browser.cjs`：12 種 POP 真實 Web Audio 輸出、12 個 MIDI 下載、至少三個不同生成結果、專案往返、手機溢出與頁面／網路錯誤檢查。
- 新增 `workflow-browser.cjs`：實際 MIDI 與 WAV 匯入／Basic Pitch 辨識、失敗匯入保留資料、壞專案設定拒絕、辨識草稿重開仍需確認、六個版本／UNDO、重生成保留鎖定、3/4 MIDI 弱起、原音 0.8／1.25 變速實際播放、速度變更不改音符、取消、變速後弱起及循環、375×667／390×844 手動跟隨與置頂控制列。

瀏覽器使用本機 Chromium，沒有加入產品測試 hook。證據保存於工作區 `deployment-reports/20261103-seiren-web/`。尚未進行真人錄音主觀聽評、實體 iPhone／Safari 或 DAW 人工驗收；原始 13 段 Splice 素材不在工作區，沒有重跑該舊資料集。此階段為本機網頁版，尚未發布正式站。

執行：在 Seiren 目錄以 HTTP 提供網站；`node --test tests/seiren-harness/*.test.mjs`。瀏覽器命令為 `node tests/seiren-harness/pop-browser.cjs URL` 與 `node tests/seiren-harness/workflow-browser.cjs URL`，可設定 `NODE_PATH`、`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`、`SEIREN_SCREENSHOT_DIR`。
