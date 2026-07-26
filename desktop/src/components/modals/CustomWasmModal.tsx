import React from "react";
import { Icon } from "@iconify/react";

interface CustomWasmModalProps {
  isOpen: boolean;
  customWasmName: string;
  customWasmUrl: string;
  onClose: () => void;
  setCustomWasmName: (name: string) => void;
  setCustomWasmUrl: (url: string) => void;
  onRegister: () => void;
}

export const CustomWasmModal: React.FC<CustomWasmModalProps> = ({
  isOpen,
  customWasmName,
  customWasmUrl,
  onClose,
  setCustomWasmName,
  setCustomWasmUrl,
  onRegister
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="zeno-dialog-modal" style={{ width: "500px", height: "auto", minHeight: "340px", borderRadius: "12px", padding: "24px", position: "relative" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
            Eigene WASM-Laufzeit einbinden
          </h3>
          <button className="editor-close-btn modal-close" onClick={onClose}>
            <Icon icon="mage:multiply" />
          </button>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p className="settings-help-text">
            Binde ein benutzerdefiniertes `.wasm` Paket von deiner eigenen URL oder der WAPM-Registry ein. Die Laufzeit wird isoliert in der WASI-Sandbox ausgeführt.
          </p>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              SPRACH-NAME / TITEL
            </label>
            <input
              type="text"
              className="settings-input"
              placeholder="z. B. Elixir Engine (WASI)"
              value={customWasmName}
              onChange={(e) => setCustomWasmName(e.target.value)}
              style={{ width: "100%", maxWidth: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              WASM-BINARY URL (.wasm)
            </label>
            <input
              type="text"
              className="settings-input"
              placeholder="https://wapm.io/download/elixir/elixir.wasm"
              value={customWasmUrl}
              onChange={(e) => setCustomWasmUrl(e.target.value)}
              style={{ width: "100%", maxWidth: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button className="settings-btn" onClick={onClose}>
              Abbrechen
            </button>
            <button className="settings-btn primary" onClick={onRegister}>
              Laufzeit Registrieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
