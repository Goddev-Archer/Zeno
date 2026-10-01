import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  audioStreamService,
  AudioSettingsConfig,
  AudioDeviceInfo
} from "../../services/audioStreamService";
import { ZeitschattenVoiceHalo } from "../common/ZeitschattenVoiceHalo";

interface AudioSettingsTabProps {
  showToast: (msg: string) => void;
}

export const AudioSettingsTab: React.FC<AudioSettingsTabProps> = ({ showToast }) => {
  const [config, setConfig] = useState<AudioSettingsConfig>(audioStreamService.getConfig());
  const [devices, setDevices] = useState<{ inputs: AudioDeviceInfo[]; outputs: AudioDeviceInfo[] }>({
    inputs: [],
    outputs: []
  });
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(audioStreamService.getIsTestingMic());

  // Load available audio devices
  useEffect(() => {
    const loadDevices = async () => {
      const dev = await audioStreamService.getAvailableDevices();
      setDevices(dev);
    };
    loadDevices();

    // Listen to media device changes (plug/unplug headset)
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = loadDevices;
    }
  }, []);

  // Listen to live audio levels
  useEffect(() => {
    const unsubLevel = audioStreamService.onAudioLevel((rms, speaking) => {
      setCurrentLevel(rms);
      setIsSpeaking(speaking);
    });

    return () => {
      unsubLevel();
      if (audioStreamService.getIsTestingMic()) {
        audioStreamService.stopMicTest();
      }
    };
  }, []);

  const handleUpdate = (partial: Partial<AudioSettingsConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    audioStreamService.saveConfig(partial);
  };

  const handleToggleMicTest = async () => {
    const active = await audioStreamService.toggleMicTest();
    setIsTesting(active);
    if (active) {
      showToast("Mikrofon-Test aktiv: Sprich jetzt in dein Headset 🎙️");
    } else {
      showToast("Mikrofon-Test beendet.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#FFF", display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon icon="mage:volume-up" style={{ color: "#00FF87" }} />
          Sprache &amp; Audio-Einstellungen
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
          Konfiguriere dein Mikrofon, Geräuschunterdrückung, Echo-Test und Sprachaktivierung.
        </p>
      </div>

      {/* Device Selection Card */}
      <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#00FF87", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Geräteauswahl
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {/* Input Device */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
              EINGABEGERÄT (MIKROFON)
            </label>
            <select
              value={config.inputDeviceId}
              onChange={(e) => handleUpdate({ inputDeviceId: e.target.value })}
              style={{
                width: "100%",
                backgroundColor: "#161922",
                border: "1px solid #262933",
                color: "#FFF",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "12px",
                outline: "none"
              }}
            >
              <option value="">Standard-Mikrofon des Systems</option>
              {devices.inputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Output Device */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
              AUSGABEGERÄT (LAUTSPRECHER / HEADSET)
            </label>
            <select
              value={config.outputDeviceId}
              onChange={(e) => handleUpdate({ outputDeviceId: e.target.value })}
              style={{
                width: "100%",
                backgroundColor: "#161922",
                border: "1px solid #262933",
                color: "#FFF",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "12px",
                outline: "none"
              }}
            >
              <option value="">Standard-Ausgabe des Systems</option>
              {devices.outputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Volume Sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "4px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginBottom: "4px" }}>
              <span>Eingangslautstärke (Gain)</span>
              <span style={{ color: "#00FF87", fontWeight: "700" }}>{Math.round(config.inputVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.05"
              value={config.inputVolume}
              onChange={(e) => handleUpdate({ inputVolume: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#00FF87" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginBottom: "4px" }}>
              <span>Ausgabelautstärke</span>
              <span style={{ color: "#38BDF8", fontWeight: "700" }}>{Math.round(config.outputVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.outputVolume}
              onChange={(e) => handleUpdate({ outputVolume: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#38BDF8" }}
            />
          </div>
        </div>
      </div>

      {/* Live Mic Test & Zeitschatten Visualizer */}
      <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Mikrofon-Test &amp; Pegelüberwachung
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
              Prüfe deine Audio-Latenz und Klangqualität direkt über deine Kopfhörer.
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleMicTest}
            style={{
              backgroundColor: isTesting ? "#EF4444" : "#1E222D",
              color: "#FFF",
              border: isTesting ? "1px solid #DC2626" : "1px solid #262933",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Icon icon={isTesting ? "mage:stop" : "mage:play"} />
            {isTesting ? "Test beenden" : "Mikrofon testen (Echo)"}
          </button>
        </div>

        {/* Live Audio Level Meter with VAD Cutoff Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", backgroundColor: "#060709", border: "1px solid #1A1D24", padding: "12px", borderRadius: "8px" }}>
          {/* Zeitschatten Halo Icon */}
          <ZeitschattenVoiceHalo isSpeaking={isSpeaking} audioLevel={currentLevel} size={36}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: isSpeaking ? "#00FF87" : "#1E222D",
                color: isSpeaking ? "#08090C" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                transition: "all 0.15s ease"
              }}
            >
              <Icon icon={isSpeaking ? "mage:microphone" : "mage:microphone-mute"} />
            </div>
          </ZeitschattenVoiceHalo>

          {/* LED Level Bar */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94A3B8" }}>
              <span>Eingangspegel (RMS)</span>
              <span style={{ color: isSpeaking ? "#00FF87" : "#64748B", fontWeight: "700" }}>
                {isSpeaking ? "SPRICHT (VAD AKTIV)" : "RUHE"}
              </span>
            </div>

            <div style={{ position: "relative", height: "14px", backgroundColor: "#12141A", borderRadius: "4px", overflow: "hidden", border: "1px solid #262933" }}>
              {/* Dynamic volume fill */}
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(currentLevel * 100, 100)}%`,
                  backgroundColor: currentLevel > 0.8 ? "#EF4444" : currentLevel > 0.4 ? "#00FF87" : "#38BDF8",
                  transition: "width 0.05s ease-out",
                  borderRadius: "3px"
                }}
              />
              {/* VAD Threshold marker line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${Math.min(config.vadThreshold * 100 * 2.2, 95)}%`,
                  width: "2px",
                  backgroundColor: "#F59E0B",
                  boxShadow: "0 0 6px #F59E0B"
                }}
                title={`VAD-Schwelle: ${Math.round(config.vadThreshold * 100)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input Mode: VAD vs PTT */}
      <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#A855F7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Eingabemodus
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            onClick={() => handleUpdate({ inputMode: "vad" })}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: config.inputMode === "vad" ? "1px solid #00FF87" : "1px solid #262933",
              backgroundColor: config.inputMode === "vad" ? "rgba(0, 255, 135, 0.08)" : "#161922",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "13px", color: config.inputMode === "vad" ? "#00FF87" : "#FFF" }}>
              <Icon icon="mage:waveform" /> Sprachaktivierung (VAD)
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
              Überträgt automatisch deine Stimme, sobald der Pegel die gelbe Schwelle überschreitet.
            </div>
          </div>

          <div
            onClick={() => handleUpdate({ inputMode: "ptt" })}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: config.inputMode === "ptt" ? "1px solid #38BDF8" : "1px solid #262933",
              backgroundColor: config.inputMode === "ptt" ? "rgba(56, 189, 248, 0.08)" : "#161922",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "13px", color: config.inputMode === "ptt" ? "#38BDF8" : "#FFF" }}>
              <Icon icon="mage:hand-grab" /> Push-to-Talk (PTT)
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
              Halte die [Leertaste] gedrückt, während du sprichst.
            </div>
          </div>
        </div>

        {/* VAD Sensitivity Slider */}
        {config.inputMode === "vad" && (
          <div style={{ marginTop: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginBottom: "4px" }}>
              <span>Empfindlichkeit der Sprachaktivierung (VAD-Schwelle)</span>
              <span style={{ color: "#F59E0B", fontWeight: "700" }}>{Math.round(config.vadThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.25"
              step="0.005"
              value={config.vadThreshold}
              onChange={(e) => handleUpdate({ vadThreshold: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#F59E0B" }}
            />
            <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>
              Tipp: Schiebe den Regler nach links für leisere Stimmen oder nach rechts, um Tastaturgeklapper herauszufiltern.
            </div>
          </div>
        )}
      </div>

      {/* Advanced Audio Filters */}
      <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Erweiterte Audioverarbeitung
        </div>

        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
          <span>Echo-Unterdrückung (AEC)</span>
          <input
            type="checkbox"
            checked={config.echoCancellation}
            onChange={(e) => handleUpdate({ echoCancellation: e.target.checked })}
            style={{ width: "16px", height: "16px", accentColor: "#00FF87" }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
          <span>Rauschunterdrückung (Noise Suppression)</span>
          <input
            type="checkbox"
            checked={config.noiseSuppression}
            onChange={(e) => handleUpdate({ noiseSuppression: e.target.checked })}
            style={{ width: "16px", height: "16px", accentColor: "#00FF87" }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
          <span>Automatische Verstärkung (AGC)</span>
          <input
            type="checkbox"
            checked={config.autoGainControl}
            onChange={(e) => handleUpdate({ autoGainControl: e.target.checked })}
            style={{ width: "16px", height: "16px", accentColor: "#00FF87" }}
          />
        </label>
      </div>
    </div>
  );
};
