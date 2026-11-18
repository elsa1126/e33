// E33 存檔編輯 電腦軟體版外殼：介面沿用網頁版 index.html，這裡只負責找存檔、讀檔、寫檔
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::Engine;
use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(Serialize)]
struct SaveEntry {
    path: String,
    name: String,
    folder: String,
    size: u64,
    modified: u64,
}

// 預設會去找的 SaveGames 資料夾
fn candidate_dirs() -> Vec<PathBuf> {
    let mut v: Vec<PathBuf> = Vec::new();
    #[cfg(target_os = "windows")]
    if let Some(d) = dirs::data_local_dir() {
        v.push(d.join("Sandfall").join("Saved").join("SaveGames"));
    }
    #[cfg(target_os = "macos")]
    {
        // Mac 上的遊戲是 Wine 包裝（Kegworks／Wineskin／CrossOver），存檔在包裝裡的假 C 槽
        let mut pats: Vec<String> = vec![
            "/Applications/*.app/Contents/SharedSupport/prefix/drive_c/users/*/AppData/Local/Sandfall/Saved/SaveGames".into(),
            "/Applications/*.app/Contents/Resources/drive_c/users/*/AppData/Local/Sandfall/Saved/SaveGames".into(),
        ];
        if let Some(h) = dirs::home_dir() {
            let h = h.to_string_lossy().to_string();
            pats.push(format!("{h}/Applications/*.app/Contents/SharedSupport/prefix/drive_c/users/*/AppData/Local/Sandfall/Saved/SaveGames"));
            pats.push(format!("{h}/Library/Application Support/CrossOver/Bottles/*/drive_c/users/*/AppData/Local/Sandfall/Saved/SaveGames"));
        }
        for p in pats {
            if let Ok(g) = glob::glob(&p) {
                v.extend(g.flatten());
            }
        }
    }
    v
}

fn scan_dir(dir: &Path, out: &mut Vec<SaveEntry>) {
    // SaveGames 底下通常還有一層 Steam 編號資料夾；兩層都看
    let mut dirs_ = vec![dir.to_path_buf()];
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            if e.path().is_dir() {
                dirs_.push(e.path());
            }
        }
    }
    for d in dirs_ {
        let Ok(rd) = std::fs::read_dir(&d) else { continue };
        for e in rd.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if !(name.starts_with("EXPEDITION_") && name.to_lowercase().ends_with(".sav")) {
                continue;
            }
            let Ok(m) = e.metadata() else { continue };
            let modified = m
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            out.push(SaveEntry {
                path: e.path().to_string_lossy().to_string(),
                name,
                folder: d.file_name().map(|x| x.to_string_lossy().to_string()).unwrap_or_default(),
                size: m.len(),
                modified,
            });
        }
    }
}

#[tauri::command]
fn list_saves(extra: Option<String>) -> Vec<SaveEntry> {
    let mut ds = candidate_dirs();
    if let Some(e) = extra.filter(|s| !s.is_empty()) {
        ds.insert(0, PathBuf::from(e));
    }
    let mut out = Vec::new();
    for d in ds {
        scan_dir(&d, &mut out);
    }
    let mut seen = HashSet::new();
    out.retain(|s| seen.insert(s.path.clone()));
    // 依遊戲資料夾、檔名排序，讓 EXPEDITION_0～4 照順序
    out.sort_by(|a, b| a.folder.cmp(&b.folder).then(a.name.cmp(&b.name)));
    out
}

#[tauri::command]
fn read_save(path: String) -> Result<tauri::ipc::Response, String> {
    std::fs::read(&path).map(tauri::ipc::Response::new).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, data: String) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![list_saves, read_save, write_file])
        .run(tauri::generate_context!())
        .expect("error while running E33 Save Editor");
}
