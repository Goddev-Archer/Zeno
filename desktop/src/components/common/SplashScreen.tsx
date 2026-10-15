import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { ZenoLogo } from "./ZenoLogo";

interface SplashScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

const BOOT_STEPS = [
  { label: "Initialisiere kryptografische Schlüssel (Ed25519 & X25519)...", progress: 28 },
  { label: "Verbinde mit dezentraler P2P-Relay-Topologie...", progress: 58 },
  { label: "Lade Erweiterungen, Sandboxing & Theme Studio...", progress: 88 },
  { label: "System bereit. Willkommen bei Zeno.", progress: 100 }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1400
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const stepDuration = minDurationMs / BOOT_STEPS.length;

    const timer1 = setTimeout(() => {
      setCurrentStepIndex(1);
      setProgress(BOOT_STEPS[1].progress);
    }, stepDuration * 0.8);

    const timer2 = setTimeout(() => {
      setCurrentStepIndex(2);
      setProgress(BOOT_STEPS[2].progress);
    }, stepDuration * 1.6);

    const timer3 = setTimeout(() => {
      setCurrentStepIndex(3);
      setProgress(BOOT_STEPS[3].progress);
    }, stepDuration * 2.3);

    const timerFade = setTimeout(() => {
      setIsFadingOut(true);
    }, minDurationMs);

    const timerComplete = setTimeout(() => {
      setIsDone(true);
      onComplete?.();
    }, minDurationMs + 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerFade);
      clearTimeout(timerComplete);
    };
  }, [minDurationMs, onComplete]);

  if (isDone) return null;

  return (
    <div
      className={`zeno-splash-screen ${isFadingOut ? "fade-out" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "var(--bg-primary, #0c0d11)",
        backgroundImage: "radial-gradient(circle at 50% 42%, rgba(53, 116, 240, 0.12) 0%, rgba(12, 13, 17, 0.98) 75%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: isFadingOut ? "none" : "auto",
        transition: "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? "scale(1.02)" : "scale(1)",
        userSelect: "none"
      }}
    >
      {/* Ambient background rings */}
      <div
        style={{
          position: "absolute",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          border: "1px solid rgba(53, 116, 240, 0.15)",
          pointerEvents: "none",
          animation: "splashRingPulse 3s ease-in-out infinite"
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          border: "1px dashed rgba(0, 255, 135, 0.1)",
          pointerEvents: "none",
          animation: "splashRingRotate 20s linear infinite"
        }}
      />

      {/* Emblem & Branding */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "28px"
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "96px",
            height: "96px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(53, 116, 240, 0.35) 0%, rgba(0, 255, 135, 0.2) 100%)",
            filter: "blur(18px)",
            transform: "scale(1.2)"
          }}
        />
        <ZenoLogo size={80} withFrame colorMode="brand" />
      </div>

      <h1
        style={{
          fontSize: "26px",
          fontWeight: "800",
          letterSpacing: "6px",
          color: "var(--text-primary, #ffffff)",
          margin: "0 0 6px 0",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        ZENO
      </h1>

      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted, #8a8d9b)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          margin: "0 0 32px 0",
          fontWeight: "500"
        }}
      >
        Sovereign P2P Messenger & Workspace
      </p>

      {/* Progress & Step Info */}
      <div
        style={{
          width: "280px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center"
        }}
      >
        {/* Progress Bar Track */}
        <div
          style={{
            width: "100%",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderRadius: "99px",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--accent-color, #3574f0) 0%, #00ff87 100%)",
              borderRadius: "99px",
              transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 0 10px rgba(0, 255, 135, 0.5)"
            }}
          />
        </div>

        {/* Step Status Text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "11px",
            color: "var(--text-muted, #8a8d9b)"
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "230px" }}>
            {BOOT_STEPS[currentStepIndex].label}
          </span>
          <span style={{ fontWeight: "600", color: "var(--text-primary, #ffffff)", fontSize: "10px" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Security & P2P status badge at the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "10px",
          color: "rgba(255, 255, 255, 0.35)",
          letterSpacing: "0.5px"
        }}
      >
        <Icon icon="octicon:shield-check-16" style={{ color: "#00ff87" }} />
        <span>End-to-End Encrypted • Zero Telemetry • Sovereign</span>
      </div>
    </div>
  );
};

