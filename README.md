# Seiren · 賽壬 旋律海妖

以旋律為起點的和聲與伴奏工具。匯入錄音或 MIDI、編輯音符、比較不同樂風，再匯出 MIDI 到你的音樂工作站。

[開啟網站](https://bbcode1111.github.io/Seiren/) · [使用說明](https://bbcode1111.github.io/Seiren/guide.html) · [軟體介紹與授權](https://bbcode1111.github.io/Seiren/research.html)

## 主要功能

- 音訊辨識、MIDI 匯入、手繪旋律與鋼琴捲軸編輯。
- 48 種樂風、和弦編輯／鎖定、伴奏節奏及分解演奏。
- **原音檔＋和聲伴奏**與 **MIDI 旋律＋和聲伴奏**兩種試聽方式。
- 旋律與和聲音量獨立調整、循環播放與小節起播點。
- 專案儲存／載入、分軌 MIDI 匯出、吉他和弦及音階工具。

## 快速開始

1. 按 IMPORT 匯入乾淨的單聲部音訊或 MIDI，或從 DEMO／DRAW 開始。
2. 核對 BPM、調性、拍號；音訊辨識後按 CONFIRM MELODY。
3. 選擇樂風，按 Generate harmony，在 PATTERN 調整伴奏節奏。
4. 在 Mix & melody 的「試聽來源」切換原音檔與 MIDI；調整旋律及和聲音量後播放。
5. 用 Save project 保留音符與設定，或用 Export MIDI 下載音符資料。

## 使用範圍

音訊在瀏覽器內處理，不會上傳錄音。音訊上限 40 MB、0.15–120 秒；MIDI 上限 8 MB，旋律音軌最多 2,000 音符、512 拍。模型不是聲部分離器，複雜混音可能需要手動修正。

原音播放保留錄音，不做時間伸縮；變速後改用 MIDI，回到來源 BPM 可恢復原音試聽。音符編輯不會修改原始錄音。專案與 MIDI 不包含錄音，重新開啟後需重新匯入音訊才能原音試聽。目前不提供混音音檔匯出。

## 本機使用

本專案是靜態網站，直接以 HTTP 伺服器提供此目錄即可。例如安裝 Python 3 後在目錄執行：

```sh
python3 -m http.server 5181
```

開啟 http://localhost:5181/。請使用支援 Web Audio、ES modules 與 Popover API 的現代瀏覽器。

## 採樣與套件授權

Salamander Grand Piano V3 by Alexander Holm，CC BY 3.0；採樣由 Tone.js Audio 發布。Spotify Basic Pitch、TensorFlow.js 使用 Apache-2.0；Cinzel 與 DM Sans 使用 SIL Open Font License。完整來源、處理方式與授權連結見 [軟體介紹與授權](research.html)。
