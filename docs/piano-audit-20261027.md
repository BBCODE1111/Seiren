# 18 款鋼琴伴奏審查修正 — 2026-10-27

本次依使用者提供的 Alec 審查逐項重現與修正。既有的音符安全、工程回歸及播放成功不能代表音型辨識度；本文件補上這一層驗收，並取代 `piano-phrases-20261027.md` 中 1.1.0 的現行行為說明。教材來源仍見 `course-study-20261027.md`，沒有新增教材聽寫或宣稱人工聽感評分。

## 重現與驗收

| 檢查 | 修改前 | 修正後 |
| --- | --- | --- |
| Seiren 4/4 第一小節節奏指紋，18 款、FILLS off | 18 | 18 |
| Seiren 3/4／6/8 同條件 | 各 7 | 各 18 |
| Demo 的 AUTO 與 SPACE 完全相同 | 18 款 | 0 款 |
| 三句原創人聲式長音／換氣旋律的 two／four 右手音數 | 未驗收 | 每句 × 每款均至少相差 15%；本次最小 15.094% |
| E3–D4 音域旋律下，E3 以下小於五度的右手重疊音程 | 舊保護會下壓上聲部 | 18 款 × 5 種 PHRASE 均為 0 |

節奏指紋是拍點、角色、音長及同時發聲數，並非人耳辨識度的完整代理。two／four 差異以 two 的上聲部音數為基準計算絕對比例，不把速度或音量差當成新節奏。三句 fixture 是原創的可重現人聲式音符，不是審查者未提供的原始人聲錄音；不宣稱重現其 102/150 等逐項數字。`scripts/measure-piano-audit.mjs ../Seiren OUTPUT.json` 可重跑數據。

## P0：拍號、旋律活動與音域

- Seiren 12 POP 各有獨立 `three`／`compound` hits 與 bass。3/4 的小節骨架只在第 1 拍放低音；和弦切點仍有必要的和聲到達。6/8 主拍為四分拍座標 0、1.5，各款仍有各自細分。
- TEXTURE Broken／Triplet／Pentatonic 在 3/4、6/8 有獨立骨架，不使用同一 fallback。
- 移除「整小節旋律占用 >65% 即 space」。`melodyBusyAt` 只將同一四分拍內至少兩個新起音視為密集，減薄該拍，四個四分音符不算忙碌。
- 短回應可放在至少 0.75 拍的換氣空隙，或已唱至少 0.75 拍、總長至少 1.5 拍的穩定長音之下；回應期間不容納新字進入，並經產品實際音高保護。
- Seiren 上聲部若需降到 MIDI 52 以下，先取三音與七音（無七音則根音；無三音時退到既有和弦音），嘗試清楚的下方音域，再嘗試高於當時旋律最高音一個八度的位置；無相容候選時省去該上聲部，保留可用低音。實際音程稽核不撤銷。

## P1：音型身分與樂句

- 每個 `phraseProfiles` 明列三種拍號的 anchors。SPACE 可減少裝飾拍，但保留定義拍、和聲到達與延留；聲部選擇是三音＋最高音，沒有三音時最低＋最高。
- TWO 第一小節保留完整本體，第二小節以單聲部與定義拍做較輕的回答。FOUR／AUTO 為 normal → space → lift → fuller answer，最後回答保留完整和聲。三連音的 lift 使用三等分回應。這些是可聽見節奏／聲部變化的編排選擇，不是依測試音數隨機加音。
- 不同音高的回應可疊在 held／tied 和弦上，不截斷長音；同音先尋找不占用的和弦音／八度，最終保護重新配音後也避免切斷原有 held 鍵。真正和弦切換、休止與旋律不相容仍是終止邊界。
- 回應力度包含同一四小節力度弧線及可重現 humanize；seed 相同結果相同。
- Triplet 本體在 4/4 第 4 拍使用和弦分解三連音。Pentatonic 在四分拍座標 2.5、3 加入相鄰五聲音對答（其他拍號另有位置）。不依賴 FILLS 開關；已知調性、目前和弦順階才用非和弦五聲音，否則退回和弦音。額外五聲填句使用落點附近連續五聲音，已驗證相鄰跳躍不超過 4 半音。
- Khimaira Ballad 右手從拍點起，以每聲部 20ms 的 roll 展開；換 BPM 後仍為同一毫秒差。Seiren Light eighths 正拍 2–3 音、反拍單音，不再每個八分連敲整組和弦。

