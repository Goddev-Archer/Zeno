import React from "react";
import { Icon } from "@iconify/react";
import { WidgetConfig, WidgetColSpan, WidgetRowSpan, RecentFile } from "../../types";

interface DashboardProps {
  widgets: WidgetConfig[];
  dashboardEditMode: boolean;
  editingWidgetId: string | null;
  draggedWidgetId: string | null;
  swappingWidgetIds: string[];
  recentFiles: RecentFile[];
  githubToken: string;
  githubReposLoading: boolean;
  githubRepos: Array<{ name: string; fullName: string }>;
  githubRepoData: Record<string, any>;
  gitWidgetTabs: Record<string, string>;
  gitError: string | null;
  liveGitStatus: any;
  liveGitCommits: any[];
  dashboardLocation: string;
  dashboardTime: string;
  weatherMode: "wttr" | "custom";
  weatherApiUrl: string;
  weatherApiKey: string;
  realWeatherData: any;
  weatherFetching: boolean;
  theme: "dark" | "light";
  glowColor: string;
  setDashboardEditMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  setEditingWidgetId: (id: string | null) => void;
  setDraggedWidgetId: (id: string | null) => void;
  setGitWidgetTabs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDashboardLocation: (loc: string) => void;
  setWeatherMode: (mode: "wttr" | "custom") => void;
  setWeatherApiUrl: (url: string) => void;
  setWeatherApiKey: (key: string) => void;
  setRealWeatherData: (data: any) => void;
  addCustomWidget: () => void;
  handleWidgetDrop: (targetId: string) => void;
  moveWidget: (id: string, dir: "left" | "right") => void;
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void;
  deleteWidget: (id: string) => void;
  openWorkspaceFile: (filename: string, language: string) => void;
  setEditorCode: (code: string) => void;
  setEditorWorkflowStep: (step: any) => void;
  setIsEditorOpen: (open: boolean) => void;
  fetchGithubRepoDetails: (repoName: string) => void;
  fetchLiveGitData: () => void;
  fetchRealWeather: () => void;
  showToast: (msg: string) => void;
  getContrastColor: (hex: string) => string;
  onOpenMarketplace?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  widgets,
  dashboardEditMode,
  editingWidgetId,
  draggedWidgetId,
  swappingWidgetIds,
  recentFiles,
  githubToken,
  githubReposLoading,
  githubRepos,
  githubRepoData,
  gitWidgetTabs,
  gitError,
  liveGitStatus,
  liveGitCommits,
  dashboardLocation,
  dashboardTime,
  weatherMode,
  weatherApiUrl,
  weatherApiKey,
  realWeatherData,
  weatherFetching,
  theme,
  glowColor,
  setDashboardEditMode,
  setEditingWidgetId,
  setDraggedWidgetId,
  setGitWidgetTabs,
  setDashboardLocation,
  setWeatherMode,
  setWeatherApiUrl,
  setWeatherApiKey,
  setRealWeatherData,
  addCustomWidget,
  handleWidgetDrop,
  moveWidget,
  updateWidget,
  deleteWidget,
  openWorkspaceFile,
  setEditorCode,
  setEditorWorkflowStep,
  setIsEditorOpen,
  fetchGithubRepoDetails,
  fetchLiveGitData,
  fetchRealWeather,
  showToast,
  getContrastColor,
  onOpenMarketplace
}) => {
  return (
    <div className="zeno-dashboard" style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "8px" }}>
        <div className="dashboard-welcome">
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>Willkommen zurück, CipherNaut</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Dein privates, sicheres Workspace-Dashboard. Zero-Knowledge, 100% clientseitig.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onOpenMarketplace && (
            <button className="settings-btn" onClick={onOpenMarketplace} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
              <Icon icon="mage:box-3d" style={{ color: "#00FF87" }} /> Widget Marketplace
            </button>
          )}
          {dashboardEditMode && (
            <button className="settings-btn primary" onClick={addCustomWidget} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
              <Icon icon="mage:plus" /> Eigenes Widget
            </button>
          )}
          <button className={`settings-btn ${dashboardEditMode ? "primary" : ""}`} onClick={() => { setDashboardEditMode((v) => !v); setEditingWidgetId(null); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
            <Icon icon={dashboardEditMode ? "mage:check" : "mage:settings"} />
            {dashboardEditMode ? "Fertig" : "Dashboard bearbeiten"}
          </button>
        </div>
      </header>

      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridAutoRows: "minmax(220px, auto)", gap: "16px", padding: "16px 0", flex: 1 }}>
        {[...widgets].sort((a, b) => a.order - b.order).map((widget) => {
          const hasBg = !!widget.bgColor;
          const fgColor = hasBg ? getContrastColor(widget.bgColor) : "var(--text-primary)";
          const fgMuted = hasBg ? getContrastColor(widget.bgColor) + "99" : "var(--text-muted)";
          const cardBg = hasBg ? widget.bgColor : "var(--bg-secondary)";
          const isDragging = draggedWidgetId === widget.id;
          return (
            <div
              key={widget.id}
              draggable={dashboardEditMode}
              onDragStart={(e) => {
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", widget.id);
                }
                setTimeout(() => {
                  setDraggedWidgetId(widget.id);
                }, 0);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer) {
                  e.dataTransfer.dropEffect = "move";
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleWidgetDrop(widget.id);
              }}
              onDragEnd={() => setDraggedWidgetId(null)}
              className={swappingWidgetIds.includes(widget.id) ? "widget-swapping" : ""}
              style={{ gridColumn: `span ${widget.colSpan}`, gridRow: `span ${widget.rowSpan}`, backgroundColor: cardBg, border: `1px solid ${hasBg ? "transparent" : "var(--border-color)"}`, borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", position: "relative", opacity: isDragging ? 0.4 : 1, transition: "opacity 0.2s, box-shadow 0.2s", boxShadow: dashboardEditMode ? "0 0 0 2px var(--glow-color-1,#3574F0)55" : "none", cursor: dashboardEditMode ? "grab" : "default", minHeight: widget.rowSpan === 2 ? "460px" : "220px" }}
            >
              {dashboardEditMode && (() => {
                const sorted = [...widgets].sort((a, b) => a.order - b.order);
                const idx = sorted.findIndex((w) => w.id === widget.id);
                const isFirst = idx === 0;
                const isLast = idx === sorted.length - 1;
                return (
                  <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px", zIndex: 10, pointerEvents: "auto" }}>
                    {!isFirst && (
                      <button onClick={() => moveWidget(widget.id, "left")} title="Nach vorne verschieben" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                        <Icon icon="mage:chevron-left" />
                      </button>
                    )}
                    {!isLast && (
                      <button onClick={() => moveWidget(widget.id, "right")} title="Nach hinten verschieben" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                        <Icon icon="mage:chevron-right" />
                      </button>
                    )}
                    <button onClick={() => setEditingWidgetId(editingWidgetId === widget.id ? null : widget.id)} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}><Icon icon="mage:settings" /></button>
                    <button onClick={() => deleteWidget(widget.id)} style={{ background: "rgba(200,50,50,0.12)", border: "1px solid rgba(200,50,50,0.25)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "#e05252", fontSize: "13px", display: "flex", alignItems: "center" }}><Icon icon="mage:trash" /></button>
                  </div>
                );
              })()}
              {dashboardEditMode && editingWidgetId === widget.id && (
                <div style={{ position: "absolute", top: "44px", right: "8px", width: "240px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px", zIndex: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.6px" }}>Widget-Einstellungen</span>
                  <div>
                    <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Titel</label>
                    <input className="settings-input" value={widget.title} onChange={(e) => updateWidget(widget.id, { title: e.target.value })} style={{ fontSize: "11px", padding: "5px 8px", maxWidth: "none", width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Hintergrundfarbe</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input type="color" value={widget.bgColor || "#1a1f2e"} onChange={(e) => updateWidget(widget.id, { bgColor: e.target.value })} style={{ width: "32px", height: "28px", border: "none", borderRadius: "6px", cursor: "pointer", padding: "1px" }} />
                      <input className="settings-input" value={widget.bgColor} placeholder="leer = Standard" onChange={(e) => updateWidget(widget.id, { bgColor: e.target.value })} style={{ fontSize: "10px", padding: "5px 8px", flex: 1, fontFamily: "var(--font-mono)" }} />
                      {widget.bgColor && <button onClick={() => updateWidget(widget.id, { bgColor: "" })} style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "3px 5px", cursor: "pointer", color: "var(--text-muted)", fontSize: "10px" }}>x</button>}
                    </div>
                    {widget.bgColor && <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>Vordergrundfarbe: <span style={{ fontFamily: "var(--font-mono)" }}>{fgColor}</span></p>}
                  </div>
                  <div>
                    <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Größe</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                      {([["1x1", 1, 1], ["2x1 Breit", 2, 1], ["1x2 Hoch", 1, 2], ["2x2 Groß", 2, 2]] as [string, WidgetColSpan, WidgetRowSpan][]).map(([label, col, row]) => (
                        <button key={label} onClick={() => updateWidget(widget.id, { colSpan: col, rowSpan: row })} style={{ fontSize: "10px", padding: "4px 6px", borderRadius: "6px", border: `1px solid ${widget.colSpan === col && widget.rowSpan === row ? "var(--glow-color-1,#3574F0)" : "var(--border-color)"}`, background: widget.colSpan === col && widget.rowSpan === row ? "rgba(53,116,240,0.15)" : "var(--bg-tertiary)", color: "var(--text-primary)", cursor: "pointer" }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {widget.type === "custom" && (
                    <div>
                      <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>JavaScript (return HTML)</label>
                      <textarea value={widget.customCode} onChange={(e) => updateWidget(widget.id, { customCode: e.target.value })} spellCheck={false} style={{ width: "100%", height: "120px", fontSize: "10px", fontFamily: "var(--font-mono)", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-primary)", padding: "6px 8px", resize: "vertical", boxSizing: "border-box" }} />
                      <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "3px" }}>JS-Code der einen HTML-String zurückgibt (return).</p>
                    </div>
                  )}
                  {widget.type === "git-status" && (
                    <div>
                      <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Datenquelle</label>
                      <select 
                        className="settings-input" 
                        value={widget.gitMode || "local"} 
                        onChange={(e) => {
                          const mode = e.target.value as "local" | "github";
                          updateWidget(widget.id, { 
                            gitMode: mode,
                            title: mode === "github" ? "GitHub Repository" : "Git Repository Status"
                          });
                        }}
                        style={{ width: "100%", fontSize: "11px", padding: "5px 8px", marginBottom: "8px" }}
                      >
                        <option value="local">Lokal (System-Git)</option>
                        <option value="github">GitHub API (Cloud)</option>
                      </select>
                      
                      {widget.gitMode === "github" && (
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Repository</label>
                          {githubToken ? (
                            githubReposLoading ? (
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Lade Repos...</span>
                            ) : (
                              <select
                                className="settings-input"
                                value={widget.gitRepo || ""}
                                onChange={(e) => {
                                  const repo = e.target.value;
                                  updateWidget(widget.id, { 
                                    gitRepo: repo,
                                    title: repo ? `GitHub: ${repo.split("/")[1]}` : "GitHub Repository"
                                  });
                                }}
                                style={{ width: "100%", fontSize: "11px", padding: "5px 8px" }}
                              >
                                <option value="">-- Wähle Repo --</option>
                                {githubRepos.map((r) => (
                                  <option key={r.fullName} value={r.fullName}>{r.fullName}</option>
                                ))}
                              </select>
                            )
                          ) : (
                            <p style={{ fontSize: "9px", color: "#e05252" }}>Trage zuerst deinen GitHub-Token in den Einstellungen ein.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, pointerEvents: dashboardEditMode ? "none" : "auto", height: "100%", minHeight: 0 }}>
                <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}`, paddingBottom: "10px", marginBottom: "12px", paddingRight: dashboardEditMode ? "56px" : "0px" }}>
                {dashboardEditMode && <span style={{ fontSize: "14px", color: fgMuted, cursor: "grab", userSelect: "none" }} title="Ziehen zum Verschieben">⠿</span>}
                <span style={{ fontSize: "18px", color: hasBg ? fgColor : "var(--accent-color)" }}>
                  <Icon icon={widget.type === "recent-files" ? "mage:file-records" : widget.type === "git-status" ? "mage:github" : widget.type === "weather" ? "mage:sun" : widget.type === "privacy-guard" ? "mage:shield" : "mage:code"} />
                </span>
                <h3 style={{ fontSize: "13px", fontWeight: "600", color: fgColor, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{widget.title}</h3>
              </div>
              {widget.type === "recent-files" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {recentFiles.map((file) => (
                      <div key={file.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                        <div onClick={() => openWorkspaceFile(file.name, file.language)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1, minWidth: 0 }}>
                          <Icon icon={file.language === "rust" ? "vscode-icons:file-type-rust" : file.language === "python" ? "vscode-icons:file-type-python" : file.language === "javascript" ? "vscode-icons:file-type-js" : "mage:file-records"} style={{ fontSize: "16px", flexShrink: 0 }} />
                          <span style={{ fontSize: "12px", fontWeight: "500", color: fgColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                        </div>
                        <span style={{ fontSize: "9px", color: fgMuted, fontWeight: "600" }}>{file.language.toUpperCase()}</span>
                      </div>
                    ))}
                    {recentFiles.length === 0 && <p style={{ fontSize: "11px", color: fgMuted, textAlign: "center", padding: "16px" }}>Keine Dateien.</p>}
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button className="settings-btn primary" onClick={() => { setEditorCode(""); setEditorWorkflowStep("input_filename"); setIsEditorOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}><Icon icon="mage:plus" /> Neue Datei</button>
                    <button className="settings-btn" onClick={() => { setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} style={{ fontSize: "11px", padding: "6px 12px" }}><Icon icon="mage:file-records" /> Editor</button>
                  </div>
                </div>
              )}
              {widget.type === "git-status" && (() => {
                const isGithub = widget.gitMode === "github";
                if (isGithub) {
                  if (!githubToken.trim()) {
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", height: "100%", width: "100%", overflow: "hidden", borderRadius: "8px" }}>
                        <img 
                          src="/github_placeholder.jpg" 
                          alt="Hier könnten Ihre Repos angezeigt werden" 
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} 
                        />
                        <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                      </div>
                    );
                  }
                  const repoName = widget.gitRepo;
                  if (!repoName) {
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "8px", textAlign: "center", padding: "16px" }}>
                        <Icon icon="mage:settings" style={{ fontSize: "28px", color: fgMuted }} />
                        <span style={{ fontSize: "11px", color: fgMuted }}>Kein Repository ausgewählt. Klicke oben rechts auf das Zahnrad im Edit-Modus.</span>
                      </div>
                    );
                  }
                  const data = githubRepoData[repoName];
                  if (!data) {
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "8px", padding: "20px" }}>
                        <span style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--glow-color-1,#3574F0)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                        <span style={{ fontSize: "11px", color: fgMuted }}>Lade Repository-Daten...</span>
                      </div>
                    );
                  }
                  const activeTab = gitWidgetTabs[widget.id] || "commits";
                  const setActiveTab = (tab: string) => setGitWidgetTabs(prev => ({ ...prev, [widget.id]: tab }));
                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "10px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                          <div>
                            <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Default Branch</span>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#F05032", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Icon icon="mage:code" style={{ fontSize: "14px" }} /> {data.defaultBranch || "main"}
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Sterne</span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFC66D", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                              ⭐ {data.stars} Stars
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginBottom: "12px", borderBottom: `1px solid ${hasBg ? fgColor + "11" : "rgba(255,255,255,0.05)"}`, paddingBottom: "4px" }}>
                          {[
                            { id: "commits", label: "Commits" },
                            { id: "issues", label: `Issues (${data.issues?.length || 0})` },
                            { id: "pulls", label: `PRs (${data.pulls?.length || 0})` },
                            { id: "branches", label: "Branches" }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              style={{
                                fontSize: "10px",
                                padding: "4px 8px",
                                background: activeTab === tab.id ? (hasBg ? fgColor + "22" : "var(--bg-tertiary)") : "none",
                                border: "none",
                                borderRadius: "4px",
                                color: activeTab === tab.id ? fgColor : fgMuted,
                                cursor: "pointer",
                                fontWeight: "600",
                                transition: "all 0.15s"
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                          {activeTab === "commits" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {data.commits && data.commits.map((c: any) => (
                                <div key={c.hash} style={{ display: "flex", gap: "8px", fontSize: "11px", alignItems: "center" }}>
                                  <span style={{ color: "var(--glow-color-1,#3574F0)", fontFamily: "var(--font-mono)", fontWeight: "600", flexShrink: 0 }}>{c.hash}</span>
                                  <span style={{ color: fgColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={c.message}>{c.message}</span>
                                  <span style={{ fontSize: "9px", color: fgMuted, flexShrink: 0 }}>{c.date}</span>
                                </div>
                              ))}
                              {(!data.commits || data.commits.length === 0) && (
                                <span style={{ fontSize: "11px", color: fgMuted }}>Keine Commits vorhanden.</span>
                              )}
                            </div>
                          )}
                          {activeTab === "issues" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {data.issues && data.issues.map((i: any) => (
                                <a key={i.number} href={i.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "6px", fontSize: "11px", textDecoration: "none", color: fgColor, alignItems: "center" }}>
                                  <span style={{ color: "#e05252", fontWeight: "600", flexShrink: 0 }}>#{i.number}</span>
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={i.title}>{i.title}</span>
                                </a>
                              ))}
                              {(!data.issues || data.issues.length === 0) && (
                                <span style={{ fontSize: "11px", color: "#59A869", fontWeight: "600" }}>✓ Keine offenen Issues!</span>
                              )}
                            </div>
                          )}
                          {activeTab === "pulls" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {data.pulls && data.pulls.map((p: any) => (
                                <a key={p.number} href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "6px", fontSize: "11px", textDecoration: "none", color: fgColor, alignItems: "center" }}>
                                  <span style={{ color: "#59A869", fontWeight: "600", flexShrink: 0 }}>#{p.number}</span>
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={p.title}>{p.title}</span>
                                </a>
                              ))}
                              {(!data.pulls || data.pulls.length === 0) && (
                                <span style={{ fontSize: "11px", color: fgMuted }}>Keine offenen Pull Requests.</span>
                              )}
                            </div>
                          )}
                          {activeTab === "branches" && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {data.branches && data.branches.map((b: string) => (
                                <span key={b} className="badge" style={{ backgroundColor: "rgba(53,116,240,0.1)", color: "var(--glow-color-1,#3574F0)", border: "1px solid rgba(53,116,240,0.2)", fontSize: "10px", padding: "3px 8px", borderRadius: "4px" }}>
                                  {b}
                                </span>
                              ))}
                              {(!data.branches || data.branches.length === 0) && (
                                <span style={{ fontSize: "11px", color: fgMuted }}>Keine Branches geladen.</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                        <button className="settings-btn" onClick={() => { fetchGithubRepoDetails(repoName); showToast("GitHub-Daten aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                        <a href={`https://github.com/${repoName}`} target="_blank" rel="noopener noreferrer" className="settings-btn primary" style={{ fontSize: "11px", padding: "6px 12px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          Auf GitHub öffnen
                        </a>
                      </div>
                    </div>
                  );
                }
                if (gitError) {
                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "9px", color: "#e05252", padding: "6px 8px", background: "rgba(224,82,82,0.1)", borderRadius: "var(--radius-sm)", marginBottom: "10px", border: "1px solid rgba(224,82,82,0.2)" }} title={gitError}>
                          ⚠️ Kein lokales Git-Repo oder Befehl nicht verfügbar.
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px 10px", gap: "8px", marginTop: "10px" }}>
                          <Icon icon="mage:code" style={{ fontSize: "24px", color: fgMuted }} />
                          <span style={{ fontSize: "11px", color: fgMuted }}>Initialisiere ein Git-Repository (<code>git init</code>) im Workspace, um den Status anzuzeigen.</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                        <button className="settings-btn" onClick={() => { fetchLiveGitData(); showToast("Git-Status aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                      </div>
                    </div>
                  );
                }
                const displayBranch = liveGitStatus?.branch || "main (Simuliert)";
                const isClean = liveGitStatus ? liveGitStatus.is_clean : true;
                const commits = liveGitStatus && liveGitCommits.length > 0 ? liveGitCommits : [
                  { hash: "5a69096", message: "Dashboard widget system: drag, resize, custom colors", date: "vor 2 Std." },
                  { hash: "140a9f0", message: "feat(weather): three-mode weather widget", date: "vor 4 Std." },
                  { hash: "0f551dc", message: "Add Monaco Editor runtime settings", date: "vor 1 Tag" }
                ];
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}`, paddingBottom: "10px" }}>
                        <div>
                          <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Branch</span>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#F05032", display: "flex", alignItems: "center", gap: "4px" }}><Icon icon="mage:code" style={{ fontSize: "14px" }} /> {displayBranch}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Status</span>
                          {isClean ? (
                            <span className="badge" style={{ backgroundColor: "rgba(89,168,105,0.15)", color: "#59A869", border: "1px solid rgba(89,168,105,0.2)", fontSize: "10px", padding: "2px 6px" }}>Clean</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: "rgba(224,82,82,0.15)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", fontSize: "10px", padding: "2px 6px" }}>
                              {liveGitStatus ? `${(liveGitStatus.modified || 0) + (liveGitStatus.added || 0) + (liveGitStatus.deleted || 0) + (liveGitStatus.untracked || 0) || liveGitStatus.uncommittedChanges || 0} Änderungen` : "Geändert"}
                            </span>
                          )}
                        </div>
                      </div>
                      {liveGitStatus && !isClean && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", fontSize: "10px" }}>
                          {liveGitStatus.modified > 0 && <span style={{ color: "#FFC66D" }}>{liveGitStatus.modified} modifiziert</span>}
                          {liveGitStatus.added > 0 && <span style={{ color: "#59A869" }}>{liveGitStatus.added} neu</span>}
                          {liveGitStatus.deleted > 0 && <span style={{ color: "#e05252" }}>{liveGitStatus.deleted} gelöscht</span>}
                          {liveGitStatus.untracked > 0 && <span style={{ color: fgMuted }}>{liveGitStatus.untracked} unversioniert</span>}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, display: "block", marginBottom: "4px" }}>Letzte Commits</span>
                        {commits.map((c) => (
                          <div key={c.hash} style={{ display: "flex", gap: "8px", fontSize: "11px", alignItems: "center" }}>
                            <span style={{ color: "var(--glow-color-1,#3574F0)", fontFamily: "var(--font-mono)", fontWeight: "600", flexShrink: 0 }}>{c.hash}</span>
                            <span style={{ color: fgColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={c.message}>{c.message}</span>
                            <span style={{ fontSize: "9px", color: fgMuted, flexShrink: 0 }}>{c.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button className="settings-btn" onClick={() => { fetchLiveGitData(); showToast("Git-Status aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                      <button className="settings-btn" onClick={() => showToast("Zeno ist lokal und führt Push-Befehle nur über dein System-Git aus")} style={{ fontSize: "11px", padding: "6px 12px" }}>Push (Lokal)</button>
                    </div>
                  </div>
                );
              })()}
              {widget.type === "weather" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="Standort (z. B. Berlin) + Enter"
                      value={dashboardLocation}
                      onChange={(e) => { setDashboardLocation(e.target.value); setRealWeatherData(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") fetchRealWeather(); }}
                      style={{ flex: 1, padding: "6px 10px", fontSize: "12px", maxWidth: "none" }}
                    />
                    <select className="settings-input" value={weatherMode} onChange={(e) => { setWeatherMode(e.target.value as "wttr" | "custom"); setRealWeatherData(null); }} style={{ padding: "6px 8px", fontSize: "11px", width: "auto", flexShrink: 0 }}>
                      <option value="wttr">wttr.in</option>
                      <option value="custom">Custom API</option>
                    </select>
                  </div>
                  {weatherMode === "custom" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 10px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                      <input type="text" className="settings-input" value={weatherApiUrl} onChange={(e) => setWeatherApiUrl(e.target.value)} style={{ fontSize: "10px", padding: "5px 8px", maxWidth: "none", fontFamily: "var(--font-mono)" }} />
                      <input type="password" className="settings-input" placeholder="API-Key" value={weatherApiKey} onChange={(e) => setWeatherApiKey(e.target.value)} style={{ fontSize: "11px", padding: "5px 8px", maxWidth: "none" }} />
                    </div>
                  )}
                  {!realWeatherData ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px", textAlign: "center" }}>
                      {weatherFetching ? (
                        <>
                          <span style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--glow-color-1,#3574F0)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                          <span style={{ fontSize: "11px", color: fgMuted }}>Lade Wetterdaten...</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="mage:sun" style={{ fontSize: "28px", color: fgMuted }} />
                          <span style={{ fontSize: "11px", color: fgMuted }}>Keine Wetterdaten geladen</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                        <div>
                          <span style={{ fontSize: "24px", fontWeight: "700", display: "block", color: fgColor }}>{realWeatherData.temp}</span>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: fgMuted }}>{dashboardLocation}</span>
                          <span style={{ fontSize: "10px", display: "block", color: "var(--glow-color-1,#3574F0)", marginTop: "4px" }}>{dashboardTime}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Icon icon={realWeatherData.icon} style={{ fontSize: "28px", color: "#FFC66D", display: "block", marginLeft: "auto", marginBottom: "2px" }} />
                          <span style={{ fontSize: "11px", color: fgColor, display: "block" }}>{realWeatherData.condition}</span>
                          <span style={{ fontSize: "9px", color: fgMuted, display: "block" }}>{realWeatherData.humidity} / {realWeatherData.wind}</span>
                        </div>
                      </div>

                      {realWeatherData.forecast && realWeatherData.forecast.length > 0 && (
                        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                          <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, display: "block", marginBottom: "8px" }}>3-Tage-Vorhersage (wttr.in)</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr)", gap: "4px", paddingBottom: "4px", borderBottom: `1px solid ${hasBg ? fgColor + "15" : "var(--border-color)"}`, fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, textAlign: "center" }}>
                              <div style={{ textAlign: "left" }}>Tag</div>
                              <div>Nacht</div>
                              <div>Morgen</div>
                              <div>Mittag</div>
                              <div>Abend</div>
                            </div>
                            {realWeatherData.forecast.map((f: any, idx: number) => (
                              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr)", gap: "4px", alignItems: "center", padding: "6px 0", borderBottom: idx < 2 ? `1px solid ${hasBg ? fgColor + "10" : "rgba(255,255,255,0.05)"}` : "none", textAlign: "center" }}>
                                <div style={{ textAlign: "left", fontSize: "10px", fontWeight: "600", color: fgColor }}>{f.date}</div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                  <Icon icon={f.nightIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                  <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.nightTemp}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                  <Icon icon={f.morningIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                  <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.morningTemp}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                  <Icon icon={f.noonIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                  <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.noonTemp}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                  <Icon icon={f.eveningIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                  <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.eveningTemp}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <button className="settings-btn primary" onClick={fetchRealWeather} disabled={weatherFetching} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                    {weatherFetching ? "Lade..." : "Aktualisieren"}
                  </button>
                  <p style={{ fontSize: "9px", color: fgMuted, lineHeight: "1.4", marginTop: "auto" }}>
                    {weatherMode === "wttr" && "🌐 wttr.in: kein Account, kein Tracking."}
                    {weatherMode === "custom" && "🔑 API-Key bleibt lokal."}
                  </p>
                </div>
              )}
              {widget.type === "privacy-guard" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {([["Schlüsselhoheit", "Aktiv & Lokal", "#59A869"], ["E2E Verschlüsselung", "AES-GCM-256 + SFrame", "#59A869"], ["Storage Backup", "BYOS", "#FFC66D"], ["Isolations-Sandbox", "WASM Aktiv", "#59A869"]] as [string, string, string][]).map(([label, val, color]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: fgMuted }}>{label}</span>
                        <span className="badge" style={{ backgroundColor: color + "22", color, border: `1px solid ${color}33`, fontSize: "10px", padding: "2px 6px" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "9px", color: fgMuted, marginTop: "10px", lineHeight: "1.3" }}>Alle Systemfunktionen vollverschlüsselt. Metadaten clientseitig isoliert.</p>
                </div>
              )}
              {widget.type === "custom" && (
                <div style={{ flex: 1, overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
                  <iframe
                    srcDoc={(() => {
                      let html = "<span style='color:red'>Kein Code</span>";
                      try {
                        // eslint-disable-next-line no-new-func
                        const r = new Function(widget.customCode)();
                        if (typeof r === "string") html = r;
                      } catch (e: unknown) { html = `<span style='color:#e05252;font-size:11px'>Fehler: ${(e as Error).message}</span>`; }
                      return `<!DOCTYPE html><html><head><style>
                      :root {
                        --bg-primary: ${theme === "light" ? "#FFFFFF" : "#1E1F22"};
                        --bg-secondary: ${theme === "light" ? "#F2F3F5" : "#2B2D30"};
                        --bg-tertiary: ${theme === "light" ? "#EBECF0" : "#1A1B1D"};
                        --border-color: ${theme === "light" ? "#DFE1E5" : "#3f4248"};
                        --text-primary: ${theme === "light" ? "#060607" : "#F2F3F5"};
                        --text-muted: ${theme === "light" ? "#5C6370" : "#949BA4"};
                        --glow-color-1: ${glowColor};
                      }
                      *{box-sizing:border-box;margin:0;padding:0}
                      body{font-family:system-ui,sans-serif;font-size:12px;background:${widget.bgColor || "transparent"};color:${fgColor};padding:8px;overflow:auto;height:100vh;}
                      </style></head><body>${html}</body></html>`;
                    })()}
                    sandbox="allow-scripts"
                    style={{ width: "100%", height: "100%", border: "none", background: "transparent" }}
                    title={widget.title}
                  />
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
