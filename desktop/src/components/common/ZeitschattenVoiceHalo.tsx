import React, { useEffect, useState, useRef } from "react";

interface ZeitschattenVoiceHaloProps {
  isSpeaking: boolean;
  audioLevel?: number; // 0.0 to 1.0
  size?: number; // in pixels
  color?: string; // primary color hex, default #00FF87
  secondaryColor?: string; // secondary color hex, default #38BDF8
  children: React.ReactNode;
}

/**
 * Zeitschatten (Time Shifting Shadows / Temporal Echo Shells)
 * Implements the design pattern from zeitschatten skill:
 * 1. Strict Signal Gating: 100% invisible when not speaking or silent (alpha = 0).
 * 2. Interleaved Wavefronts: N concentric shells expanding with phase offset.
 * 3. Temporal Lag & Sinusoidal Fade envelope.
 */
export const ZeitschattenVoiceHalo: React.FC<ZeitschattenVoiceHaloProps> = ({
  isSpeaking,
  audioLevel = 0,
  size = 28,
  color = "#00FF87",
  secondaryColor = "#38BDF8",
  children
}) => {
  const [phase, setPhase] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSpeaking) {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    let startTime = performance.now();
    const cycleSpeed = 0.0016; // speed factor

    const loop = (now: number) => {
      const elapsed = (now - startTime) * cycleSpeed;
      setPhase(elapsed);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSpeaking]);

  // Audio Gating (Skill Rule 1: Stille = 100% Unsichtbarkeit)
  const effectiveAudio = isSpeaking ? Math.max(audioLevel, 0.25) : 0;
  const isVisible = isSpeaking && effectiveAudio > 0.01;

  // Number of interleaved shells (Skill Rule 2)
  const shellCount = 3;
  const maxExpansion = 0.28; // Up to +28% radius

  return (
    <div
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* Concentric Zeitschatten Echo Shells */}
      {isVisible &&
        Array.from({ length: shellCount }).map((_, k) => {
          const tau = (phase + k / shellCount) % 1.0;
          // Scale from 1.0 to 1.0 + maxExpansion (Skill Rule 3)
          const scale = 1.0 + tau * maxExpansion * (0.8 + effectiveAudio * 0.4);
          // Sinusoidal fade envelope (Skill Rule 5)
          const alpha = Math.sin(tau * Math.PI) * (1.0 - 0.35 * tau) * Math.min(effectiveAudio * 1.3, 1.0);

          return (
            <div
              key={k}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                pointerEvents: "none",
                transform: `scale(${scale})`,
                border: `1.5px solid ${k % 2 === 0 ? color : secondaryColor}`,
                opacity: alpha * 0.85,
                boxShadow: `0 0 ${8 + tau * 12}px ${color}${Math.floor(alpha * 180)
                  .toString(16)
                  .padStart(2, "0")}`,
                transition: "opacity 0.08s ease"
              }}
            />
          );
        })}

      {/* Main Core Element */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          boxShadow: isVisible
            ? `0 0 10px ${color}88, inset 0 0 4px ${color}66`
            : "none",
          transition: "box-shadow 0.15s ease"
        }}
      >
        {children}
      </div>
    </div>
  );
};
