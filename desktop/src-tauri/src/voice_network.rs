// --- ZENO VOICE & RELAY NETWORK CORE MODULE (RUST BACKEND) ---
// Manages Voice Channel Sessions, SFrame Signaling State, Mute/Deafen controls,
// and Relay Message Broadcasting via Tauri Events.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceSessionStatus {
    pub is_connected: bool,
    pub channel_id: Option<String>,
    pub channel_name: Option<String>,
    pub user_name: Option<String>,
    pub is_muted: bool,
    pub is_deafened: bool,
    pub connected_users: Vec<String>,
    pub ping_ms: u32,
}

pub struct VoiceNetworkState {
    pub session: Mutex<VoiceSessionStatus>,
}

impl VoiceNetworkState {
    pub fn new() -> Self {
        Self {
            session: Mutex::new(VoiceSessionStatus {
                is_connected: false,
                channel_id: None,
                channel_name: None,
                user_name: None,
                is_muted: false,
                is_deafened: false,
                connected_users: Vec::new(),
                ping_ms: 18,
            }),
        }
    }
}

pub fn join_voice_channel(
    app: &AppHandle,
    state: &VoiceNetworkState,
    channel_id: String,
    channel_name: String,
    user_name: String,
) -> Result<VoiceSessionStatus, String> {
    let mut session = state.session.lock().map_err(|e| e.to_string())?;
    session.is_connected = true;
    session.channel_id = Some(channel_id);
    session.channel_name = Some(channel_name);
    session.user_name = Some(user_name.clone());
    
    // Add current user if not in list
    if !session.connected_users.contains(&user_name) {
        session.connected_users.push(user_name);
    }

    let cloned = session.clone();
    let _ = app.emit("zeno://voice_state_changed", &cloned);
    Ok(cloned)
}

pub fn leave_voice_channel(
    app: &AppHandle,
    state: &VoiceNetworkState,
) -> Result<VoiceSessionStatus, String> {
    let mut session = state.session.lock().map_err(|e| e.to_string())?;
    session.is_connected = false;
    session.channel_id = None;
    session.channel_name = None;
    session.connected_users.clear();

    let cloned = session.clone();
    let _ = app.emit("zeno://voice_state_changed", &cloned);
    Ok(cloned)
}

pub fn toggle_mute(
    app: &AppHandle,
    state: &VoiceNetworkState,
    muted: bool,
) -> Result<VoiceSessionStatus, String> {
    let mut session = state.session.lock().map_err(|e| e.to_string())?;
    session.is_muted = muted;

    let cloned = session.clone();
    let _ = app.emit("zeno://voice_state_changed", &cloned);
    Ok(cloned)
}

pub fn toggle_deafen(
    app: &AppHandle,
    state: &VoiceNetworkState,
    deafened: bool,
) -> Result<VoiceSessionStatus, String> {
    let mut session = state.session.lock().map_err(|e| e.to_string())?;
    session.is_deafened = deafened;
    if deafened {
        session.is_muted = true;
    }

    let cloned = session.clone();
    let _ = app.emit("zeno://voice_state_changed", &cloned);
    Ok(cloned)
}

pub fn get_voice_status(state: &VoiceNetworkState) -> Result<VoiceSessionStatus, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    Ok(session.clone())
}
