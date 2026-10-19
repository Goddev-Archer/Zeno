# Security Policy — Zeno Messenger & Workspace

Die Sicherheit und Integrität von **Zeno** hat höchste Priorität. Als Zero-Knowledge- und Ende-zu-Ende-verschlüsselte Entwicklerplattform setzen wir auf transparente, überprüfbare Kryptografie und unterstützen die koordinierte Meldung von Schwachstellen (Coordinated Vulnerability Disclosure).

---

## 🛡️ Unterstützte Versionen (Supported Versions)

Wir stellen Sicherheitsupdates und Patches für die jeweils aktuelle Minor-Version bereit. Ältere Versionen werden nicht mehr gepatcht.

| Version | Unterstützt / Sicherheits-Patches | Status |
| :--- | :--- | :--- |
| `0.2.x` | :white_check_mark: Ja | Aktuelle Alpha |
| `0.1.x` | :x: Nein | Deprecated |
| `< 0.1.0` | :x: Nein | Nicht unterstützt |

---

## 🔒 Melden einer Sicherheitslücke (Reporting a Vulnerability)

Wenn du eine potenzielle Sicherheitslücke oder eine kryptografische Schwachstelle in Zeno entdeckt hast, melde diese bitte **vertraulich** direkt an die Entwickler, anstatt ein öffentliches GitHub-Issue zu erstellen.

### Kontakt:
* **E-Mail:** [goddevarcher@outlook.com](mailto:goddevarcher@outlook.com)
* **GPG Key ID:** `A3ACEB626EBFB7EC` (Zeno Official Release & Security Key)
* **Öffentlicher Schlüssel:** Enthalten in den Release-Paketen (`zeno-release-public-key.asc`).

### Empfohlener Inhalt deiner Meldung:
1. **Zusammenfassung:** Art der Schwachstelle (z. B. Memory Corruption, Cryptographic Implementation Flaw, Path Traversal, Sandbox Bypass).
2. **Reproduktionsschritte:** Genaue Anleitung oder Proof-of-Concept (PoC) zur Reproduktion des Verhaltens.
3. **Betroffene Komponenten & Version:** Betroffenes Betriebssystem, Zeno-Version, Commit-Hash oder Library.
4. **Mögliche Auswirkungen:** Welcher Schaden könnte im schlimmsten Fall für Nutzer oder deren Daten entstehen?

---

## ⏱️ Unser Reaktionsprozess (Response Timeline)

1. **Eingangsbestätigung:** Wir bestätigen den Erhalt deiner Meldung in der Regel innerhalb von **48 bis 72 Stunden**.
2. **Verifikation & Triage:** Wir analysieren das Problem und stufen den Schweregrad ein.
3. **Behebung & Patch:** Wir entwickeln einen Fix in einem privaten Branch und testen die Behebung.
4. **Veröffentlichung & Danksagung:** Sobald ein Release mit dem Fix veröffentlicht wird, erfolgt ein Coordinated Advisory. Auf Wunsch wirst du namentlich oder mit deinem Pseudonym in den Release Notes gewürdigt.

---

## 🎯 Geltungsbereich (Scope)

### Im Scope:
* Schwachstellen in der Ende-zu-Ende-Verschlüsselung (Argon2id, AES-256-GCM, P2P Key-Exchange).
* Code Execution / Sandbox Bypasses in der integrierten In-Chat IDE oder Monaco-Komponenten.
* Privilege Escalation oder Denial of Service des nativen Tauri-v2-Backends.
* Path Traversal oder unautorisierter Dateizugriff über Git-Source-Control-APIs.

### Nicht im Scope:
* Physischer Zugriff auf ein entsperrtes Zielgerät.
* Social Engineering / Phishing gegen Projektmitwirkende.
* Denial-of-Service-Angriffe durch absichtliche Überlastung der lokalen Loopback-Schnittstelle.
* Modifizierte Binaries ohne gültige GPG-Signatur von Zeno.

---

Vielen Dank, dass du dazu beiträgst, Zeno für alle Entwickler und Nutzer sicher zu halten!
