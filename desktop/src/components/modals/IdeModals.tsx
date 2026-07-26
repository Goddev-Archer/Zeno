import React from "react";
import { Icon } from "@iconify/react";

interface IdeProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleIdeGenerateProject: (type: "rust" | "go" | "python" | "web") => void;
}

export const IdeProjectWizardModal: React.FC<IdeProjectWizardModalProps> = ({
  isOpen,
  onClose,
  handleIdeGenerateProject
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="zeno-dialog-modal" style={{ width: "600px", height: "auto", borderRadius: "12px", padding: "24px", position: "relative" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
            Neues Projekt generieren
          </h3>
          <button className="editor-close-btn modal-close" onClick={onClose}>
            <Icon icon="mage:multiply" />
          </button>
        </header>

        <p className="settings-help-text" style={{ marginBottom: "14px" }}>
          Wähle eine Projektvorlage. Alle Dateien werden in deinem virtuellen Zeno-Workspace generiert und können direkt ausgeführt werden.
        </p>

        <div className="ide-wizard-grid">
          <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("rust")}>
            <Icon icon="vscode-icons:file-type-rust" className="ide-wizard-card-icon" />
            <div className="ide-wizard-card-details">
              <h4>Rust Cargo App</h4>
              <p>Erstellt Cargo.toml und src/main.rs mit Print-Ausgaben.</p>
            </div>
          </div>

          <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("go")}>
            <Icon icon="vscode-icons:file-type-go" className="ide-wizard-card-icon" />
            <div className="ide-wizard-card-details">
              <h4>Go Module App</h4>
              <p>Erstellt go.mod und main.go mit fmt-Paket.</p>
            </div>
          </div>

          <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("python")}>
            <Icon icon="vscode-icons:file-type-python" className="ide-wizard-card-icon" />
            <div className="ide-wizard-card-details">
              <h4>Python App</h4>
              <p>Erstellt main.py und requirements.txt.</p>
            </div>
          </div>

          <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("web")}>
            <Icon icon="vscode-icons:file-type-html" className="ide-wizard-card-icon" />
            <div className="ide-wizard-card-details">
              <h4>Static Web App</h4>
              <p>Template mit index.html, style.css und script.js.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button className="settings-btn" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

interface IdeNewItemModalProps {
  isOpen: boolean;
  ideNewItemType: "file" | "folder";
  ideNewItemParentPath: string;
  ideNewItemName: string;
  onClose: () => void;
  setIdeNewItemName: (name: string) => void;
  handleIdeFileCreate: () => void;
  handleIdeFolderCreate: () => void;
}

export const IdeNewItemModal: React.FC<IdeNewItemModalProps> = ({
  isOpen,
  ideNewItemType,
  ideNewItemParentPath,
  ideNewItemName,
  onClose,
  setIdeNewItemName,
  handleIdeFileCreate,
  handleIdeFolderCreate
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="zeno-dialog-modal" style={{ width: "400px", height: "auto", borderRadius: "12px", padding: "20px", position: "relative" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
            {ideNewItemType === "file" ? "Neue Datei erstellen" : "Neuer Ordner erstellen"}
          </h3>
          <button className="editor-close-btn modal-close" onClick={onClose}>
            <Icon icon="mage:multiply" />
          </button>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ideNewItemParentPath && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "4px" }}>
              <span>Speicherort:</span>
              <code style={{ color: "var(--accent-color)" }}>/{ideNewItemParentPath}</code>
            </div>
          )}

          <div>
            <label style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              NAME
            </label>
            <input
              type="text"
              className="settings-input"
              placeholder={ideNewItemType === "file" ? "z. B. main.rs oder index.js" : "z. B. src oder assets"}
              value={ideNewItemName}
              onChange={(e) => setIdeNewItemName(e.target.value)}
              style={{ width: "100%", maxWidth: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (ideNewItemType === "file") handleIdeFileCreate();
                  else handleIdeFolderCreate();
                }
              }}
              autoFocus
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button className="settings-btn" onClick={onClose}>
              Abbrechen
            </button>
            <button
              className="settings-btn primary"
              onClick={() => {
                if (ideNewItemType === "file") handleIdeFileCreate();
                else handleIdeFolderCreate();
              }}
            >
              Erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
