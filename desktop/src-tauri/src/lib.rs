// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;
use tauri::Manager;

mod crypto;
mod db;
mod voice_network;

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

fn get_git_executable() -> PathBuf {
    let paths = [
        "C:\\Program Files\\Git\\cmd\\git.exe",
        "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
    ];
    for p in &paths {
        if PathBuf::from(p).exists() {
            return PathBuf::from(p);
        }
    }
    
    if let Some(appdata) = std::env::var_os("LOCALAPPDATA") {
        let user_git = PathBuf::from(appdata)
            .join("Programs")
            .join("Git")
            .join("cmd")
            .join("git.exe");
        if user_git.exists() {
            return user_git;
        }
    }
    
    if let Some(userprofile) = std::env::var_os("USERPROFILE") {
        let user_git = PathBuf::from(userprofile)
            .join("AppData")
            .join("Local")
            .join("Programs")
            .join("Git")
            .join("cmd")
            .join("git.exe");
        if user_git.exists() {
            return user_git;
        }
    }
    PathBuf::from("git")
}

fn run_git_in_dir(repo_path: &std::path::Path, args: &[&str]) -> Result<String, String> {
    let git_exe = get_git_executable();
    let mut cmd = Command::new(&git_exe);
    cmd.args(args).current_dir(repo_path);
    
    let output = match cmd.output() {
        Ok(out) => out,
        Err(_) => {
            let mut fallback_cmd = Command::new("git");
            fallback_cmd.args(args).current_dir(repo_path);
            fallback_cmd.output().map_err(|e| format!("Git-Befehl konnte nicht gestartet werden: {}", e))?
        }
    };
    
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if err.is_empty() { "Git-Befehl fehlgeschlagen.".to_string() } else { err });
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn run_git_command(args: &[&str]) -> Result<String, String> {
    let repo_path = find_git_root().ok_or_else(|| "Kein Git-Repository gefunden.".to_string())?;
    run_git_in_dir(&repo_path, args)
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

// --- GIT SERVER MANIFEST SYNCHRONIZATION ---
#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GitSyncResult {
    pub success: bool,
    pub commit_hash: Option<String>,
    pub output: String,
    pub pushed: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GitPullResult {
    pub success: bool,
    pub updated: bool,
    pub output: String,
    pub manifest_content: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GitServerRepoStatus {
    pub repo_path: String,
    pub branch: String,
    pub is_clean: bool,
    pub has_remote: bool,
    pub remote_url: Option<String>,
    pub last_commit: Option<String>,
    pub manifest_exists: bool,
}

fn resolve_instance_dir(
    app: &tauri::AppHandle,
    server_id: Option<String>,
    custom_path: Option<String>,
) -> Result<PathBuf, String> {
    // 1. If explicit custom_path provided:
    if let Some(path_str) = custom_path {
        let trimmed = path_str.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            // Strict safety check: NEVER allow using the Zeno development project root!
            if let Some(git_root) = find_git_root() {
                if let (Ok(c_path), Ok(c_root)) = (path.canonicalize(), git_root.canonicalize()) {
                    if c_path == c_root {
                        return Err("Sicherheitsblockade: Das Quellcode-Repository von Zeno kann nicht als Server-Instanzordner verwendet werden. Instanzen erhalten einen isolierten Datenspeicher.".to_string());
                    }
                }
            }
            if path.exists() && path.is_dir() {
                return Ok(path);
            } else {
                return Err(format!("Repository-Pfad '{}' existiert nicht oder ist kein Verzeichnis.", trimmed));
            }
        }
    }

    // 2. Default isolated instance directory inside app_data_dir/instances/<sanitized_id>
    let base_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    let raw_id = server_id.unwrap_or_else(|| "default-instance".to_string());
    let sanitized_id: String = raw_id
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();

    let instance_dir = base_dir.join("instances").join(sanitized_id);
    if !instance_dir.exists() {
        fs::create_dir_all(&instance_dir)
            .map_err(|e| format!("Konnte Instanzordner nicht anlegen: {}", e))?;
    }

    // Initialize clean git repository if not yet present
    let git_dir = instance_dir.join(".git");
    if !git_dir.exists() {
        let _ = run_git_in_dir(&instance_dir, &["init"]);
        let _ = run_git_in_dir(&instance_dir, &["config", "user.name", "Zeno Instance"]);
        let _ = run_git_in_dir(&instance_dir, &["config", "user.email", "instance@zeno.local"]);
    }

    Ok(instance_dir)
}

#[tauri::command]
fn git_server_get_status(
    app: tauri::AppHandle,
    server_id: Option<String>,
    repo_path: Option<String>,
) -> Result<GitServerRepoStatus, String> {
    let dir = resolve_instance_dir(&app, server_id, repo_path)?;
    let branch = run_git_in_dir(&dir, &["rev-parse", "--abbrev-ref", "HEAD"])
        .unwrap_or_else(|_| "main".to_string());
    
    let status_raw = run_git_in_dir(&dir, &["status", "--porcelain"])
        .unwrap_or_default();
    let is_clean = status_raw.trim().is_empty();

    let remote_res = run_git_in_dir(&dir, &["remote", "get-url", "origin"]);
    let (has_remote, remote_url) = match remote_res {
        Ok(url) if !url.trim().is_empty() => (true, Some(url.trim().to_string())),
        _ => (false, None),
    };

    let last_commit = run_git_in_dir(&dir, &["log", "-1", "--pretty=format:%h - %s (%cr)"]).ok();
    let manifest_exists = dir.join("zeno-server.json").exists();

    Ok(GitServerRepoStatus {
        repo_path: dir.to_string_lossy().to_string(),
        branch,
        is_clean,
        has_remote,
        remote_url,
        last_commit,
        manifest_exists,
    })
}

#[tauri::command]
fn git_server_commit_and_push(
    app: tauri::AppHandle,
    server_id: Option<String>,
    repo_path: Option<String>,
    manifest_content: String,
    commit_message: Option<String>,
    push: bool,
) -> Result<GitSyncResult, String> {
    let dir = resolve_instance_dir(&app, server_id, repo_path)?;
    let manifest_path = dir.join("zeno-server.json");

    // 1. Write the manifest content
    fs::write(&manifest_path, &manifest_content)
        .map_err(|e| format!("Fehler beim Schreiben von zeno-server.json: {}", e))?;

    // 2. Git add
    run_git_in_dir(&dir, &["add", "zeno-server.json"])
        .map_err(|e| format!("git add fehlgeschlagen: {}", e))?;

    // 3. Commit if changed
    let status = run_git_in_dir(&dir, &["status", "--porcelain", "zeno-server.json"])
        .unwrap_or_default();

    let msg = commit_message.unwrap_or_else(|| "feat(server): update zeno-server.json manifest".to_string());

    if !status.trim().is_empty() {
        run_git_in_dir(&dir, &["commit", "-m", &msg])
            .map_err(|e| format!("git commit fehlgeschlagen: {}", e))?;
    }

    let commit_hash = run_git_in_dir(&dir, &["rev-parse", "--short", "HEAD"]).ok();

    // 4. Git push if requested
    let (pushed, push_output) = if push {
        let branch = run_git_in_dir(&dir, &["rev-parse", "--abbrev-ref", "HEAD"]).unwrap_or_else(|_| "main".to_string());
        match run_git_in_dir(&dir, &["push", "origin", &branch]) {
            Ok(out) => (true, if out.is_empty() { "Erfolgreich nach origin gepusht.".to_string() } else { out }),
            Err(e1) => {
                match run_git_in_dir(&dir, &["push"]) {
                    Ok(out) => (true, if out.is_empty() { "Erfolgreich gepusht.".to_string() } else { out }),
                    Err(_) => (false, format!("Lokal committet ({}), aber Remote-Push fehlgeschlagen: {}", commit_hash.as_deref().unwrap_or("?"), e1))
                }
            }
        }
    } else {
        (false, "Lokal in Git gesichert (kein Remote-Push angefordert).".to_string())
    };

    Ok(GitSyncResult {
        success: true,
        commit_hash,
        output: push_output,
        pushed,
    })
}

#[tauri::command]
fn git_server_pull(
    app: tauri::AppHandle,
    server_id: Option<String>,
    repo_path: Option<String>,
) -> Result<GitPullResult, String> {
    let dir = resolve_instance_dir(&app, server_id, repo_path)?;
    let pull_res = run_git_in_dir(&dir, &["pull"]);
    let manifest_path = dir.join("zeno-server.json");

    let manifest_content = if manifest_path.exists() {
        fs::read_to_string(&manifest_path).ok()
    } else {
        None
    };

    match pull_res {
        Ok(out) => {
            let updated = !out.contains("Already up to date") && !out.contains("Bereits aktuell");
            Ok(GitPullResult {
                success: true,
                updated,
                output: out,
                manifest_content,
            })
        }
        Err(err) => {
            if manifest_content.is_some() {
                Ok(GitPullResult {
                    success: false,
                    updated: false,
                    output: format!("Git pull fehlgeschlagen ({}), lokales zeno-server.json Manifest wurde geladen.", err),
                    manifest_content,
                })
            } else {
                Err(format!("Git pull fehlgeschlagen und kein lokales Manifest vorhanden: {}", err))
            }
        }
    }
}

#[tauri::command]
fn git_server_read_manifest(
    app: tauri::AppHandle,
    server_id: Option<String>,
    repo_path: Option<String>,
) -> Result<String, String> {
    let dir = resolve_instance_dir(&app, server_id, repo_path)?;
    let manifest_path = dir.join("zeno-server.json");
    if !manifest_path.exists() {
        return Err("Keine zeno-server.json im Repository-Ordner gefunden.".to_string());
    }
    fs::read_to_string(manifest_path)
        .map_err(|e| format!("Fehler beim Lesen der zeno-server.json: {}", e))
}

#[tauri::command]
fn git_server_commit_and_push_readme(
    app: tauri::AppHandle,
    server_id: Option<String>,
    repo_path: Option<String>,
    readme_content: String,
    commit_message: Option<String>,
    push: bool,
) -> Result<GitSyncResult, String> {
    let dir = resolve_instance_dir(&app, server_id, repo_path)?;
    let readme_path = dir.join("README.md");

    // 1. Write the README.md content
    fs::write(&readme_path, &readme_content)
        .map_err(|e| format!("Fehler beim Schreiben von README.md: {}", e))?;

    // 2. Git add README.md
    run_git_in_dir(&dir, &["add", "README.md"])
        .map_err(|e| format!("git add README.md fehlgeschlagen: {}", e))?;

    // 3. Commit if changed
    let status = run_git_in_dir(&dir, &["status", "--porcelain", "README.md"])
        .unwrap_or_default();

    let msg = commit_message.unwrap_or_else(|| "docs(rules): update server rules in README.md".to_string());

    if !status.trim().is_empty() {
        run_git_in_dir(&dir, &["commit", "-m", &msg])
            .map_err(|e| format!("git commit fehlgeschlagen: {}", e))?;
    }

    let commit_hash = run_git_in_dir(&dir, &["rev-parse", "--short", "HEAD"]).ok();

    // 4. Git push if requested
    let (pushed, push_output) = if push {
        let branch = run_git_in_dir(&dir, &["rev-parse", "--abbrev-ref", "HEAD"]).unwrap_or_else(|_| "main".to_string());
        match run_git_in_dir(&dir, &["push", "origin", &branch]) {
            Ok(out) => (true, if out.is_empty() { "Erfolgreich nach origin gepusht.".to_string() } else { out }),
            Err(e1) => {
                match run_git_in_dir(&dir, &["push"]) {
                    Ok(out) => (true, if out.is_empty() { "Erfolgreich gepusht.".to_string() } else { out }),
                    Err(_) => (false, format!("Lokal committet ({}), aber Remote-Push fehlgeschlagen: {}", commit_hash.as_deref().unwrap_or("?"), e1))
                }
            }
        }
    } else {
        (false, "README.md lokal in Git gesichert (kein Remote-Push angefordert).".to_string())
    };

    Ok(GitSyncResult {
        success: true,
        commit_hash,
        output: push_output,
        pushed,
    })
}

#[tauri::command]
fn git_server_read_readme(
    app: tauri::AppHandle,
    server_id: Option<String>,
    repo_path: Option<String>,
) -> Result<String, String> {
    let dir = resolve_instance_dir(&app, server_id, repo_path)?;
    let readme_path = dir.join("README.md");
    if !readme_path.exists() {
        return Err("Keine README.md im Repository-Ordner gefunden.".to_string());
    }
    fs::read_to_string(readme_path)
        .map_err(|e| format!("Fehler beim Lesen der README.md: {}", e))
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
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Konnte übergeordneten Ordner nicht erstellen: {}", e))?;
        }
    }
    fs::write(path, content)
        .map_err(|e| format!("Fehler beim Schreiben der Datei: {}", e))
}

