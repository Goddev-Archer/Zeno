import React, { useMemo } from "react";
import { marked } from "marked";
import { Icon } from "@iconify/react";

interface MarkdownReaderProps {
  content: string;
  title?: string;
  badge?: string;
  badgeColor?: string;
  showCopyAll?: boolean;
  onOpenInEditor?: (code: string) => void;
  style?: React.CSSProperties;
}

export const MarkdownReader: React.FC<MarkdownReaderProps> = ({
  content,
  title,
  badge,
  badgeColor = "#38BDF8",
  showCopyAll = true,
  onOpenInEditor,
  style
}) => {
  // Transform GitHub Flavored Markdown (GFM) Alerts: > [!NOTE], > [!TIP], etc.
  const transformGithubAlerts = (rawHtml: string): string => {
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
  };

  // Transform Code Blocks to include header banner and copy button
  const transformCodeBlocks = (html: string): string => {
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
  };

  // Configure marked for clean GFM HTML
  const parsedHtml = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      const html = marked.parse(content || "") as string;
      const withAlerts = transformGithubAlerts(html);
      return transformCodeBlocks(withAlerts);
    } catch (e) {
      console.error("Markdown parse error:", e);
      return `<p>${content}</p>`;
    }
  }, [content]);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
  };

  const handleMarkdownBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const copyBtn = target.closest(".code-copy-btn") as HTMLButtonElement | null;
    if (copyBtn) {
      const codeEl = copyBtn.closest(".code-block-wrapper")?.querySelector("pre code");
      if (codeEl && codeEl.textContent) {
        navigator.clipboard.writeText(codeEl.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Kopiert! ✓";
        copyBtn.style.color = "#00FF87";
        setTimeout(() => {
          copyBtn.textContent = originalText || "Kopieren";
          copyBtn.style.color = "";
        }, 2000);
      }
    }
  };

  return (
    <div
      className="zeno-markdown-reader-container"
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-primary, #111319)",
        borderRadius: "12px",
        border: "1px solid var(--border-color, #1E222D)",
        overflow: "hidden",
        color: "var(--text-primary, #E2E8F0)",
        ...style
      }}
    >
      {/* Header Bar */}
      {(title || badge) && (
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: "var(--bg-secondary, #161922)",
            borderBottom: "1px solid var(--border-color, #1E222D)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon icon="mage:file-records" style={{ color: badgeColor, fontSize: "18px" }} />
            {title && <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#FFF" }}>{title}</h3>}
            {badge && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: `${badgeColor}22`,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}44`
                }}
              >
                {badge}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {onOpenInEditor && (
              <button
                onClick={() => onOpenInEditor(content)}
                style={{
                  background: "#1E222D",
                  border: "1px solid #2B303C",
                  color: "#E2E8F0",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                title="In Monaco-Editor bearbeiten"
              >
                <Icon icon="lucide:code" /> Im Editor öffnen
              </button>
            )}
            {showCopyAll && (
              <button
                onClick={handleCopyContent}
                style={{
                  background: "#1E222D",
                  border: "1px solid #2B303C",
                  color: "#E2E8F0",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                title="Gesamten Markdown-Text kopieren"
              >
                <Icon icon="mage:copy" /> Markdown kopieren
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rendered HTML Area */}
      <div
        className="zeno-markdown-body"
        onClick={handleMarkdownBodyClick}
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
        style={{
          padding: "20px 24px",
          overflowY: "auto",
          fontSize: "13px",
          lineHeight: "1.65",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      />
    </div>
  );
};
