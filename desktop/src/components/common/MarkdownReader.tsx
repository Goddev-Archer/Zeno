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
  // Configure marked for clean HTML
  const parsedHtml = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content || "") as string;
    } catch (e) {
      console.error("Markdown parse error:", e);
      return `<p>${content}</p>`;
    }
  }, [content]);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
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
                <Icon icon="mage:code" /> Im Editor öffnen
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