#[tauri::command]
fn delete_workspace_file(name: String) -> Result<(), String> {
    let path = get_safe_path(&name)?;
    fs::remove_file(path)
        .map_err(|e| format!("Fehler beim Löschen der Datei: {}", e))
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IdeEntry {
    pub name: String,
    pub path: String,
    pub is_folder: bool,
    pub language: String,
    pub size: Option<u64>,
}

#[tauri::command]
fn ide_open_folder_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let script = r#"
            Add-Type -AssemblyName System.Windows.Forms
            $f = New-Object System.Windows.Forms.FolderBrowserDialog
            $f.Description = "Wähle einen Projektordner für Zeno IDE"
            $f.ShowNewFolderButton = $true
            if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
                Write-Output $f.SelectedPath
            }
        "#;
        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", script])
            .output()
            .map_err(|e| format!("Fehler beim Öffnen des Ordner-Dialogs: {}", e))?;
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() { Ok(None) } else { Ok(Some(path)) }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

#[tauri::command]
fn ide_open_file_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let script = r#"
            Add-Type -AssemblyName System.Windows.Forms
            $f = New-Object System.Windows.Forms.OpenFileDialog
            $f.Title = "Datei in Zeno IDE öffnen"
            $f.Filter = "Alle Dateien (*.*)|*.*|Quellcode (*.rs;*.ts;*.js;*.py;*.json;*.md;*.html;*.css;*.toml)|*.rs;*.ts;*.js;*.py;*.json;*.md;*.html;*.css;*.toml"
            if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
                Write-Output $f.FileName
            }
        "#;
        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", script])
            .output()
            .map_err(|e| format!("Fehler beim Öffnen des Datei-Dialogs: {}", e))?;
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() { Ok(None) } else { Ok(Some(path)) }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

