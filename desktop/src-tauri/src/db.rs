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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbIdentityRecord {
    pub ain: String,
    pub username: String,
    pub public_key_hex: String,
    pub private_key_encrypted_hex: Option<String>,
    pub mnemonic: Option<String>,
    pub fingerprint: String,
    pub is_active: bool,
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
            username TEXT NOT NULL DEFAULT 'CipherNaut',
            public_key_hex TEXT NOT NULL,
            private_key_encrypted_hex TEXT,
            mnemonic TEXT,
            fingerprint TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );
        ",
    )?;

    // Safe column migrations in case identities table was created previously without these columns
    let _ = conn.execute("ALTER TABLE identities ADD COLUMN username TEXT NOT NULL DEFAULT 'CipherNaut'", []);
    let _ = conn.execute("ALTER TABLE identities ADD COLUMN mnemonic TEXT", []);
    let _ = conn.execute("ALTER TABLE identities ADD COLUMN is_active INTEGER DEFAULT 1", []);

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

pub fn remove_message(conn: &Connection, channel_id: &str, text: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM messages WHERE channel_id = ?1 AND text = ?2",
        params![channel_id, text],
    ).map_err(|e| format!("SQLite Message Delete Error: {}", e))?;
    Ok(())
}

// --- IDENTITY OPERATIONS ---

pub fn insert_or_update_identity(conn: &Connection, idn: &DbIdentityRecord) -> Result<(), String> {
    if idn.is_active {
        let _ = conn.execute("UPDATE identities SET is_active = 0", []);
    }

    conn.execute(
        "INSERT INTO identities (ain, username, public_key_hex, private_key_encrypted_hex, mnemonic, fingerprint, is_active, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(ain) DO UPDATE SET
            username=excluded.username,
            public_key_hex=excluded.public_key_hex,
            private_key_encrypted_hex=excluded.private_key_encrypted_hex,
            mnemonic=excluded.mnemonic,
            fingerprint=excluded.fingerprint,
            is_active=excluded.is_active;",
        params![
            idn.ain,
            idn.username,
            idn.public_key_hex,
            idn.private_key_encrypted_hex,
            idn.mnemonic,
            idn.fingerprint,
            if idn.is_active { 1 } else { 0 },
            idn.created_at,
        ],
    ).map_err(|e| format!("SQLite Identity Insert Error: {}", e))?;
    Ok(())
}

