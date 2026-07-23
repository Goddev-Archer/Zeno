// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use std::path::PathBuf;
use std::fs;
use tauri::Manager;

#[derive(serde::Serialize)]
struct GitStatus {
    branch: String,
    is_clean: bool,
    modified: usize,
    added: usize,
    deleted: usize,
    untracked: usize,
}

#[derive(serde::Serialize)]
struct GitCommit {
    hash: String,
    message: String,
    date: String,
}

fn find_git_root() -> Option<PathBuf> {
    let mut dir = std::env::current_dir().ok()?;
    loop {
        if dir.join(".git").exists() {
            return Some(dir);
        }
        if !dir.pop() {
            break;
        }
    }
    None
}

fn run_git_command(args: &[&str]) -> Result<String, String> {
    let repo_path = find_git_root().ok_or_else(|| "Kein Git-Repository gefunden.".to_string())?;
    
    let mut cmd = Command::new("git");
    cmd.args(args).current_dir(&repo_path);
    
    let output = match cmd.output() {
        Ok(out) => out,
        Err(_) => {
            let mut git_exe = PathBuf::from("git");
            let paths = [
                "C:\\Program Files\\Git\\cmd\\git.exe",
                "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
            ];
            let mut found = false;
            for p in &paths {
                if PathBuf::from(p).exists() {
                    git_exe = PathBuf::from(p);
                    found = true;
                    break;
                }
            }
            
            if !found {
                if let Some(appdata) = std::env::var_os("LOCALAPPDATA") {
                    let user_git = PathBuf::from(appdata)
                        .join("Programs")
                        .join("Git")
                        .join("cmd")
                        .join("git.exe");
                    if user_git.exists() {
                        git_exe = user_git;
                        found = true;
                    }
                }
            }
            
            if !found {
                if let Some(userprofile) = std::env::var_os("USERPROFILE") {
                    let user_git = PathBuf::from(userprofile)
                        .join("AppData")
                        .join("Local")
                        .join("Programs")
                        .join("Git")
                        .join("cmd")
                        .join("git.exe");
                    if user_git.exists() {
                        git_exe = user_git;
                    }
                }
            }
            
            let mut cmd = Command::new(git_exe);
            cmd.args(args).current_dir(&repo_path);
            cmd.output().map_err(|e| format!("Git-Befehl konnte nicht gestartet werden: {}", e))?
        }
    };
    
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if err.is_empty() { "Git-Befehl fehlgeschlagen.".to_string() } else { err });
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[tauri::command]
fn get_git_status() -> Result<GitStatus, String> {
    let branch = run_git_command(&["rev-parse", "--abbrev-ref", "HEAD"])
        .unwrap_or_else(|_| "unknown".to_string());
    let status_raw = run_git_command(&["status", "--porcelain"])?;
    
    let mut modified = 0;
    let mut added = 0;
    let mut deleted = 0;
    let mut untracked = 0;
    
    for line in status_raw.lines() {
        if line.len() < 3 {
            continue;
        }
        let prefix = &line[0..2];
        if prefix.starts_with('M') || prefix.ends_with('M') {
            modified += 1;
        } else if prefix.starts_with('A') || prefix.ends_with('A') {
            added += 1;
        } else if prefix.starts_with('D') || prefix.ends_with('D') {
            deleted += 1;
        } else if prefix == "??" {
            untracked += 1;
        }
    }
    let is_clean = modified == 0 && added == 0 && deleted == 0 && untracked == 0;
    Ok(GitStatus {
        branch,
        is_clean,
        modified,
        added,
        deleted,
        untracked,
    })
}

#[tauri::command]
fn get_git_log() -> Result<Vec<GitCommit>, String> {
    let log_raw = run_git_command(&["log", "-n", "5", "--pretty=format:%h|%s|%ar"])?;
    let mut commits = Vec::new();
    for line in log_raw.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 3 {
            commits.push(GitCommit {
                hash: parts[0].to_string(),
                message: parts[1].to_string(),
                date: parts[2].to_string(),
            });
        }
    }
    Ok(commits)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn get_project_root() -> PathBuf {
    find_git_root().unwrap_or_else(|| {
        std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
    })
}