fn collect_ide_entries_recursive(
    dir: &Path,
    max_depth: usize,
    current_depth: usize,
    entries: &mut Vec<IdeEntry>,
) {
    if current_depth > max_depth || entries.len() >= 2000 {
        return;
    }
    let read_res = match fs::read_dir(dir) {
        Ok(r) => r,
        Err(_) => return,
    };

    let mut local_items: Vec<(PathBuf, String, bool)> = Vec::new();
    for item in read_res.flatten() {
        let p = item.path();
        let name = item.file_name().to_string_lossy().to_string();
        // Ignore internal VCS, build, dependency and cache artifacts
        if name == ".git"
            || name == "node_modules"
            || name == "target"
            || name == "dist"
            || name == "build"
            || name == ".venv"
            || name == "venv"
            || name == "__pycache__"
            || name == ".vscode"
            || name == ".idea"
            || name == ".DS_Store"
            || name == "Thumbs.db"
        {
            continue;
        }
        let is_dir = p.is_dir();
        local_items.push((p, name, is_dir));
    }

    // Folders first, then alphabetically
    local_items.sort_by(|a, b| {
        if a.2 && !b.2 {
            std::cmp::Ordering::Less
        } else if !a.2 && b.2 {
            std::cmp::Ordering::Greater
        } else {
            a.1.to_lowercase().cmp(&b.1.to_lowercase())
        }
    });

    for (p, name, is_dir) in local_items {
        let ext = p
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        let language = if is_dir {
            String::new()
        } else {
            match ext.as_str() {
                "rs" => "rust",
                "py" => "python",
                "js" | "mjs" | "cjs" => "javascript",
                "ts" | "tsx" => "typescript",
                "json" => "json",
                "md" => "markdown",
                "css" => "css",
                "html" => "html",
                "toml" => "toml",
                "yaml" | "yml" => "yaml",
                "sql" => "sql",
                "sh" | "bash" => "shell",
                "go" => "golang",
                "c" | "cpp" | "h" | "hpp" => "cpp",
                "cs" => "csharp",
                "png" | "jpg" | "jpeg" | "gif" | "svg" | "webp" => "image",
                _ => "plaintext",
            }
            .to_string()
        };
        let size = if !is_dir {
            p.metadata().ok().map(|m| m.len())
        } else {
            None
        };

        entries.push(IdeEntry {
            name,
            path: p.to_string_lossy().replace('\\', "/"),
            is_folder: is_dir,
            language,
            size,
        });

        if is_dir {
            collect_ide_entries_recursive(&p, max_depth, current_depth + 1, entries);
        }
    }
}

