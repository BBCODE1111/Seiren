# Seiren 與 Khimaira 的維護邊界

- 修改樂理、和弦、和聲或跨產品功能前，閱讀 `docs/SHARED-MUSIC-CORE.md`。
- `music-core.js` 是發布副本，唯一來源為同工作區的 `Khimaira/packages/music-core/core.js`。不要手改副本或把 Seiren 的旋律生成策略蓋到 Khimaira。
- `piano-motion.js` 同樣為發布副本，來源是 `Khimaira/packages/piano-motion/motion.js`。修改 TEXTURE 先讀 `docs/course-study-20261027.md`；保留本產品的拍號、旋律保護、舊 POP 行為與生成策略。
- `music.js` 保留 Seiren adapter；`seiren-v1` 的拼字、解析與 minor 判定是既有相容契約。改變前先檢查旋律配和弦及實際伴奏影響。
- 共用修改需同步並驗證兩邊；只有本 checkout 時，清楚記錄另一邊尚未驗證。一般旋律、伴奏、音訊或 UI 需求先在本產品範圍處理。
- 保留其他正在進行的未提交修改；遇到測試失敗，先比對修改前基準。不得為讓測試通過而直接重製 golden fixture，或恢復舊版已撤銷的旋律衝突預期。

- POP／TEXTURE 樂句共用 `applyPianoPhrase`，先讀 `docs/piano-phrases-20261027.md`；各產品原有 12 款 renderer 與生成邏輯不合併。保留 original 演奏指紋及舊專案遷移。Khimaira 的 POP 顯示仍使用舊 piano* ID。