fn get_safe_path(name: &str) -> Result<PathBuf, String> {
    let root = get_project_root();
    let file_path = root.join(name);
    
    let canonical_root = root.canonicalize()
        .map_err(|e| format!("Fehler beim Verifizieren des Projektordners: {}", e))?;
    
    if file_path.exists() {
        let canonical_file = file_path.canonicalize()
            .map_err(|e| format!("Fehler beim Verifizieren des Pfads: {}", e))?;
        if !canonical_file.starts_with(&canonical_root) {
            return Err("Zugriff verweigert (Pfad außerhalb des Workspace).".to_string());
        }
    } else {
        if let Some(parent) = file_path.parent() {
            if parent.exists() {
                let canonical_parent = parent.canonicalize()
                    .map_err(|e| format!("Fehler beim Verifizieren des Ordners: {}", e))?;
                if !canonical_parent.starts_with(&canonical_root) {
                    return Err("Zugriff verweigert (Pfad außerhalb des Workspace).".to_string());
                }
            } else {
                return Err("Übergeordneter Ordner existiert nicht.".to_string());
            }
        }
    }
    
    Ok(file_path)
}

#[derive(serde::Serialize)]
struct WorkspaceFile {
    name: String,
    language: String,
}

fn visit_dirs(dir: &std::path::Path, files: &mut Vec<WorkspaceFile>, root: &std::path::Path) -> std::io::Result<()> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().unwrap_or_default().to_string_lossy();
                if name == "node_modules" || name == ".git" || name == "target" || name == "dist" || name == ".tauri" || name == "desktop" {
                    continue;
                }
                visit_dirs(&path, files, root)?;
            } else {
                let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();
                if name.starts_with('.') || name == "Cargo.lock" || name == "package-lock.json" {
                    continue;
                }
                
                let ext = path.extension()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_lowercase();
                    
                if ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "gif" || ext == "svg" || ext == "ico" ||
                   ext == "exe" || ext == "dll" || ext == "pdb" || ext == "zip" || ext == "tar" || ext == "gz" || ext == "rar" {
                    continue;
                }
                
                let relative_path = match path.strip_prefix(root) {
                    Ok(p) => p.to_string_lossy().into_owned().replace('\\', "/"),
                    Err(_) => name.clone(),
                };
                
                let language = match ext.as_str() {
                    "rs" => "rust",
                    "py" => "python",
                    "js" | "jsx" => "javascript",
                    "ts" | "tsx" => "typescript",
                    "json" => "json",
                    "md" => "markdown",
                    "css" => "css",
                    "html" => "html",
                    _ => "text",
                }.to_string();
                
                files.push(WorkspaceFile { name: relative_path, language });
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn list_workspace_files() -> Result<Vec<WorkspaceFile>, String> {
    let root = get_project_root();
    let mut files = Vec::new();
    visit_dirs(&root, &mut files, &root)
        .map_err(|e| format!("Kann Workspace-Dateien nicht lesen: {}", e))?;
    
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(files)
}

#[tauri::command]
fn read_workspace_file(name: String) -> Result<String, String> {
    let path = get_safe_path(&name)?;
    fs::read_to_string(path)
        .map_err(|e| format!("Fehler beim Lesen der Datei: {}", e))
}

#[tauri::command]
fn write_workspace_file(name: String, content: String) -> Result<(), String> {
    let path = get_safe_path(&name)?;
    fs::write(path, content)
        .map_err(|e| format!("Fehler beim Schreiben der Datei: {}", e))
}

#[tauri::command]
fn delete_workspace_file(name: String) -> Result<(), String> {
    let path = get_safe_path(&name)?;
    fs::remove_file(path)
        .map_err(|e| format!("Fehler beim Löschen der Datei: {}", e))
}

fn get_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_dir = app.path().app_config_dir()
        .map_err(|e| format!("Fehler beim Ermitteln des Config-Pfads: {}", e))?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Kann Config-Ordner nicht erstellen: {}", e))?;
    }
    Ok(config_dir.join("settings.json"))
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, settings: String) -> Result<(), String> {
    let path = get_settings_path(&app)?;
    fs::write(path, settings)
        .map_err(|e| format!("Fehler beim Speichern der Einstellungen: {}", e))
}