#[tauri::command]
fn ide_read_directory(dir_path: String) -> Result<Vec<IdeEntry>, String> {
    let root = PathBuf::from(&dir_path);
    if !root.exists() || !root.is_dir() {
        return Err(format!("Verzeichnis '{}' existiert nicht.", dir_path));
    }
    
    let mut entries = Vec::new();
    collect_ide_entries_recursive(&root, 6, 1, &mut entries);
    Ok(entries)
}

#[tauri::command]
fn ide_read_file(file_path: String) -> Result<String, String> {
    let p = PathBuf::from(&file_path);
    fs::read_to_string(&p)
        .map_err(|e| format!("Fehler beim Lesen der Datei '{}': {}", file_path, e))
}

#[tauri::command]
fn ide_write_file(file_path: String, content: String) -> Result<(), String> {
    let p = PathBuf::from(&file_path);
    if let Some(parent) = p.parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent);
        }
    }
    fs::write(&p, content)
        .map_err(|e| format!("Fehler beim Schreiben der Datei '{}': {}", file_path, e))
}

#[tauri::command]
fn ide_create_file(file_path: String) -> Result<(), String> {
    let p = PathBuf::from(&file_path);
    if let Some(parent) = p.parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent);
        }
    }
    fs::write(&p, "")
        .map_err(|e| format!("Fehler beim Erstellen der Datei '{}': {}", file_path, e))
}

#[tauri::command]
fn ide_create_folder(folder_path: String) -> Result<(), String> {
    let p = if Path::new(&folder_path).is_absolute() {
        PathBuf::from(&folder_path)
    } else {
        get_safe_path(&folder_path)?
    };
    fs::create_dir_all(&p)
        .map_err(|e| format!("Ordner konnte nicht erstellt werden: {}", e))
}

#[tauri::command]
fn ide_delete_entry(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| format!("Fehler beim Löschen des Ordners '{}': {}", path, e))
    } else {
        fs::remove_file(&p).map_err(|e| format!("Fehler beim Löschen der Datei '{}': {}", path, e))
    }
}