pub fn fetch_active_identity(conn: &Connection) -> Result<Option<DbIdentityRecord>, String> {
    let mut stmt = conn
        .prepare("SELECT ain, username, public_key_hex, private_key_encrypted_hex, mnemonic, fingerprint, is_active, created_at FROM identities WHERE is_active = 1 LIMIT 1")
        .map_err(|e| format!("SQLite Query Error: {}", e))?;

    let mut rows = stmt
        .query_map([], |row| {
            let active_int: i32 = row.get(6)?;
            Ok(DbIdentityRecord {
                ain: row.get(0)?,
                username: row.get(1)?,
                public_key_hex: row.get(2)?,
                private_key_encrypted_hex: row.get(3)?,
                mnemonic: row.get(4)?,
                fingerprint: row.get(5)?,
                is_active: active_int == 1,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("SQLite Map Error: {}", e))?;

    if let Some(res) = rows.next() {
        return res.map(Some).map_err(|e| format!("SQLite Row Error: {}", e));
    }

    // Fallback: if no active one, return the latest identity
    let mut stmt_fallback = conn
        .prepare("SELECT ain, username, public_key_hex, private_key_encrypted_hex, mnemonic, fingerprint, is_active, created_at FROM identities ORDER BY rowid DESC LIMIT 1")
        .map_err(|e| format!("SQLite Fallback Query Error: {}", e))?;

    let mut fallback_rows = stmt_fallback
        .query_map([], |row| {
            let active_int: i32 = row.get(6)?;
            Ok(DbIdentityRecord {
                ain: row.get(0)?,
                username: row.get(1)?,
                public_key_hex: row.get(2)?,
                private_key_encrypted_hex: row.get(3)?,
                mnemonic: row.get(4)?,
                fingerprint: row.get(5)?,
                is_active: active_int == 1,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("SQLite Fallback Map Error: {}", e))?;

    if let Some(res) = fallback_rows.next() {
        return res.map(Some).map_err(|e| format!("SQLite Row Error: {}", e));
    }

    Ok(None)
}

pub fn fetch_all_identities(conn: &Connection) -> Result<Vec<DbIdentityRecord>, String> {
    let mut stmt = conn
        .prepare("SELECT ain, username, public_key_hex, private_key_encrypted_hex, mnemonic, fingerprint, is_active, created_at FROM identities ORDER BY is_active DESC, rowid DESC")
        .map_err(|e| format!("SQLite Identities Query Error: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let active_int: i32 = row.get(6)?;
            Ok(DbIdentityRecord {
                ain: row.get(0)?,
                username: row.get(1)?,
                public_key_hex: row.get(2)?,
                private_key_encrypted_hex: row.get(3)?,
                mnemonic: row.get(4)?,
                fingerprint: row.get(5)?,
                is_active: active_int == 1,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("SQLite Identities Map Error: {}", e))?;

    let mut result = Vec::new();
    for r in rows {
        if let Ok(id) = r {
            result.push(id);
        }
    }
    Ok(result)
}

pub fn set_active_identity(conn: &Connection, ain: &str) -> Result<(), String> {
    conn.execute("UPDATE identities SET is_active = 0", [])
        .map_err(|e| format!("SQLite Update Error: {}", e))?;
    conn.execute("UPDATE identities SET is_active = 1 WHERE ain = ?1", params![ain])
        .map_err(|e| format!("SQLite Update Error: {}", e))?;
    Ok(())
}

pub fn remove_identity(conn: &Connection, ain: &str) -> Result<(), String> {
    conn.execute("DELETE FROM identities WHERE ain = ?1", params![ain])
        .map_err(|e| format!("SQLite Delete Error: {}", e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().expect("In-memory SQLite DB open must succeed");
        init_schema(&conn).expect("Table initialization must succeed");
        conn
    }

    #[test]
    fn test_identity_storage_and_active_switch() {
        let conn = setup_test_db();

        let id1 = DbIdentityRecord {
            ain: "ZENO-1111-2222-3333".to_string(),
            username: "Alice".to_string(),
            public_key_hex: "PUB1".to_string(),
            private_key_encrypted_hex: Some("PRIV1".to_string()),
            mnemonic: Some("word one two three four five six seven eight nine ten eleven".to_string()),
            fingerprint: "SHA256:11:22".to_string(),
            is_active: true,
            created_at: "2026-10-01Z".to_string(),
        };

        let id2 = DbIdentityRecord {
            ain: "ZENO-4444-5555-6666".to_string(),
            username: "Bob".to_string(),
            public_key_hex: "PUB2".to_string(),
            private_key_encrypted_hex: Some("PRIV2".to_string()),
            mnemonic: Some("word apple banana cherry dog elephant fox grape horse igloo jaguar kangaroo".to_string()),
            fingerprint: "SHA256:44:55".to_string(),
            is_active: false,
            created_at: "2026-10-01Z".to_string(),
        };

        insert_or_update_identity(&conn, &id1).expect("Insert Alice must succeed");
        insert_or_update_identity(&conn, &id2).expect("Insert Bob must succeed");

        let active = fetch_active_identity(&conn).expect("Fetch active must succeed");
        assert!(active.is_some());
        assert_eq!(active.unwrap().username, "Alice");

        // Switch active to Bob
        set_active_identity(&conn, &id2.ain).expect("Switch active identity must succeed");
        let active_bob = fetch_active_identity(&conn).expect("Fetch active must succeed").unwrap();
        assert_eq!(active_bob.username, "Bob");
        assert_eq!(active_bob.ain, id2.ain);

        let all = fetch_all_identities(&conn).expect("Fetch all must succeed");
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_server_and_message_persistence() {
        let conn = setup_test_db();

        let srv = DbServerRecord {
            id: "srv-alpha".to_string(),
            name: "Zeno Core Alpha".to_string(),
            icon_letter: "Z".to_string(),
            icon: None,
            description: Some("Decentralized Test Node".to_string()),
            encrypted: true,
            owner_ain: Some("ZENO-1111-2222-3333".to_string()),
            manifest_url: None,
            git_repo_json: None,
            categories_json: "[]".to_string(),
            created_at: "2026-10-01Z".to_string(),
        };

        insert_or_update_server(&conn, &srv).expect("Insert server must succeed");
        let servers = fetch_all_servers(&conn).expect("Fetch servers must succeed");
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].name, "Zeno Core Alpha");

        let msg = DbMessageRecord {
            id: None,
            channel_id: "ch-general".to_string(),
            author: "CipherNaut".to_string(),
            text: "Hello Zeno Decentralized Mesh!".to_string(),
            time: "14:00".to_string(),
            color: "purple".to_string(),
            code: None,
            attachment_json: None,
            created_at: "2026-10-01Z".to_string(),
        };

        let msg_id = insert_message(&conn, &msg).expect("Insert message must succeed");
        assert!(msg_id > 0);

        let fetched_msgs = fetch_channel_messages(&conn, "ch-general", 10, 0).expect("Fetch messages must succeed");
        assert_eq!(fetched_msgs.len(), 1);
        assert_eq!(fetched_msgs[0].text, "Hello Zeno Decentralized Mesh!");
    }
}
