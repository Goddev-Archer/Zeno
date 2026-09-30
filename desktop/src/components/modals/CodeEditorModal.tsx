import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import { RecentFile } from "../../types";
import { MarkdownReader } from "../common/MarkdownReader";

interface CodeEditorModalProps {
  isEditorOpen: boolean;
  editorWorkflowStep: "select_action" | "input_filename" | "editor";
  recentFiles: RecentFile[];
  editorFilename: string;
  editorLanguage: string;
  editorCode: string;
  isEditorDirty: boolean;
  isRenaming: boolean;
  editorOutput: string;
  theme: "dark" | "light";
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  setEditorWorkflowStep: (step: "select_action" | "input_filename" | "editor") => void;
  handleOpenFileClick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openWorkspaceFile: (filename: string, language: string) => void;
  removeRecentFileFromHistory: (filename: string) => void;
  createNewWorkspaceFile: (filename: string) => void;
  setIsRenaming: (renaming: boolean) => void;
  handleRenameFile: (newName: string) => void;
  setEditorCode: (code: string) => void;
  setIsEditorDirty: (dirty: boolean) => void;
  setupZenoIntelliSense: (monaco: any) => void;
  handleEditorRun: () => void;
  handleSaveFile: () => void;
  handleSuggestEdit: () => void;
  handleDeleteCurrentFile: () => void;
  showToast: (msg: string) => void;
}

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  isEditorOpen,
  editorWorkflowStep,
  recentFiles,
  editorFilename,
  editorLanguage,
  editorCode,
  isEditorDirty,
  isRenaming,
  editorOutput,
  theme,
  fileInputRef,
  onClose,
  setEditorWorkflowStep,
  handleOpenFileClick,
  handleFileChange,
  openWorkspaceFile,
  removeRecentFileFromHistory,
  createNewWorkspaceFile,
  setIsRenaming,
  handleRenameFile,
  setEditorCode,
  setIsEditorDirty,
  setupZenoIntelliSense,
  handleEditorRun,
  handleSaveFile,
  handleSuggestEdit,
  handleDeleteCurrentFile,
  showToast
}) => {
  const [isMarkdownPreview, setIsMarkdownPreview] = useState<boolean>(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRenaming) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isRenaming]);

  const handleEditorBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme("zeno-dark-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" }
      ],
      colors: {
        "editor.background": "#111214",
        "editor.foreground": "#CCCCCC",
        "editorGutter.background": "#111214",
        "editor.lineHighlightBackground": "#1E1F22",
        "editorCursor.foreground": "#00FF87"
      }
    });

    monaco.editor.defineTheme("zeno-light-theme", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#1C1C1E"
      }
    });
  };

  if (!isEditorOpen) return null;

  return (
    <div className="modal-overlay open" id="editor-modal">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        onChange={handleFileChange} 
      />

      <div className="code-editor-modal">
        {editorWorkflowStep === "select_action" && (
          <div className="editor-onboarding">
            <header className="onboarding-header">
              <h3>Wie möchtest du starten?</h3>
              <button className="editor-close-btn modal-close" onClick={onClose}>
                <Icon icon="mage:multiply" />
              </button>
            </header>
            <div className="onboarding-cards">
              <button className="onboarding-card" onClick={() => setEditorWorkflowStep("input_filename")}>
                <div className="onboarding-card-icon"><Icon icon="mage:plus" /></div>
                <div className="onboarding-card-text">
                  <h4>Neue Datei erstellen</h4>
                  <p>Erstelle ein leeres Dokument und bestimme die Syntax über die Dateiendung.</p>
                </div>
              </button>
              <button className="onboarding-card" onClick={handleOpenFileClick}>
                <div className="onboarding-card-icon"><Icon icon="mage:folder-open" /></div>
                <div className="onboarding-card-text">
                  <h4>Lokale Datei öffnen</h4>
                  <p>Lade ein Dokument von deiner Festplatte in die sichere Ausführungs-Sandbox.</p>
                </div>
              </button>
            </div>

            <div className="recent-files-section">
              <h4>Kürzlich geöffnete Dateien</h4>
              <div className="recent-files-list">
                {recentFiles.map((file) => (
                  <button 
                    key={file.name} 
                    className="recent-file-item"
                    onClick={() => openWorkspaceFile(file.name, file.language)}
                    style={{ position: "relative" }}
                  >
                    <Icon 
                      icon={
                        file.language === "rust" ? "vscode-icons:file-type-rust" :
                        file.language === "python" ? "vscode-icons:file-type-python" :
                        file.language === "csharp" ? "vscode-icons:file-type-csharp" :
                        file.language === "cpp" ? "vscode-icons:file-type-cpp" :
                        file.language === "javascript" ? "vscode-icons:file-type-js" :
                        file.language === "typescript" ? "vscode-icons:file-type-typescript" :
                        file.language === "html" ? "vscode-icons:file-type-html" :
                        file.language === "css" ? "vscode-icons:file-type-css" :
                        file.language === "json" ? "vscode-icons:file-type-json" :
                        "mage:file-records"
                      } 
                      className="recent-file-icon"
                    />
                    <div className="recent-file-details" style={{ flex: 1 }}>
                      <span className="recent-file-name">{file.name}</span>
                      <span className="recent-file-lang">{file.language.toUpperCase()}</span>
                    </div>
                    <span 
                      className="recent-file-delete-btn"
                      onClick={(e) => { e.stopPropagation(); removeRecentFileFromHistory(file.name); }}
                      title="Aus Historie entfernen"
                    >
                      <Icon icon="mage:trash-3" />
                    </span>
                  </button>
                ))}
                {recentFiles.length === 0 && (
                  <p className="no-recent-files">Keine kürzlich geöffneten Dateien.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {editorWorkflowStep === "input_filename" && (
          <div className="editor-filename-input-view">
            <header className="onboarding-header">
              <h3>Neue Datei benennen</h3>
              <button className="editor-close-btn modal-close" onClick={() => setEditorWorkflowStep("select_action")} title="Zurück">
                <Icon icon="mage:arrow-left" />
              </button>
            </header>
            <div className="filename-input-container">
              <p className="settings-help-text">Wähle einen Namen mit Endung (z.B. <code>main.py</code>, <code>index.js</code>, <code>benchmark.rs</code>).</p>
              <input 
                type="text" 
                className="settings-input" 
                placeholder="Dateiname (z.B. main.rs)"
                id="editor-new-filename-field"
                defaultValue="main.rs"
                style={{ width: "100%", margin: "16px 0", maxWidth: "none" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget.value.trim() || "main.rs";
                    createNewWorkspaceFile(input);
                  }
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="settings-btn primary" 
                  onClick={() => {
                    const inputEl = document.getElementById("editor-new-filename-field") as HTMLInputElement;
                    const input = inputEl?.value.trim() || "main.rs";
                    createNewWorkspaceFile(input);
                  }}
                >
                  Erstellen
                </button>
                <button className="settings-btn" onClick={() => setEditorWorkflowStep("select_action")}>
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {editorWorkflowStep === "editor" && (
          <>
            <header className="editor-modal-header">
              <div className="editor-modal-title-area">
                <button 
                  className="settings-btn" 
                  onClick={onClose}
                  style={{ marginRight: "12px", fontSize: "11px", padding: "5px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                  title="IDE verlassen und zum Dashboard zurückkehren (Esc)"
                >
                  <Icon icon="mage:arrow-left" /> Dashboard
                </button>
                {isRenaming ? (
                  <input
                    type="text"
                    className="editor-filename-rename-input"
                    defaultValue={editorFilename}
                    onBlur={(e) => handleRenameFile(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameFile(e.currentTarget.value);
                      } else if (e.key === "Escape") {
                        setIsRenaming(false);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="editor-filename editable" 
                    onClick={() => setIsRenaming(true)}
                    title="Klicke zum Umbenennen"
                  >
                    {editorFilename}
                    {isEditorDirty && <span style={{ color: "var(--glow-color-1, #3574F0)", marginLeft: "6px", fontSize: "10px" }} title="Ungespeicherte Änderungen">●</span>}
                    <Icon icon="mage:edit" className="filename-edit-icon" style={{ marginLeft: "6px", fontSize: "12px", opacity: 0.6 }} />
                  </span>
                )}
                <span className="badge language-badge">{editorLanguage.toUpperCase()}</span>
                {(editorLanguage === "markdown" || editorFilename.toLowerCase().endsWith(".md")) && (
                  <button
                    type="button"
                    onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                    style={{
                      background: isMarkdownPreview ? "rgba(56, 189, 248, 0.15)" : "#1E222D",
                      border: isMarkdownPreview ? "1px solid #38BDF8" : "1px solid #2B303C",
                      color: isMarkdownPreview ? "#38BDF8" : "#94A3B8",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginLeft: "6px"
                    }}
                    title="Zwischen Code-Editor und formatierter Markdown-Vorschau umschalten"
                  >
                    <Icon icon={isMarkdownPreview ? "mage:code" : "mage:file-records"} />
                    {isMarkdownPreview ? "Code anzeigen" : "Vorschau (Reader)"}
                  </button>
                )}
              </div>
              <button className="editor-close-btn modal-close" onClick={onClose} title="IDE schließen (Esc)">
                <Icon icon="mage:multiply" />
              </button>
            </header>

            <div className="editor-code-area" style={{ minHeight: "400px" }}>
              {isMarkdownPreview && (editorLanguage === "markdown" || editorFilename.toLowerCase().endsWith(".md")) ? (
                <MarkdownReader
                  content={editorCode}
                  showCopyAll={false}
                  style={{ height: "100%", border: "none", borderRadius: 0, backgroundColor: "#111214" }}
                />
              ) : (
                <Editor
                  height="100%"
                language={editorLanguage}
                theme={theme === "light" ? "zeno-light-theme" : "zeno-dark-theme"}
                beforeMount={handleEditorBeforeMount}
                value={editorCode}
                onChange={(val) => {
                  setEditorCode(val || "");
                  setIsEditorDirty(true);
                }}
                onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  automaticLayout: true,
                  quickSuggestions: { other: true, comments: true, strings: true },
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: "on",
                  tabCompletion: "on",
                  snippetSuggestions: "top",
                  wordBasedSuggestions: "allDocuments",
                  parameterHints: { enabled: true }
                }}
              />
            )}
          </div>

            <footer className="editor-modal-toolbar">
              <button className="editor-toolbar-btn primary btn-run" onClick={handleEditorRun} title="Ausführen">
                <Icon icon="mage:play" /> Run
              </button>
              <button 
                className="editor-toolbar-btn btn-copy" 
                onClick={() => { navigator.clipboard.writeText(editorCode); showToast("Code kopiert!"); }} 
                title="Kopieren"
              >
                <Icon icon="mage:copy" /> Copy
              </button>
              <button 
                className="editor-toolbar-btn btn-save" 
                onClick={handleSaveFile} 
                title="Speichern (Ctrl+S)"
              >
                <Icon icon="lucide:save" /> Save {isEditorDirty && <span style={{ fontSize: "10px", color: "var(--glow-color-1, #3574F0)", marginLeft: "2px" }}>●</span>}
              </button>
              <button 
                className="editor-toolbar-btn btn-suggest-edit" 
                onClick={handleSuggestEdit} 
                title="Änderung vorschlagen"
              >
                <Icon icon="mage:message-round" /> Suggest
              </button>
              <button 
                className="editor-toolbar-btn btn-delete-file" 
                onClick={handleDeleteCurrentFile} 
                title="Aus Workspace löschen"
                style={{ color: "var(--accent-danger, #E05555)", marginLeft: "auto" }}
              >
                <Icon icon="mage:trash-3" /> Delete
              </button>
            </footer>

            {editorOutput && (
              <pre className="editor-output">
                <code>{editorOutput}</code>
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  );
};