#[tauri::command]
fn ide_rename_entry(old_path: String, new_path: String) -> Result<(), String> {
    let from = PathBuf::from(&old_path);
    let to = PathBuf::from(&new_path);
    fs::rename(from, to)
        .map_err(|e| format!("Fehler beim Umbenennen von '{}' nach '{}': {}", old_path, new_path, e))
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IdeGitFileChange {
    pub path: String,
    pub status: String,
    pub is_staged: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IdeWorkspaceGitStatus {
    pub is_repo: bool,
    pub branch: String,
    pub staged: Vec<IdeGitFileChange>,
    pub unstaged: Vec<IdeGitFileChange>,
    pub ahead: usize,
    pub behind: usize,
}

#[tauri::command]
fn ide_get_git_status(dir_path: String) -> Result<IdeWorkspaceGitStatus, String> {
    let root = PathBuf::from(&dir_path);
    if !root.exists() || !root.is_dir() {
        return Ok(IdeWorkspaceGitStatus {
            is_repo: false,
            branch: String::new(),
            staged: Vec::new(),
            unstaged: Vec::new(),
            ahead: 0,
            behind: 0,
        });
    }

    let branch_res = run_git_in_dir(&root, &["rev-parse", "--abbrev-ref", "HEAD"]);
    let branch = match branch_res {
        Ok(b) if !b.trim().is_empty() => b.trim().to_string(),
        _ => {
            return Ok(IdeWorkspaceGitStatus {
                is_repo: false,
                branch: String::new(),
                staged: Vec::new(),
                unstaged: Vec::new(),
                ahead: 0,
                behind: 0,
            });
        }
    };

    let status_raw = run_git_in_dir(&root, &["status", "--porcelain", "-u"]).unwrap_or_default();
    let mut staged = Vec::new();
    let mut unstaged = Vec::new();

    for line in status_raw.lines() {
        if line.len() < 3 {
            continue;
        }
        let x = line.chars().nth(0).unwrap_or(' ');
        let y = line.chars().nth(1).unwrap_or(' ');
        let raw_path = &line[3..].trim();
        let file_path = raw_path.trim_matches('"').replace('\\', "/");

        if x == '?' && y == '?' {
            unstaged.push(IdeGitFileChange {
                path: file_path,
                status: "U".to_string(),
                is_staged: false,
            });
            continue;
        }

        if x != ' ' && x != '?' {
            let status_code = match x {
                'M' => "M",
                'A' => "A",
                'D' => "D",
                'R' => "R",
                _ => "M",
            };
            staged.push(IdeGitFileChange {
                path: file_path.clone(),
                status: status_code.to_string(),
                is_staged: true,
            });
        }

        if y != ' ' && y != '?' {
            let status_code = match y {
                'M' => "M",
                'D' => "D",
                _ => "M",
            };
            unstaged.push(IdeGitFileChange {
                path: file_path,
                status: status_code.to_string(),
                is_staged: false,
            });
        }
    }

    let (ahead, behind) = match run_git_in_dir(&root, &["rev-list", "--left-right", "--count", "HEAD...@{u}"]) {
        Ok(out) => {
            let parts: Vec<&str> = out.split_whitespace().collect();
            if parts.len() >= 2 {
                let a = parts[0].parse::<usize>().unwrap_or(0);
                let b = parts[1].parse::<usize>().unwrap_or(0);
                (a, b)
            } else {
                (0, 0)
            }
        }
        _ => (0, 0),
    };

    Ok(IdeWorkspaceGitStatus {
        is_repo: true,
        branch,
        staged,
        unstaged,
        ahead,
        behind,
    })
}

#[tauri::command]
fn ide_git_stage(dir_path: String, file_path: Option<String>) -> Result<(), String> {
    let root = PathBuf::from(&dir_path);
    if let Some(f) = file_path {
        run_git_in_dir(&root, &["add", &f])?;
    } else {
        run_git_in_dir(&root, &["add", "."])?;
    }
    Ok(())
}

#[tauri::command]
fn ide_git_unstage(dir_path: String, file_path: Option<String>) -> Result<(), String> {
    let root = PathBuf::from(&dir_path);
    if let Some(f) = file_path {
        if run_git_in_dir(&root, &["restore", "--staged", &f]).is_err() {
            let _ = run_git_in_dir(&root, &["reset", "HEAD", &f]);
        }
    } else {
        if run_git_in_dir(&root, &["restore", "--staged", "."]).is_err() {
            let _ = run_git_in_dir(&root, &["reset", "HEAD"]);
        }
    }
    Ok(())
}

#[tauri::command]
fn ide_git_discard(dir_path: String, file_path: String, is_untracked: bool) -> Result<(), String> {
    let root = PathBuf::from(&dir_path);
    if is_untracked {
        let target = root.join(&file_path);
        if target.is_dir() {
            let _ = fs::remove_dir_all(&target);
        } else if target.is_file() {
            let _ = fs::remove_file(&target);
        }
    } else {
        if run_git_in_dir(&root, &["restore", &file_path]).is_err() {
            let _ = run_git_in_dir(&root, &["checkout", "--", &file_path]);
        }
    }
    Ok(())
}

#[tauri::command]
fn ide_git_commit(dir_path: String, message: String) -> Result<String, String> {
    let root = PathBuf::from(&dir_path);
    let msg = message.trim();
    if msg.is_empty() {
        return Err("Commit-Nachricht darf nicht leer sein.".to_string());
    }
    run_git_in_dir(&root, &["commit", "-m", msg])
}

#[tauri::command]
fn ide_git_sync(dir_path: String) -> Result<String, String> {
    let root = PathBuf::from(&dir_path);
    let pull_res = run_git_in_dir(&root, &["pull", "--rebase"]);
    let push_res = run_git_in_dir(&root, &["push"]);
    
    let mut summary = String::new();
    if let Ok(p) = pull_res {
        summary.push_str(&p);
    }
    if let Ok(pu) = push_res {
        if !summary.is_empty() {
            summary.push_str("\n");
        }
        summary.push_str(&pu);
    } else if let Err(e) = push_res {
        return Err(format!("Git Push fehlgeschlagen: {}", e));
    }
    Ok(summary)
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NativeExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub duration_ms: u64,
    pub runner: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SystemCompilersStatus {
    pub rust_available: bool,
    pub rust_version: Option<String>,
    pub python_available: bool,
    pub python_version: Option<String>,
    pub node_available: bool,
    pub node_version: Option<String>,
    pub git_available: bool,
    pub git_version: Option<String>,
    pub go_available: bool,
    pub go_version: Option<String>,
}

fn resolve_toolchain_binary(cmd: &str) -> PathBuf {
    let filename = if cfg!(windows) {
        format!("{}.exe", cmd)
    } else {
        cmd.to_string()
    };

    // 1. Check relative to current executable: exe_dir/bin/<cmd>, exe_dir/runtimes/<cmd>/<cmd>, exe_dir/runtimes/rust/bin/<cmd>
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let bin_candidate = exe_dir.join("bin").join(&filename);
            if bin_candidate.is_file() {
                return bin_candidate;
            }
            let runtime_candidate = exe_dir.join("runtimes").join(cmd).join(&filename);
            if runtime_candidate.is_file() {
                return runtime_candidate;
            }
            let cargo_candidate = exe_dir.join("runtimes").join("rust").join("bin").join(&filename);
            if cargo_candidate.is_file() {
                return cargo_candidate;
            }
        }
    }

    // 2. Check current working directory: ./bin/<cmd>, ./runtimes/<cmd>/<cmd>
    let cwd_bin = PathBuf::from("bin").join(&filename);
    if cwd_bin.is_file() {
        return cwd_bin;
    }
    let cwd_runtime = PathBuf::from("runtimes").join(cmd).join(&filename);
    if cwd_runtime.is_file() {
        return cwd_runtime;
    }

    // 3. Fallback to system PATH
    PathBuf::from(cmd)
}

fn check_cli_version(cmd: &str, args: &[&str]) -> (bool, Option<String>) {
    let resolved = resolve_toolchain_binary(cmd);
    match Command::new(&resolved).args(args).output() {
        Ok(out) if out.status.success() => {
            let ver = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let first_line = ver.lines().next().unwrap_or("").to_string();
            (true, Some(first_line))
        }
        _ => (false, None),
    }
}

#[tauri::command]
fn ide_get_system_compilers() -> Result<SystemCompilersStatus, String> {
    let (rust_available, rust_version) = check_cli_version("rustc", &["--version"]);
    let (python_available, python_version) = check_cli_version("python", &["--version"]);
    let (node_available, node_version) = check_cli_version("node", &["--version"]);
    let (git_available, git_version) = check_cli_version("git", &["--version"]);
    let (go_available, go_version) = check_cli_version("go", &["version"]);

    Ok(SystemCompilersStatus {
        rust_available,
        rust_version,
        python_available,
        python_version,
        node_available,
        node_version,
        git_available,
        git_version,
        go_available,
        go_version,
    })
}

#[tauri::command]
fn ide_run_code_native(file_path: String, code: Option<String>) -> Result<NativeExecutionResult, String> {
    let start = std::time::Instant::now();
    let safe_file = if Path::new(&file_path).is_absolute() {
        PathBuf::from(&file_path)
    } else {
        get_safe_path(&file_path).unwrap_or_else(|_| PathBuf::from(&file_path))
    };

    // If unsaved code was passed, save it first safely
    if let Some(c) = code {
        if let Some(parent) = safe_file.parent() {
            if !parent.exists() {
                let _ = fs::create_dir_all(parent);
            }
        }
        let _ = fs::write(&safe_file, c);
    }

    let ext = safe_file.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
    let root = safe_file.parent().unwrap_or(Path::new(".")).to_path_buf();

    let (cmd_name, args, runner_desc): (String, Vec<String>, &str) = match ext.as_str() {
        "rs" => {
            if root.join("Cargo.toml").exists() {
                ("cargo".to_string(), vec!["check".to_string()], "Rust Cargo (Native Toolchain)")
            } else {
                ("rustc".to_string(), vec!["--crate-type".to_string(), "bin".to_string(), safe_file.to_string_lossy().to_string()], "Rust Compiler (rustc)")
            }
        },
        "py" => {
            ("python".to_string(), vec![safe_file.to_string_lossy().to_string()], "Python 3 (Native Interpreter)")
        },
        "js" | "mjs" | "cjs" => {
            ("node".to_string(), vec![safe_file.to_string_lossy().to_string()], "Node.js (Native V8 Engine)")
        },
        "ts" => {
            ("node".to_string(), vec![safe_file.to_string_lossy().to_string()], "TypeScript Node Runner")
        },
        "go" => {
            ("go".to_string(), vec!["run".to_string(), safe_file.to_string_lossy().to_string()], "Go Runtime")
        },
        "sh" | "bash" => {
            ("bash".to_string(), vec![safe_file.to_string_lossy().to_string()], "Bash Shell")
        },
        "bat" | "cmd" => {
            ("cmd".to_string(), vec!["/C".to_string(), safe_file.to_string_lossy().to_string()], "Windows Command Prompt")
        },
        "ps1" => {
            ("powershell".to_string(), vec!["-ExecutionPolicy".to_string(), "Bypass".to_string(), "-File".to_string(), safe_file.to_string_lossy().to_string()], "PowerShell Core")
        },
        _ => {
            return Ok(NativeExecutionResult {
                success: true,
                stdout: format!("Datei '{}' ({}) enthält keinen ausführbaren Quelltext. Syntax-Prüfung erfolgreich.", file_path, ext),
                stderr: String::new(),
                exit_code: Some(0),
                duration_ms: start.elapsed().as_millis() as u64,
                runner: "Zeno File Validator (Rust Core)".to_string(),
            });
        }
    };

    let resolved_cmd = resolve_toolchain_binary(&cmd_name);
    let mut command = Command::new(&resolved_cmd);
    command.args(&args).current_dir(&root);

    let output = match command.output() {
        Ok(out) => out,
        Err(e) => {
            if cmd_name == "python" {
                if let Ok(out) = Command::new("py").args(&args).current_dir(&root).output() {
                    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
                    return Ok(NativeExecutionResult {
                        success: out.status.success(),
                        stdout,
                        stderr,
                        exit_code: out.status.code(),
                        duration_ms: start.elapsed().as_millis() as u64,
                        runner: "Python (Windows Launcher 'py')".to_string(),
                    });
                }
            }
            return Ok(NativeExecutionResult {
                success: false,
                stdout: String::new(),
                stderr: format!("Natives Ausführungstool '{}' ({}) wurde auf dem System nicht gefunden: {}\n\n💡 Tipp: Zeno unterstützt portable Toolchains im Ordner 'bin/' oder 'runtimes/{}/' (z.B. node.exe, cargo.exe) sowie globale System-Installationen.", cmd_name, runner_desc, e, cmd_name),
                exit_code: Some(127),
                duration_ms: start.elapsed().as_millis() as u64,
                runner: runner_desc.to_string(),
            });
        }
    };

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let exit_code = output.status.code();
    let success = output.status.success();

    Ok(NativeExecutionResult {
        success,
        stdout,
        stderr,
        exit_code,
        duration_ms: start.elapsed().as_millis() as u64,
        runner: runner_desc.to_string(),
    })
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
fn export_text_file(app: tauri::AppHandle, filename: String, content: String) -> Result<String, String> {
    let target_dir = app.path().download_dir()
        .or_else(|_| app.path().desktop_dir())
        .unwrap_or_else(|_| PathBuf::from("."));

    if !target_dir.exists() {
        let _ = fs::create_dir_all(&target_dir);
    }

    let target_path = target_dir.join(&filename);
    fs::write(&target_path, &content)
        .map_err(|e| format!("Fehler beim Schreiben der Datei '{}': {}", filename, e))?;

    // On Windows, reveal the newly created file in Windows Explorer so the user immediately sees it!
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("explorer")
            .args(["/select,", &target_path.to_string_lossy()])
            .spawn();
    }

    Ok(target_path.to_string_lossy().to_string())
}

// --- PHASE 1: CRYPTO COMMANDS ---
#[tauri::command]
fn crypto_generate_identity() -> Result<crypto::UserIdentity, String> {
    crypto::generate_identity()
}

#[tauri::command]
fn crypto_sign_challenge(nonce: String, private_key_hex: String) -> Result<String, String> {
    crypto::sign_challenge(&nonce, &private_key_hex)
}

#[tauri::command]
fn crypto_verify_signature(nonce: String, signature_hex: String, public_key_hex: String) -> Result<bool, String> {
    crypto::verify_signature(&nonce, &signature_hex, &public_key_hex)
}

#[tauri::command]
fn crypto_encrypt_vault(plaintext: String, passcode: String) -> Result<crypto::EncryptedVaultBlob, String> {
    crypto::encrypt_vault(&plaintext, &passcode)
}

#[tauri::command]
fn crypto_generate_sovereign_identity() -> Result<crypto::UserIdentity, String> {
    crypto::generate_sovereign_identity()
}

#[tauri::command]
fn crypto_import_sovereign_identity(words: String) -> Result<crypto::UserIdentity, String> {
    crypto::import_sovereign_identity(&words)
}

#[tauri::command]
fn crypto_decrypt_vault(vault: crypto::EncryptedVaultBlob, passcode: String) -> Result<String, String> {
    crypto::decrypt_vault(&vault, &passcode)
}

// --- PHASE 2: DATABASE COMMANDS ---
#[tauri::command]
fn db_save_identity(state: tauri::State<db::DbState>, identity: db::DbIdentityRecord) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::insert_or_update_identity(&conn, &identity)
}

