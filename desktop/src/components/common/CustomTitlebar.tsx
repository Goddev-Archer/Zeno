import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnvironment } from "../../services/cryptoService";

interface CustomTitlebarProps {
  title?: string;
  subtitle?: string;
  isPopout?: boolean;
  theme?: string;
  onToggleTheme?: () => void;
}

export const CustomTitlebar: React.FC<CustomTitlebarProps> = ({
  title = "Zeno",
  subtitle,
  isPopout = false,
  theme,
  onToggleTheme
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const isTauri = isTauriEnvironment();

  useEffect(() => {
    if (isTauri) {
      try {
        getCurrentWindow().isMaximized().then(setIsMaximized).catch(() => {
          invoke<boolean>("window_is_maximized").then(setIsMaximized).catch(() => {});
        });
      } catch {
        invoke<boolean>("window_is_maximized").then(setIsMaximized).catch(() => {});
      }

      const handleResize = () => {
        try {
          getCurrentWindow().isMaximized().then(setIsMaximized).catch(() => {});
        } catch {
          invoke<boolean>("window_is_maximized").then(setIsMaximized).catch(() => {});
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isTauri]);

  useEffect(() => {
    if (isPopout) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (isTauri) {
            getCurrentWindow().close().catch(() => {
              invoke("window_close").catch(() => window.close());
            });
          } else {
            window.close();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isPopout, isTauri]);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTauri) {
      try {
        await getCurrentWindow().minimize();
      } catch {
        try {
          await invoke("window_minimize");
        } catch (err) {
          console.warn("Minimize error:", err);
        }
      }
    }
  };

  const handleToggleMaximize = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTauri) {
      try {
        await getCurrentWindow().toggleMaximize();
        const max = await getCurrentWindow().isMaximized();
        setIsMaximized(max);
      } catch {
        try {
          const nextMax = await invoke<boolean>("window_toggle_maximize");
          setIsMaximized(nextMax);
        } catch (err) {
          console.warn("Toggle maximize error:", err);
        }
      }
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTauri) {
      try {
        await getCurrentWindow().close();
        return;
      } catch (err) {
        console.warn("getCurrentWindow().close() error:", err);
      }
      try {
        await getCurrentWindow().destroy();
        return;
      } catch (err) {
        console.warn("getCurrentWindow().destroy() error:", err);
      }
      try {
        await invoke("window_close");
        return;
      } catch (err) {
        console.warn("invoke('window_close') error:", err);
      }
    }
    window.close();
  };

  return (
    <header
      className="zeno-custom-titlebar"
      data-tauri-drag-region
      onDoubleClick={handleToggleMaximize}
    >
      {/* ── Left: App Brand & Context ── */}
      <div className="titlebar-left" data-tauri-drag-region>
        <div className="titlebar-icon-wrap" data-tauri-drag-region>
          <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="var(--accent-oxide, #F97316)" strokeWidth="8" />
            <circle cx="50" cy="50" r="28" stroke="var(--accent-color, #38BDF8)" strokeWidth="6" />
            <circle cx="50" cy="50" r="10" fill="var(--accent-oxide, #F97316)" />
          </svg>
        </div>

        <span className="titlebar-app-name" data-tauri-drag-region>
          ZENO
        </span>

        {subtitle && (
          <span className="titlebar-breadcrumb" data-tauri-drag-region>
            <span className="titlebar-divider">/</span>
            <span className="titlebar-subtitle">{subtitle}</span>
          </span>
        )}

        {isPopout && (
          <span className="titlebar-popout-badge" data-tauri-drag-region>
            POPOUT
          </span>
        )}
      </div>

      {/* ── Center: Window Title & Status (Draggable) ── */}
      <div className="titlebar-center" data-tauri-drag-region>
        <span className="titlebar-title-text" data-tauri-drag-region>
          {title}
        </span>
      </div>

      {/* ── Right: Controls (Theme & Window Actions) ── */}
      <div className="titlebar-right">
        {onToggleTheme && (
          <button
            type="button"
            className="titlebar-tool-btn"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Zum hellen Theme wechseln" : "Zum dunklen Theme wechseln"}
          >
            <Icon icon={theme === "dark" ? "mage:sun" : "mage:moon"} style={{ fontSize: "14px" }} />
          </button>
        )}

        {/* Discord / Native Window Controls */}
        <div className="titlebar-window-controls">
          <button
            type="button"
            className="titlebar-btn btn-minimize"
            onClick={handleMinimize}
            title="Minimieren"
          >
            <Icon icon="codicon:chrome-minimize" style={{ fontSize: "14px" }} />
          </button>

          <button
            type="button"
            className="titlebar-btn btn-maximize"
            onClick={handleToggleMaximize}
            title={isMaximized ? "Verkleinern" : "Maximieren"}
          >
            <Icon icon={isMaximized ? "codicon:chrome-restore" : "codicon:chrome-maximize"} style={{ fontSize: "14px" }} />
          </button>

          <button
            type="button"
            className="titlebar-btn btn-close"
            onClick={handleClose}
            title="Schließen"
          >
            <Icon icon="codicon:chrome-close" style={{ fontSize: "14px" }} />
          </button>
        </div>
      </div>
    </header>
  );
};