#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_settings_path(&app)?;
    if !path.exists() {
        return Ok("{}".to_string());
    }
    fs::read_to_string(path)
        .map_err(|e| format!("Fehler beim Laden der Einstellungen: {}", e))
}

#[tauri::command]
fn open_native_webview(app: tauri::AppHandle, url: String, title: String) -> Result<(), String> {
    let parsed_url = url.parse().map_err(|e| format!("Ungültige URL: {}", e))?;
    
    if let Some(window) = app.get_webview_window("browser_win") {
        let _ = window.navigate(parsed_url);
        let _ = window.set_title(&title);
        let _ = window.set_focus();
    } else {
        let _window = tauri::WebviewWindowBuilder::new(
            &app,
            "browser_win",
            tauri::WebviewUrl::External(parsed_url)
        )
        .title(title)
        .inner_size(1000.0, 700.0)
        .build()
        .map_err(|e| format!("Fehler beim Erstellen des Fensters: {}", e))?;
    }
    Ok(())
}
use base64::Engine;
use headless_chrome::{Browser, LaunchOptionsBuilder};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use tauri::Emitter;

static STREAM_RUNNING: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn start_offscreen_browser(app: tauri::AppHandle, url: String) -> Result<(), String> {
    STREAM_RUNNING.store(false, Ordering::SeqCst);
    thread::sleep(Duration::from_millis(50));
    STREAM_RUNNING.store(true, Ordering::SeqCst);

    thread::spawn(move || {
        let launch_options = match LaunchOptionsBuilder::default()
            .headless(true)
            .window_size(Some((1280, 800)))
            .build() {
                Ok(opts) => opts,
                Err(e) => {
                    let _ = app.emit("browser-log", format!("Fehler bei LaunchOptions: {}", e));
                    return;
                }
            };

        let browser = match Browser::new(launch_options) {
            Ok(b) => b,
            Err(e) => {
                let _ = app.emit("browser-log", format!("Konnte Headless Chromium/Brave nicht starten: {}", e));
                return;
            }
        };

        let tab = match browser.new_tab() {
            Ok(t) => t,
            Err(e) => {
                let _ = app.emit("browser-log", format!("Konnte Tab nicht erstellen: {}", e));
                return;
            }
        };

        let _ = app.emit("browser-log", format!("SANDBOX: Headless Browser gestartet. Navigiere zu {}...", url));

        if let Err(e) = tab.navigate_to(&url) {
            let _ = app.emit("browser-log", format!("Navigationsfehler: {}", e));
            return;
        }

        let _ = tab.wait_until_navigated();
        let _ = app.emit("browser-log", "STREAM: AV1 Pixel-Stream bereit. Erzeuge Framebuffer...");

        while STREAM_RUNNING.load(Ordering::SeqCst) {
            match tab.capture_screenshot(
                headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Jpeg,
                Some(70),
                None,
                true
            ) {
                Ok(png_bytes) => {
                    let b64 = format!("data:image/jpeg;base64,{}", base64::engine::general_purpose::STANDARD.encode(&png_bytes));
                    let title = tab.get_title().unwrap_or_else(|_| "Offscreen Browser".to_string());
                    let current_url = tab.get_url();

                    let payload = serde_json::json!({
                        "frame": b64,
                        "url": current_url,
                        "title": title
                    });

                    let _ = app.emit("browser-frame", payload);
                }
                Err(e) => {
                    let _ = app.emit("browser-log", format!("Screenshot-Fehler: {}", e));
                }
            }
            thread::sleep(Duration::from_millis(60));
        }
    });

    Ok(())
}

#[tauri::command]
fn stop_offscreen_browser() -> Result<(), String> {
    STREAM_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_git_status,
            get_git_log,
            list_workspace_files,
            read_workspace_file,
            write_workspace_file,
            delete_workspace_file,
            load_settings,
            save_settings,
            open_native_webview,
            start_offscreen_browser,
            stop_offscreen_browser
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