#[tauri::command]
fn db_get_active_identity(state: tauri::State<db::DbState>) -> Result<Option<db::DbIdentityRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::fetch_active_identity(&conn)
}

#[tauri::command]
fn db_get_all_identities(state: tauri::State<db::DbState>) -> Result<Vec<db::DbIdentityRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::fetch_all_identities(&conn)
}

#[tauri::command]
fn db_set_active_identity(state: tauri::State<db::DbState>, ain: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::set_active_identity(&conn, &ain)
}

#[tauri::command]
fn db_delete_identity(state: tauri::State<db::DbState>, ain: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::remove_identity(&conn, &ain)
}
#[tauri::command]
fn db_save_server(state: tauri::State<db::DbState>, server: db::DbServerRecord, account_ain: Option<String>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::insert_or_update_server(&conn, &server, account_ain.as_deref())
}

#[tauri::command]
fn db_get_servers(state: tauri::State<db::DbState>, account_ain: Option<String>) -> Result<Vec<db::DbServerRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    if let Some(ain) = account_ain {
        db::fetch_servers_for_account(&conn, &ain)
    } else {
        db::fetch_all_servers(&conn)
    }
}

#[tauri::command]
fn db_delete_server(state: tauri::State<db::DbState>, server_id: String, account_ain: Option<String>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    if let Some(ain) = account_ain {
        db::remove_server_for_account(&conn, &server_id, &ain)
    } else {
        db::remove_server(&conn, &server_id)
    }
}