### MIDI 延音踏板

兩站新增預設 OFF 的「MIDI 延音踏板 CC64」。開啟時在和聲區段開始後 10 tick 踩下，結束前 10 tick 放開，曲尾再送 OFF；不足 20 tick 的區段不踩踏板。休止區段不延續舊和聲。Seiren 與有旋律參考的 Khimaira 還會在旋律起訖邊界換踏板，避免已通過音符保護的短音被踏板延長到相衝突的新音。

分軌時 CC64 只放在和弦聲道；Seiren 的旋律與獨立低音不受它控制。合併伴奏時共用和聲聲道，踏板會同時影響該軌的鋼琴低音。這是 MIDI 匯出選項，不宣稱修改網站音源的踏板建模。Seiren 使用會解析 CC64 的 MIDI 讀取器重新稽核實際延音，包含拍號、弱起與換氣。OFF 保留原來的 MIDI 行為。

## P2：介面與預設

- K-POP 01–12、S-POP 01–12，英文主標／中文副標；TEXTURE 同樣雙語。舊 pattern ID 不改，保持各產品自己的彈法與 Generate。
- Khimaira 新工作階段預設 ORIGINAL，只有一個網站音型選單，PHRASE 移到演奏方式旁；旋律參考與 FILLS 留在進階面板，草稿不被切換設定清除。
- Seiren ORIGINAL 顯示 Pattern as written；移除 CSS 中 Google Fonts 外連，使用本地 Cinzel／DM Sans。新專案旋律 80%、和聲 70%，既有專案保留已存混音。
- 手機小節 cue 至少 44×44px；勾選框的可點擊 label 至少 44px 高／寬。首屏直接顯示 Import melody／Try demo，提示文字有面板底色，Load／Save project 的排列與文案一致。

## 相容性決策與維護

使用者將「4/4 original 不變」與本體修正的衝突交由我們判斷：新工作階段／新專案使用 `pianoRevision:2`，ORIGINAL 代表修正後本體；缺少此欄位的舊儲存／專案載入 revision 1，保留原有節奏、樂句、填句。明確重新選取音型、PHRASE 或樂風會使用新版；畫面不增加版本選項。Seiren 的音域與實際衝突保護修正始終適用。

`piano-motion` 升至 2.0.0；`music-core` 仍為 1.0.0。`packages/piano-motion/piano-motion-v1.js` 為凍結的舊共用演奏，checksum 納入 manifest。產品 adapter 在 revision 1 保留舊的 Ballad、Light eighths 與拍號選擇；舊 10,368 組指紋未重製，改為明確驗證 revision 1。新拍號修正另用音樂不變條件驗證，不用更新舊 fixture 來掩蓋變更。

共用 canonical：`motion.js`、`piano-motion-v1.js`、`piano-pedal.js`；由 `scripts/sync-music-core.mjs --seiren ../Seiren` 同步發布副本。Seiren 的音域保護、旋律規劃、混音與 UI 仍為本產品責任。Khimaira 的和弦生成、四拍聲部計劃與原生外掛責任不變。

驗證命令：兩站原有完整測試、`piano-audit.test.js`／`piano-audit.test.mjs`、`scripts/verify-phrase-browser.cjs`。後者包含實際音訊、108 組樂句匯出、踏板匯出、舊專案、手機首屏／觸控與網路錯誤，`VERIFY_LIVE=1` 直接檢查公開網站。原生 DAW 安裝包未重建；缺少的 13 段 Splice corpus 未測。發布提交、檔案雜湊與線上結果另記於工作區 deployment-reports。
