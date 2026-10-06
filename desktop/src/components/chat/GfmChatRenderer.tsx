import React, { useMemo } from "react";
import { marked } from "marked";
import { Icon } from "@iconify/react";

export interface GfmChatRendererProps {
  text: string;
  isBoxed?: boolean;
  author?: string;
  time?: string;
  onOpenPrivacyBrowser?: (url: string) => void;
  showToast?: (msg: string) => void;
  onDelete?: () => void;
}

// Transform GitHub Flavored Markdown (GFM) Alerts: > [!NOTE], > [!TIP], etc.
function transformGithubAlerts(rawHtml: string): string {
  return rawHtml.replace(
    /<blockquote[^>]*>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*<br\s*\/?>)?\s*([\s\S]*?)<\/blockquote>/gi,
    (_, alertType, innerContent) => {
      const type = alertType.toUpperCase();
      let alertClass = "gfm-alert-note";
      let title = "Hinweis";
      let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

      if (type === "TIP") {
        alertClass = "gfm-alert-tip";
        title = "Tipp";
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF87" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path></svg>`;
      } else if (type === "IMPORTANT") {
        alertClass = "gfm-alert-important";
        title = "Wichtig";
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      } else if (type === "WARNING") {
        alertClass = "gfm-alert-warning";
        title = "Warnung";
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      } else if (type === "CAUTION") {
        alertClass = "gfm-alert-caution";
        title = "Achtung";
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      }

      const formattedContent = innerContent.trim();
      return `<div class="gfm-alert ${alertClass}">
        <div class="gfm-alert-title">
          ${iconSvg}
          <span>${title}</span>
        </div>
        <div class="gfm-alert-content">
          ${formattedContent.startsWith("<p>") ? formattedContent : `<p>${formattedContent}</p>`}
        </div>
      </div>`;
    }
  );
}

// Transform Code Blocks to include header banner and copy button
function transformCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code><\/pre>/gi,
    (_, lang, codeContent) => {
      const displayLang = (lang || "code").toUpperCase();
      return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">${displayLang}</span>
          <button class="code-copy-btn" type="button" title="Code kopieren">Kopieren</button>
        </div>
        <pre><code class="${lang ? `language-${lang}` : ""}">${codeContent}</code></pre>
      </div>`;
    }
  );
}

export const GfmChatRenderer: React.FC<GfmChatRendererProps> = ({
  text,
  isBoxed = false,
  author,
  time,
  onOpenPrivacyBrowser,
  showToast,
  onDelete
}) => {
  // Check if explicitly commanded via "/boxed"
  const hasBoxedCommand = (text || "").trim().startsWith("/boxed");
  const effectiveBoxed = isBoxed || hasBoxedCommand;

  // Clean raw source
  const rawSource = useMemo(() => {
    if (hasBoxedCommand) {
      return (text || "").trim().replace(/^\/boxed\s*/i, "");
    }
    return text || "";
  }, [text, hasBoxedCommand]);

  // Parse Markdown to HTML
  const parsedHtml = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true
      });
      const rawHtml = marked.parse(rawSource, { async: false }) as string;
      const withAlerts = transformGithubAlerts(rawHtml);
      return transformCodeBlocks(withAlerts);
    } catch (e) {
      console.error("[GfmChatRenderer] Markdown Parsing Error:", e);
      return `<p>${rawSource.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    }
  }, [rawSource]);

  // Delegated clicks for code copy and links
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Delegated code copy button
    const copyBtn = target.closest(".code-copy-btn") as HTMLButtonElement | null;
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const codeWrapper = copyBtn.closest(".code-block-wrapper");
      const codeEl = codeWrapper?.querySelector("code");
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.innerText);
        copyBtn.textContent = "Kopiert! ✓";
        setTimeout(() => {
          copyBtn.textContent = "Kopieren";
        }, 2000);
        if (showToast) showToast("Codeblock in die Zwischenablage kopiert! 📋");
      }
      return;
    }

    // 2. Delegated link handling (Privacy Browser)
    const linkEl = target.closest("a") as HTMLAnchorElement | null;
    if (linkEl && linkEl.href) {
      e.preventDefault();
      e.stopPropagation();
      if (onOpenPrivacyBrowser) {
        onOpenPrivacyBrowser(linkEl.href);
      } else {
        window.open(linkEl.href, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleCopyCardContent = () => {
    navigator.clipboard.writeText(rawSource);
    if (showToast) showToast("Inhalt in die Zwischenablage kopiert! 📋");
  };

  if (!rawSource.trim()) {
    return null;
  }

  if (effectiveBoxed) {
    return (
      <div className="boxed-message-card" onClick={handleContainerClick}>
        <div className="boxed-message-header">
          <div className="boxed-message-badge">
            <Icon icon="mage:file-records" className="boxed-badge-icon" />
            <span>{author ? `${author.toUpperCase()} • DOKUMENT` : "REGELWERK & DOKUMENTATION"}</span>
          </div>
          <div className="boxed-message-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {time && <span className="boxed-message-time" style={{ fontSize: "11px", color: "var(--text-muted, #94A3B8)" }}>{time}</span>}
            <button
              type="button"
              className="boxed-copy-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCardContent();
              }}
              title="Vollständigen Inhalt kopieren"
            >
              <Icon icon="mage:copy" />
              <span>Kopieren</span>
            </button>
            {onDelete && (
              <button
                type="button"
                className="boxed-copy-btn boxed-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Eintrag löschen"
                style={{ color: "#EF4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
              >
                <Icon icon="mage:trash" />
                <span>Löschen</span>
              </button>
            )}
          </div>
        </div>
        <div
          className="zeno-markdown-body chat-markdown boxed-message-body"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      </div>
    );
  }

  return (
    <div
      className="zeno-markdown-body chat-markdown"
      onClick={handleContainerClick}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};
export default GfmChatRenderer;