#[tauri::command]
fn db_save_message(state: tauri::State<db::DbState>, message: db::DbMessageRecord) -> Result<i64, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::insert_message(&conn, &message)
}

#[tauri::command]
fn db_get_channel_messages(
    state: tauri::State<db::DbState>,
    channel_id: String,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<db::DbMessageRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::fetch_channel_messages(&conn, &channel_id, limit.unwrap_or(100), offset.unwrap_or(0))
}

#[tauri::command]
fn db_delete_message(
    state: tauri::State<db::DbState>,
    channel_id: String,
    text: String,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::remove_message(&conn, &channel_id, &text)
}

#[tauri::command]
fn db_delete_message_by_id(
    state: tauri::State<db::DbState>,
    message_id: i64,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::remove_message_by_id(&conn, message_id)
}

// --- PHASE 3: VOICE & NETWORK COMMANDS ---
#[tauri::command]
fn voice_join(
    app: tauri::AppHandle,
    state: tauri::State<voice_network::VoiceNetworkState>,
    channel_id: String,
    channel_name: String,
    user_name: String,
) -> Result<voice_network::VoiceSessionStatus, String> {
    voice_network::join_voice_channel(&app, &state, channel_id, channel_name, user_name)
}

#[tauri::command]
fn voice_leave(
    app: tauri::AppHandle,
    state: tauri::State<voice_network::VoiceNetworkState>,
) -> Result<voice_network::VoiceSessionStatus, String> {
    voice_network::leave_voice_channel(&app, &state)
}

#[tauri::command]
fn voice_set_mute(
    app: tauri::AppHandle,
    state: tauri::State<voice_network::VoiceNetworkState>,
    muted: bool,
) -> Result<voice_network::VoiceSessionStatus, String> {
    voice_network::toggle_mute(&app, &state, muted)
}

#[tauri::command]
fn voice_set_deafen(
    app: tauri::AppHandle,
    state: tauri::State<voice_network::VoiceNetworkState>,
    deafened: bool,
) -> Result<voice_network::VoiceSessionStatus, String> {
    voice_network::toggle_deafen(&app, &state, deafened)
}

#[tauri::command]
fn voice_get_status(
    state: tauri::State<voice_network::VoiceNetworkState>,
) -> Result<voice_network::VoiceSessionStatus, String> {
    voice_network::get_voice_status(&state)
}

#[tauri::command]
fn voice_update_speaking(
    app: tauri::AppHandle,
    state: tauri::State<voice_network::VoiceNetworkState>,
    is_speaking: bool,
    input_level: f32,
) -> Result<voice_network::VoiceSessionStatus, String> {
    voice_network::update_speaking(&app, &state, is_speaking, input_level)
}

#[tauri::command]
fn voice_send_signal(
    app: tauri::AppHandle,
    signal: voice_network::VoiceSignalPayload,
) -> Result<(), String> {
    voice_network::broadcast_voice_signal(&app, signal)
}

#[tauri::command]
fn network_broadcast_message(
    app: tauri::AppHandle,
    channel_id: String,
    author: String,
    text: String,
    color: String,
    time: String,
    code: Option<String>,
) -> Result<(), String> {
    let msg = serde_json::json!({
        "channelId": channel_id,
        "author": author,
        "text": text,
        "color": color,
        "time": time,
        "code": code
    });
    let _ = tauri::Emitter::emit(&app, "zeno://message_received", &msg);
    Ok(())
}

// --- PHASE 3: OBSIDIAN PLUGIN SYSTEM HOST COMMANDS ---

