# E33 存檔編輯

《光與影：33 號遠征隊》（Clair Obscur: Expedition 33）的網頁版存檔編輯器，支援 1.5 版 Verso's Drafts DLC。

## 使用方式

1. 打開網頁，先用內建的範例存檔隨意試。
2. 按「開啟我的存檔」，選擇 `EXPEDITION_x.sav`。
3. 修改後按「下載存檔」，把下載的檔案放回存檔資料夾。換檔前請先備份原本的存檔，並讓遊戲停在標題畫面。

Windows 存檔位置：`%LOCALAPPDATA%\Sandfall\Saved\SaveGames\<編號>\`

存檔只在你的瀏覽器裡處理，不會上傳到任何地方。整個編輯器是單一 `index.html`，下載後離線也能用。

## 電腦軟體版（Windows／Mac）

到 [Releases](https://github.com/elsa1126/e33/releases) 下載：Windows 選 `.exe`，Mac 選 `.dmg`（Intel 與 Apple 晶片都能用）。

軟體版和網頁版介面相同，多了「遊戲存檔清單」：一打開就列出 `EXPEDITION_0～4`、遊戲時數與讀檔地點，點一下就載入；按「下載存檔」會跳出另存新檔，預設存回原本的位置。找不到存檔時可以按「選擇資料夾」指定 SaveGames 資料夾。

安裝檔沒有付費簽章，第一次開啟會被系統攔下：

- Windows：出現「Windows 已保護您的電腦」時，按「其他資訊」→「仍要執行」。
- Mac：把 App 拖進「應用程式」後，對它按右鍵 →「打開」→ 再按「打開」。如果顯示「已損毀」，在終端機執行 `xattr -cr "/Applications/E33 Save Editor.app"` 後再開。

原始碼在 `app/`（Tauri 2），由 `.github/workflows/desktop.yml` 在 GitHub Actions 上 build。

## 分頁

外觀、武器、符文、角色、技能、唱片、日誌、能力、友善敵人、其他、好感、敵人、任務、GUID、轉檔（1.5 版存檔轉成舊版）。

## 限制

- 付費豪華版外觀不提供新增。
- 拿不到的道具（測試用、被砍掉的內容）不會列出。
- 裝備中的武器或符文不能直接移除。
- 好感編號 6、探索能力只有編號；任務狀態只確定 2 代表完成。

## 資料來源與授權

道具、符文、武器、外觀的遊戲資料表取自 [Infarctus/CO-E33_Save_editor](https://github.com/Infarctus/CO-E33_Save_editor)（GPL-3.0），因此本專案同樣以 GPL-3.0 授權發布。道具中文名稱來自遊戲內的官方繁體中文翻譯。

本工具與 Sandfall Interactive、Kepler Interactive 無關。
