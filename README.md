# Seiren · 賽壬 旋律海妖

以旋律為起點的和聲與伴奏工具。匯入錄音或 MIDI、編輯音符、比較不同樂風，再匯出 MIDI 到你的音樂工作站。

[開啟網站](https://bbcode1111.github.io/Seiren/) · [使用說明](https://bbcode1111.github.io/Seiren/guide.html) · [軟體介紹與授權](https://bbcode1111.github.io/Seiren/research.html)

## 網頁版旋律流程更新 · 2026-11-03

旋律區直接提供原音／MIDI 切換與「只聽旋律」。和弦譜置頂、左右滑動並跟隨播放；手動瀏覽後按「回到播放」恢復。產生和弦保留最近六個版本，可切換比較、查看小節改變與還原；這些比較版本只保留在本次工作階段，儲存專案會保存目前選定結果。編輯或換入旋律後清除過期比較。音訊辨識草稿重新開啟仍須確認，錯誤匯入不會覆蓋上一段旋律。

## Mandarin pop 鋼琴伴奏

Mandarin pop 現在位於樂風最前方，提供 36 組原創練習：1645、卡農下降低音、4536251 與小調。樂風下方的 HARMONY IDEAS 可直接載入或切換；GENERATE 會依旋律比較和聲句型並調整衝突。

PATTERN 的 POP 01–12 包含全小節、二分、四分柱式、左右手交替及輕切分。09–12 可在 PIANO FILLS 選 OFF、AUTO（句尾）或 LIGHT（每兩小節）；旋律繁忙時會減少裝飾。播放和 MIDI 匯出共用保護後的音符。完整規則與來源見 [seirenmelody.md](seirenmelody.md)。

## 主要功能

- 音訊辨識、MIDI 匯入、手繪旋律與鋼琴捲軸編輯。
- 音訊節拍追蹤、BPM 候選、邊聽原音邊 TAP，以及可匯出的變速圖。
- F0 原音音高曲線與偵測拍點疊圖。
- 九種旋律音色、五種和聲音色、三種低音音色，MIDI 寫入 GM 音色建議。
- 48 種樂風、和弦編輯／鎖定、伴奏節奏及分解演奏。
- **原音檔＋和聲伴奏**與 **MIDI 旋律＋和聲伴奏**兩種試聽方式。
- 旋律與和聲音量獨立調整、循環播放與小節起播點。
- BAR 0 弱起、點音符設定第 1 拍、循環回 BAR 1，以及可選的尾端弱起重播。
- 專案儲存／載入、兩種弱起 MIDI 匯出、吉他和弦及音階工具。

## 快速開始

1. 按 IMPORT 匯入乾淨的單聲部音訊或 MIDI，或從 DEMO／DRAW 開始。
2. 核對 BPM、調性、拍號；音訊辨識後按 CONFIRM MELODY。
3. 選擇樂風，按 Generate harmony，在 PATTERN 調整伴奏節奏。
4. 在旋律編輯區的「試聽來源」切換原音檔與 MIDI；調整旋律及和聲音量後播放。
5. 用 Save project 保留音符與設定，或用 Export MIDI 下載音符資料。

## 音訊拍點與曲線

匯入音訊後點 BPM 設定，試聽並比較速度候選；開啟 FOLLOW RECORDING 可沿用偵測出的每拍速度。原音 / TAP 可邊聽錄音邊敲 TAP。棕色 F0 曲線保留滑音、顫音，虛線顯示拍點，兩者可獨立關閉。專案保存曲線與速度圖，MIDI 保存速度資訊。

信心值不是正確率；稀疏節奏、混音與自由速度需手動核對。節拍追蹤不會自動決定第 1 拍。

## 弱起拍

按 DOWNBEAT 再點選第 1 小節強拍的音符，或在旋律設定輸入 PICKUP BEATS。BAR 0 使用負拍數，首次播放保留弱起；循環從 BAR 1 開始。REPEAT PICKUP AT LOOP END 預設在尾端重播弱起，可關閉。音訊的 DOWNBEAT (SEC) 允許正、負時間；尚未自動判定第 1 拍。

MIDI 可選補滿一小節休止，或以短小節拍號表示弱起。專案採 seiren-project v2，仍可讀取 khimaira-project v1。重新校正第 1 拍會重算和弦、清除音符復原紀錄，請先另存重要版本。

## 使用範圍

音訊在瀏覽器內處理，不會上傳錄音。音訊上限 40 MB、0.15–120 秒；MIDI 上限 8 MB，旋律音軌最多 2,000 音符、512 拍。模型不是聲部分離器，複雜混音可能需要手動修正。

FOLLOW RECORDING 讓伴奏依錄音的拍點變速，使用原速錄音。確認旋律後，在固定 BPM 模式可用原速 0.5–2 倍的保留音高變速，繼續試聽原音與和弦；建議先用 80%–125%，大幅變速可能產生音色變化。首次播放在背景處理，可按 STOP 取消；重播快取結果，回到原速直接使用原始錄音。音符編輯不會修改原始錄音。專案與 MIDI 不包含錄音，重新開啟後需重新匯入音訊才能原音試聽。目前不提供混音音檔匯出。

## 本機使用

本專案是靜態網站，直接以 HTTP 伺服器提供此目錄即可。例如安裝 Python 3 後在目錄執行：

```sh
python3 -m http.server 5181
```

開啟 http://localhost:5181/。請使用支援 Web Audio、ES modules 與 Popover API 的現代瀏覽器。

## 採樣與套件授權

Salamander Grand Piano V3 by Alexander Holm，CC BY 3.0；採樣由 Tone.js Audio 發布。Spotify Basic Pitch、TensorFlow.js 使用 Apache-2.0；Cinzel 與 DM Sans 使用 SIL Open Font License。完整來源、處理方式與授權連結見 [軟體介紹與授權](research.html)。

原音變速使用本站提供的 SoundTouchJS core 2.1.1（MPL-2.0）；[版本與來源](vendor/soundtouch/NOTICE.md)。檢查紀錄見 [網頁版更新](docs/web-melody-20261103.md)。