#[tauri::command]
fn plugin_open_folder(app: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let plugins_dir = app_data_dir.join("plugins");
    if !plugins_dir.exists() {
        let _ = fs::create_dir_all(&plugins_dir);
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&plugins_dir)
            .spawn()
            .map_err(|e| format!("Fehler beim Öffnen des Explorers: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&plugins_dir)
            .spawn()
            .map_err(|e| format!("Fehler beim Öffnen des Finders: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&plugins_dir)
            .spawn()
            .map_err(|e| format!("Fehler beim Öffnen des Dateimanagers: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn plugin_save_installed_files(
    app: tauri::AppHandle,
    plugin_id: String,
    manifest_json: String,
    main_js: String,
    styles_css: String,
) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let plugin_dir = app_data_dir.join("plugins").join(&plugin_id);
    fs::create_dir_all(&plugin_dir).map_err(|e| e.to_string())?;

    fs::write(plugin_dir.join("manifest.json"), manifest_json).map_err(|e| e.to_string())?;
    fs::write(plugin_dir.join("main.js"), main_js).map_err(|e| e.to_string())?;
    if !styles_css.is_empty() {
        let _ = fs::write(plugin_dir.join("styles.css"), styles_css);
    }
    Ok(())
}

#[tauri::command]
fn plugin_delete_installed(app: tauri::AppHandle, plugin_id: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let plugin_dir = app_data_dir.join("plugins").join(&plugin_id);
    if plugin_dir.exists() {
        fs::remove_dir_all(&plugin_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn window_minimize(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_is_maximized(window: tauri::Window) -> Result<bool, String> {
    window.is_maximized().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_toggle_maximize(window: tauri::Window) -> Result<bool, String> {
    if window.is_maximized().map_err(|e| e.to_string())? {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn window_close(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_open_dm_popout(app: tauri::AppHandle, peer_ain: String, peer_name: String) -> Result<(), String> {
    let safe_label = format!("dm_popout_{}", peer_ain.chars().filter(|c| c.is_alphanumeric() || *c == '_').collect::<String>());
    
    if let Some(existing_window) = app.get_webview_window(&safe_label) {
        let _ = existing_window.show();
        let _ = existing_window.set_focus();
        return Ok(());
    }

    let enc_ain: String = url::form_urlencoded::byte_serialize(peer_ain.trim().as_bytes()).collect();
    let enc_name: String = url::form_urlencoded::byte_serialize(peer_name.trim().as_bytes()).collect();

    let webview_url = if let Some(main_win) = app.get_webview_window("main") {
        if let Ok(mut u) = main_win.url() {
            u.set_query(Some(&format!("popout=dm&peerAin={}&peerName={}", enc_ain, enc_name)));
            tauri::WebviewUrl::External(u)
        } else {
            tauri::WebviewUrl::App(format!("index.html?popout=dm&peerAin={}&peerName={}", enc_ain, enc_name).into())
        }
    } else {
        tauri::WebviewUrl::App(format!("index.html?popout=dm&peerAin={}&peerName={}", enc_ain, enc_name).into())
    };

    let builder = tauri::WebviewWindowBuilder::new(
        &app,
        &safe_label,
        webview_url,
    )
    .title(format!("Zeno — @{}", peer_name))
    .inner_size(520.0, 720.0)
    .min_inner_size(380.0, 480.0)
    .decorations(false)
    .resizable(true);

    builder.build().map_err(|e| format!("Fehler beim Erstellen des Popout-Fensters: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            window_minimize,
            window_is_maximized,
            window_toggle_maximize,
            window_close,
            window_open_dm_popout,
            greet,
            get_git_status,
            get_git_log,
            git_server_get_status,
            git_server_commit_and_push,
            git_server_pull,
            git_server_read_manifest,
            git_server_commit_and_push_readme,
            git_server_read_readme,
            list_workspace_files,
            read_workspace_file,
            write_workspace_file,
            delete_workspace_file,
            ide_create_folder,
            ide_open_folder_dialog,
            ide_open_file_dialog,
            ide_read_directory,
            ide_read_file,
            ide_write_file,
            ide_create_file,
            ide_delete_entry,
            ide_rename_entry,
            ide_get_git_status,
            ide_git_stage,
            ide_git_unstage,
            ide_git_discard,
            ide_git_commit,
            ide_git_sync,
            ide_get_system_compilers,
            ide_run_code_native,
            load_settings,
            save_settings,
            export_text_file,
            // Phase 1 Crypto
            crypto_generate_identity,
            crypto_generate_sovereign_identity,
            crypto_import_sovereign_identity,
            crypto_sign_challenge,
            crypto_verify_signature,
            crypto_encrypt_vault,
            crypto_decrypt_vault,
            // Phase 2 Database
            db_save_identity,
            db_get_active_identity,
            db_get_all_identities,
            db_set_active_identity,
            db_delete_identity,
            db_save_server,
            db_get_servers,
            db_delete_server,
            db_save_message,
            db_get_channel_messages,
            db_delete_message,
            db_delete_message_by_id,
            // Phase 3 Voice & Network
            voice_join,
            voice_leave,
            voice_set_mute,
            voice_set_deafen,
            voice_update_speaking,
            voice_send_signal,
            voice_get_status,
            network_broadcast_message,
            // Phase 3 Plugins
            plugin_open_folder,
            plugin_save_installed_files,
            plugin_delete_installed
        ])
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
            if !app_data_dir.exists() {
                let _ = fs::create_dir_all(&app_data_dir);
            }
            let db_path = app_data_dir.join("zeno.db");
            match db::DbState::new(&db_path) {
                Ok(db_state) => {
                    app.manage(db_state);
                }
                Err(e) => {
                    eprintln!("Warnung: SQLite konnte nicht initialisiert werden: {}", e);
                }
            }
            app.manage(voice_network::VoiceNetworkState::new());

            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
