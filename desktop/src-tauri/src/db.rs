// --- ZENO PERSISTENT SQLITE DATABASE MODULE (RUST BACKEND) ---
// High-performance offline storage for servers, channels, messages, and identities.

use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbServerRecord {
    pub id: String,
    pub name: String,
    pub icon_letter: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub encrypted: bool,
    pub owner_ain: Option<String>,
    pub manifest_url: Option<String>,
    pub git_repo_json: Option<String>,
    pub categories_json: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbMessageRecord {
    pub id: Option<i64>,
    pub channel_id: String,
    pub author: String,
    pub text: String,
    pub time: String,
    pub color: String,
    pub code: Option<String>,
    pub attachment_json: Option<String>,
    pub created_at: String,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(db_path: &Path) -> Result<Self, String> {
        let conn = Connection::open(db_path)
            .map_err(|e| format!("Fehler beim Öffnen der SQLite-Datenbank: {}", e))?;
        
        init_schema(&conn)
            .map_err(|e| format!("Fehler beim Initialisieren des Datenbankschemas: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}

fn init_schema(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS servers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon_letter TEXT NOT NULL,
            icon TEXT,
            description TEXT,
            encrypted INTEGER DEFAULT 1,
            owner_ain TEXT,
            manifest_url TEXT,
            git_repo_json TEXT,
            categories_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT NOT NULL,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            time TEXT NOT NULL,
            color TEXT NOT NULL,
            code TEXT,
            attachment_json TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, id DESC);

        CREATE TABLE IF NOT EXISTS identities (
            ain TEXT PRIMARY KEY,
            public_key_hex TEXT NOT NULL,
            private_key_encrypted_hex TEXT,
            fingerprint TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        ",
    )?;
    Ok(())
}

// --- SERVER OPERATIONS ---

pub fn insert_or_update_server(conn: &Connection, srv: &DbServerRecord) -> Result<(), String> {
    conn.execute(
        "INSERT INTO servers (id, name, icon_letter, icon, description, encrypted, owner_ain, manifest_url, git_repo_json, categories_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
         ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            icon_letter=excluded.icon_letter,
            icon=excluded.icon,
            description=excluded.description,
            encrypted=excluded.encrypted,
            owner_ain=excluded.owner_ain,
            manifest_url=excluded.manifest_url,
            git_repo_json=excluded.git_repo_json,
            categories_json=excluded.categories_json;",
        params![
            srv.id,
            srv.name,
            srv.icon_letter,
            srv.icon,
            srv.description,
            if srv.encrypted { 1 } else { 0 },
            srv.owner_ain,
            srv.manifest_url,
            srv.git_repo_json,
            srv.categories_json,
            srv.created_at,
        ],
    ).map_err(|e| format!("SQLite Insert Error: {}", e))?;
    Ok(())
}

pub fn fetch_all_servers(conn: &Connection) -> Result<Vec<DbServerRecord>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, icon_letter, icon, description, encrypted, owner_ain, manifest_url, git_repo_json, categories_json, created_at FROM servers ORDER BY rowid ASC")
        .map_err(|e| format!("SQLite Query Error: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let enc_int: i32 = row.get(5)?;
            Ok(DbServerRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                icon_letter: row.get(2)?,
                icon: row.get(3)?,
                description: row.get(4)?,
                encrypted: enc_int == 1,
                owner_ain: row.get(6)?,
                manifest_url: row.get(7)?,
                git_repo_json: row.get(8)?,
                categories_json: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| format!("SQLite Map Error: {}", e))?;

    let mut result = Vec::new();
    for r in rows {
        if let Ok(srv) = r {
            result.push(srv);
        }
    }
    Ok(result)
}

pub fn remove_server(conn: &Connection, server_id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM servers WHERE id = ?1", params![server_id])
        .map_err(|e| format!("SQLite Delete Error: {}", e))?;
    Ok(())
}

// --- MESSAGE OPERATIONS ---

pub fn insert_message(conn: &Connection, msg: &DbMessageRecord) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO messages (channel_id, author, text, time, color, code, attachment_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            msg.channel_id,
            msg.author,
            msg.text,
            msg.time,
            msg.color,
            msg.code,
            msg.attachment_json,
            msg.created_at,
        ],
    ).map_err(|e| format!("SQLite Message Insert Error: {}", e))?;
    Ok(conn.last_insert_rowid())
}

pub fn fetch_channel_messages(
    conn: &Connection,
    channel_id: &str,
    limit: usize,
    offset: usize,
) -> Result<Vec<DbMessageRecord>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, channel_id, author, text, time, color, code, attachment_json, created_at
             FROM messages WHERE channel_id = ?1
             ORDER BY id ASC LIMIT ?2 OFFSET ?3",
        )
        .map_err(|e| format!("SQLite Query Error: {}", e))?;

    let rows = stmt
        .query_map(params![channel_id, limit, offset], |row| {
            Ok(DbMessageRecord {
                id: Some(row.get(0)?),
                channel_id: row.get(1)?,
                author: row.get(2)?,
                text: row.get(3)?,
                time: row.get(4)?,
                color: row.get(5)?,
                code: row.get(6)?,
                attachment_json: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| format!("SQLite Map Error: {}", e))?;

    let mut result = Vec::new();
    for r in rows {
        if let Ok(msg) = r {
            result.push(msg);
        }
    }
    Ok(result)
}
