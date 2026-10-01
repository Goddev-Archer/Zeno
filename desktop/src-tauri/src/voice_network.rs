// --- ZENO VOICE & RELAY NETWORK CORE MODULE (RUST BACKEND) ---
// Manages Voice Channel Sessions, WebRTC Signaling State, Mute/Deafen controls,
// Speaking state detection, and Audio Relay Message Broadcasting via Tauri Events.

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
    pub is_speaking: bool,
    pub input_level: f32,
    pub active_speakers: Vec<String>,
    pub connected_users: Vec<String>,
    pub ping_ms: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceSignalPayload {
    pub channel_id: String,
    pub sender: String,
    pub target: Option<String>,
    pub signal_type: String, // "offer" | "answer" | "ice_candidate" | "speaking"
    pub data: String,
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
                is_speaking: false,
                input_level: 0.0,
                active_speakers: Vec::new(),
                connected_users: Vec::new(),
                ping_ms: 14,
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
    session.is_speaking = false;
    session.input_level = 0.0;
    
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
    session.is_speaking = false;
    session.input_level = 0.0;
    session.active_speakers.clear();
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
    if muted {
        session.is_speaking = false;
        if let Some(u) = session.user_name.clone() {
            session.active_speakers.retain(|x| x != &u);
        }
    }

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
        session.is_speaking = false;
        if let Some(u) = session.user_name.clone() {
            session.active_speakers.retain(|x| x != &u);
        }
    }

    let cloned = session.clone();
    let _ = app.emit("zeno://voice_state_changed", &cloned);
    Ok(cloned)
}

pub fn update_speaking(
    app: &AppHandle,
    state: &VoiceNetworkState,
    is_speaking: bool,
    input_level: f32,
) -> Result<VoiceSessionStatus, String> {
    let mut session = state.session.lock().map_err(|e| e.to_string())?;
    session.is_speaking = is_speaking;
    session.input_level = input_level;

    if let Some(u) = session.user_name.clone() {
        if is_speaking {
            if !session.active_speakers.contains(&u) {
                session.active_speakers.push(u);
            }
        } else {
            session.active_speakers.retain(|x| x != &u);
        }
    }

    let cloned = session.clone();
    let _ = app.emit("zeno://voice_state_changed", &cloned);
    Ok(cloned)
}

pub fn broadcast_voice_signal(
    app: &AppHandle,
    signal: VoiceSignalPayload,
) -> Result<(), String> {
    let _ = app.emit("zeno://voice_signal", &signal);
    Ok(())
}

pub fn get_voice_status(state: &VoiceNetworkState) -> Result<VoiceSessionStatus, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    Ok(session.clone())
}
