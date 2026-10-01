import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { UserIdentity, DbIdentityRecord } from "../../types";
import {
  generateSovereignIdentity,
  importSovereignIdentity,
  saveIdentityToDb,
  getAllIdentitiesFromDb,
  setActiveIdentityInDb,
  deleteIdentityFromDb
} from "../../services/cryptoService";

interface SovereignAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIdentity: UserIdentity | null;
  onIdentityChanged: (identity: UserIdentity, username: string) => void;
  showToast: (msg: string) => void;
  initialTab?: "create" | "restore" | "manage";
}

export const SovereignAccountModal: React.FC<SovereignAccountModalProps> = ({
  isOpen,
  onClose,
  currentIdentity,
  onIdentityChanged,
  showToast,
  initialTab = "create"
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "restore" | "manage">(initialTab);

  // Wizard State (Create)
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [alias, setAlias] = useState<string>("CipherSovereign");
  const [generatedIdentity, setGeneratedIdentity] = useState<UserIdentity | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState<boolean>(false);

  // Restore State
  const [restoreWords, setRestoreWords] = useState<string>("");
  const [restoreAlias, setRestoreAlias] = useState<string>("RestoredUser");
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Manage State
  const [savedIdentities, setSavedIdentities] = useState<DbIdentityRecord[]>([]);
  const [showSeedAin, setShowSeedAin] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setCreateStep(1);
      setGeneratedIdentity(null);
      setHasConfirmedBackup(false);
      loadIdentities();
    }
  }, [isOpen, initialTab]);

  const loadIdentities = async () => {
    try {
      const list = await getAllIdentitiesFromDb();
      setSavedIdentities(list);
    } catch (e) {
      console.warn("Konnte gespeicherte Identitäten nicht laden:", e);
    }
  };

  // Generate a new 12-word identity via Rust backend
  const handleStartGeneration = async () => {
    if (!alias.trim()) {
      showToast("Bitte gib einen Alias / Benutzernamen ein!");
      return;
    }
    setIsGenerating(true);
    try {
      const idn = await generateSovereignIdentity();
      setGeneratedIdentity(idn);
      setCreateStep(2);
    } catch (e) {
      showToast(`Fehler bei der Generierung: ${e}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Finish Creation and save to SQLite
  const handleFinalizeCreate = async () => {
    if (!generatedIdentity) return;
    if (!hasConfirmedBackup) {
      showToast("Bitte bestätige zuerst, dass du deine 12 Wörter gesichert hast!");
      return;
    }

    const record: DbIdentityRecord = {
      ain: generatedIdentity.ain,
      username: alias.trim(),
      publicKeyHex: generatedIdentity.publicKeyHex,
      privateKeyEncryptedHex: generatedIdentity.privateKeyEncryptedHex,
      mnemonic: generatedIdentity.mnemonic,
      fingerprint: generatedIdentity.fingerprint,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      await saveIdentityToDb(record);
      onIdentityChanged(generatedIdentity, alias.trim());
      showToast(`Souveräne Identität "${alias}" (${generatedIdentity.ain}) aktiviert! 🛡️`);
      setCreateStep(1);
      setGeneratedIdentity(null);
      setHasConfirmedBackup(false);
      onClose();
    } catch (e) {
      showToast(`Fehler beim Speichern in SQLite: ${e}`);
    }
  };

  // Restore Account from 12 words
  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const words = restoreWords.trim();
    if (!words) {
      showToast("Bitte gib die 12 Wörter deiner Wiederherstellungsphrase ein!");
      return;
    }

    setIsRestoring(true);
    try {
      const idn = await importSovereignIdentity(words);
      const record: DbIdentityRecord = {
        ain: idn.ain,
        username: restoreAlias.trim() || "RestoredUser",
        publicKeyHex: idn.publicKeyHex,
        privateKeyEncryptedHex: idn.privateKeyEncryptedHex,
        mnemonic: idn.mnemonic,
        fingerprint: idn.fingerprint,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      await saveIdentityToDb(record);
      onIdentityChanged(idn, restoreAlias.trim() || "RestoredUser");
      showToast(`Konto erfolgreich wiederhergestellt! AIN: ${idn.ain} 🔑`);
      setRestoreWords("");
      onClose();
    } catch (e: any) {
      showToast(`Wiederherstellung fehlgeschlagen: ${e.message || e}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Switch Active Identity
  const handleSelectIdentity = async (idn: DbIdentityRecord) => {
    try {
      await setActiveIdentityInDb(idn.ain);
      const userIdn: UserIdentity = {
        ain: idn.ain,
        publicKeyHex: idn.publicKeyHex,
        privateKeyEncryptedHex: idn.privateKeyEncryptedHex,
        mnemonic: idn.mnemonic,
        fingerprint: idn.fingerprint,
        createdAt: idn.createdAt
      };
      onIdentityChanged(userIdn, idn.username);
      await loadIdentities();
      showToast(`Zu Identität "${idn.username}" (${idn.ain}) gewechselt!`);
    } catch (e) {
      showToast(`Fehler beim Wechseln: ${e}`);
    }
  };

  // Delete Identity
  const handleDeleteIdentity = async (ain: string) => {
    if (currentIdentity?.ain === ain) {
      showToast("Aktive Identität kann nicht gelöscht werden!");
      return;
    }
    if (confirm(`Bist du sicher, dass du die Identität ${ain} löschen möchtest?`)) {
      try {
        await deleteIdentityFromDb(ain);
        await loadIdentities();
        showToast("Identität aus dem lokalen Speicher entfernt.");
      } catch (e) {
        showToast(`Fehler beim Löschen: ${e}`);
      }
    }
  };

  // Copy Seed Words
  const handleCopyMnemonic = (words: string) => {
    navigator.clipboard.writeText(words);
    showToast("12-Wort Wiederherstellungsphrase in die Zwischenablage kopiert! 📋");
  };

  // Download Seed Backup File
  const handleDownloadBackup = (words: string, ain: string) => {
    const text = `=====================================================
ZENO SOUVERÄNER ACCOUNT-SCHLÜSSEL (BIP-39 BACKUP)
=====================================================
AIN (Account Identifier): ${ain}
Erstellt am: ${new Date().toISOString()}

12-WORT WIEDERHERSTELLUNGSPHRASE:
${words}

SICHERHEITSHINWEISE:
- Teile diese Wörter NIEMALS mit Dritten oder in Chats.
- Zeno speichert keine Passwörter auf zentralen Servern.
- Dieser Schlüssel ist deine einzige Möglichkeit, deine Identität
  und Chats auf neuen Geräten wiederherzustellen.
- Immun gegen EU-Client-Side-Scanning: Deine Schlüssel verlassen
  niemals dein lokales Gerät.
=====================================================`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeno-backup-${ain.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Paper-Backup erfolgreich heruntergeladen! 💾");
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        opacity: 1,
        visibility: "visible",
        pointerEvents: "auto"
      }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#111319",
          border: "1px solid #1E222D",
          borderRadius: "16px",
          padding: "24px",
          color: "#E2E8F0",
          boxShadow: "0 20px 60px rgba(0,0,0,0.85)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(0, 255, 135, 0.15)",
                border: "1px solid rgba(0, 255, 135, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00FF87",
                fontSize: "22px"
              }}
            >
              <Icon icon="mage:shield" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#FFF" }}>
                Souveräne Identität &amp; Kontoverwaltung
              </h3>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: "2px 0 0 0" }}>
                Zero-Knowledge Kryptografie • Kein zentraler Login • ECDSA P-256 &amp; BIP-39
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "20px" }}
            title="Schließen"
          >
            <Icon icon="mage:multiply" />
          </button>
        </div>

        {/* 3-Tab Selector */}
        <div style={{ display: "flex", backgroundColor: "#0D0E12", padding: "4px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #1E222D", gap: "4px" }}>
          <button
            onClick={() => setActiveTab("create")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "create" ? "#1E222D" : "transparent",
              color: activeTab === "create" ? "#00FF87" : "#94A3B8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:user-plus" /> Neues Konto (12 Wörter)
          </button>
          <button
            onClick={() => setActiveTab("restore")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "restore" ? "#1E222D" : "transparent",
              color: activeTab === "restore" ? "#38BDF8" : "#94A3B8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:refresh" /> Wiederherstellen
          </button>
          <button
            onClick={() => {
              setActiveTab("manage");
              loadIdentities();
            }}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "manage" ? "#1E222D" : "transparent",
              color: activeTab === "manage" ? "#A855F7" : "#94A3B8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:id" /> Identitäten ({savedIdentities.length})
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: CREATE SOVEREIGN ACCOUNT WIZARD */}
        {/* ======================================================== */}
        {activeTab === "create" && (
          <div>
            {/* Step 1: Alias & Initial Info */}
            {createStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00FF87", fontWeight: "700", fontSize: "12px", marginBottom: "6px" }}>
                    <Icon icon="mage:light-bulb" /> Wie funktioniert ein Zeno-Konto?
                  </div>
                  <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0, lineHeight: "1.5" }}>
                    Zeno benötigt weder E-Mail-Adresse noch Telefonnummer. Deine Identität basiert auf einem kryptografischen Schlüsselpaar (ECDSA P-256), das auf deinem Gerät aus einer geheimen <strong>12-Wort-Phrase (BIP-39)</strong> abgeleitet wird.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                    DEIN ANZEIGENAME / ALIAS *
                  </label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="z. B. AliceCyber oder GhostDeveloper"
                    style={{
                      width: "100%",
                      backgroundColor: "#0D0E12",
                      border: "1px solid #262933",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: "#FFF",
                      outline: "none"
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={isGenerating}
                  style={{
                    backgroundColor: "#00FF87",
                    color: "#08090C",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "6px"
                  }}
                >
                  <Icon icon="mage:shield-check" />
                  {isGenerating ? "Generiere kryptografischen Schlüssel in Rust..." : "12-Wort Schlüsselphrase generieren"}
                </button>
              </div>
            )}

            {/* Step 2: Display 12 Seed Words */}
            {createStep === 2 && generatedIdentity && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#F59E0B", fontWeight: "700", fontSize: "12px", marginBottom: "4px" }}>
                    <Icon icon="mage:alert" /> SICHERE DIESE 12 WÖRTER JETZT!
                  </div>
                  <div style={{ fontSize: "11px", color: "#CBD5E1", lineHeight: "1.4" }}>
                    Dies ist dein einziger Wiederherstellungsschlüssel. Wer diese 12 Wörter besitzt, kontrolliert deine AIN. Notiere sie handschriftlich auf Papier oder in einem Passwort-Manager.
                  </div>
                </div>

                {/* 12-Word Tiles Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    backgroundColor: "#090A0D",
                    border: "1px solid #1E222D",
                    borderRadius: "10px",
                    padding: "14px"
                  }}
                >
                  {(generatedIdentity.mnemonic || "").split(" ").map((word, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#161922",
                        border: "1px solid #262933",
                        borderRadius: "6px",
                        padding: "6px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontFamily: "monospace"
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#64748B", width: "16px", textAlign: "right" }}>
                        {idx + 1}.
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#00FF87" }}>
                        {word}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Copy & Download Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleCopyMnemonic(generatedIdentity.mnemonic || "")}
                    style={{
                      flex: 1,
                      backgroundColor: "#161922",
                      border: "1px solid #262933",
                      color: "#E2E8F0",
                      borderRadius: "6px",
                      padding: "8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon icon="mage:copy" /> Wörter kopieren
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadBackup(generatedIdentity.mnemonic || "", generatedIdentity.ain)}
                    style={{
                      flex: 1,
                      backgroundColor: "#161922",
                      border: "1px solid #262933",
                      color: "#38BDF8",
                      borderRadius: "6px",
                      padding: "8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon icon="mage:file-download" /> Paper-Backup (.txt)
                  </button>
                </div>

                {/* Generated AIN Info */}
                <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "8px", padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Deine generierte AIN:</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFF", fontFamily: "monospace" }}>
                      {generatedIdentity.ain}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", color: "#64748B" }}>Fingerprint:</span>
                    <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace" }}>
                      {generatedIdentity.fingerprint}
                    </span>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "11px", color: "#E2E8F0" }}>
                  <input
                    type="checkbox"
                    checked={hasConfirmedBackup}
                    onChange={(e) => setHasConfirmedBackup(e.target.checked)}
                    style={{ accentColor: "#00FF87", marginTop: "2px" }}
                  />
                  <span>
                    Ich habe meine 12 Wörter gesichert. Mir ist bewusst, dass Zeno verlorene Passphrasen nicht wiederherstellen kann.
                  </span>
                </label>

                {/* Finalize Button */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      border: "1px solid #262933",
                      color: "#94A3B8",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeCreate}
                    disabled={!hasConfirmedBackup}
                    style={{
                      flex: 2,
                      backgroundColor: hasConfirmedBackup ? "#00FF87" : "#1E222D",
                      color: hasConfirmedBackup ? "#08090C" : "#64748B",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: hasConfirmedBackup ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon icon="mage:check" /> Konto jetzt aktivieren
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RESTORE ACCOUNT */}
        {/* ======================================================== */}
        {activeTab === "restore" && (
          <form onSubmit={handleRestoreSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#38BDF8", fontWeight: "700", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mage:key" /> Deterministiche Wiederherstellung
              </div>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0, lineHeight: "1.4" }}>
                Gib deine 12 Wörter ein (durch Leerzeichen getrennt). Die Identität, deine Signaturschlüssel und deine AIN werden mathematisch exakt wiederhergestellt.
              </p>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                12-WORT PHRASE (BIP-39 SEED) *
              </label>
              <textarea
                rows={3}
                placeholder="z. B. apple breeze winter castle flame silver orbit galaxy radar stone drift ocean"
                value={restoreWords}
                onChange={(e) => setRestoreWords(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#0D0E12",
                  border: "1px solid #262933",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#FFF",
                  fontFamily: "monospace",
                  outline: "none",
                  resize: "vertical"
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                ANZEIGENAME / ALIAS FÜR DIESES GERÄT
              </label>
              <input
                type="text"
                placeholder="z. B. CipherSovereign"
                value={restoreAlias}
                onChange={(e) => setRestoreAlias(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#0D0E12",
                  border: "1px solid #262933",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#FFF",
                  outline: "none"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isRestoring}
              style={{
                backgroundColor: "#38BDF8",
                color: "#08090C",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px"
              }}
            >
              <Icon icon="mage:refresh" />
              {isRestoring ? "Leite kryptografische Identität ab..." : "Identität wiederherstellen"}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MANAGE SAVED IDENTITIES */}
        {/* ======================================================== */}
        {activeTab === "manage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                GESPEICHERTE PROFILE AUF DIESEM GERÄT (SQLITE):
              </span>
              <span style={{ fontSize: "11px", color: "#A855F7", fontWeight: "600" }}>
                {savedIdentities.length} Identität(en)
              </span>
            </div>

            {savedIdentities.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748B", fontSize: "12px" }}>
                Keine gespeicherten Identitäten in der lokalen Datenbank gefunden.
              </div>
            ) : (
              savedIdentities.map((idn) => {
                const isActive = currentIdentity?.ain === idn.ain || idn.isActive;
                return (
                  <div
                    key={idn.ain}
                    style={{
                      backgroundColor: isActive ? "rgba(0, 255, 135, 0.08)" : "#0D0E12",
                      border: isActive ? "1px solid #00FF87" : "1px solid #1E222D",
                      borderRadius: "10px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: isActive ? "#00FF87" : "#1E222D",
                            color: isActive ? "#08090C" : "#94A3B8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "14px"
                          }}
                        >
                          {idn.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFF", display: "flex", alignItems: "center", gap: "6px" }}>
                            {idn.username}
                            {isActive && (
                              <span style={{ fontSize: "9px", backgroundColor: "rgba(0,255,135,0.2)", color: "#00FF87", padding: "2px 6px", borderRadius: "4px" }}>
                                AKTIV
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "10px", color: "#94A3B8", fontFamily: "monospace" }}>
                            {idn.ain}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSelectIdentity(idn)}
                            style={{
                              backgroundColor: "#161922",
                              border: "1px solid #262933",
                              color: "#00FF87",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Icon icon="mage:check" /> Aktivieren
                          </button>
                        )}
                        {idn.mnemonic && (
                          <button
                            type="button"
                            onClick={() => setShowSeedAin(showSeedAin === idn.ain ? null : idn.ain)}
                            style={{
                              backgroundColor: "#161922",
                              border: "1px solid #262933",
                              color: "#F59E0B",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="12 Wörter anzeigen"
                          >
                            <Icon icon="mage:key" /> Seed
                          </button>
                        )}
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteIdentity(idn.ain)}
                            style={{
                              backgroundColor: "#161922",
                              border: "1px solid #262933",
                              color: "#EF4444",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              cursor: "pointer"
                            }}
                            title="Identität löschen"
                          >
                            <Icon icon="mage:trash" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Revealer for Seed Phrase */}
                    {showSeedAin === idn.ain && idn.mnemonic && (
                      <div style={{ backgroundColor: "#090A0D", border: "1px solid #F59E0B", borderRadius: "6px", padding: "8px", marginTop: "4px" }}>
                        <div style={{ fontSize: "10px", color: "#F59E0B", fontWeight: "600", marginBottom: "4px" }}>
                          12-Wort Wiederherstellungsphrase:
                        </div>
                        <div style={{ fontSize: "11px", color: "#FFF", fontFamily: "monospace", wordBreak: "break-word" }}>
                          {idn.mnemonic}
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleCopyMnemonic(idn.mnemonic!)}
                            style={{ background: "#161922", border: "1px solid #262933", color: "#E2E8F0", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" }}
                          >
                            Kopieren
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadBackup(idn.mnemonic!, idn.ain)}
                            style={{ background: "#161922", border: "1px solid #262933", color: "#38BDF8", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" }}
                          >
                            Als Datei sichern
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
