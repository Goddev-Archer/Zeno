import React from 'react';

export interface ZenoLogoProps {
  size?: number | string;
  className?: string;
  withFrame?: boolean;
  withText?: boolean;
  colorMode?: 'brand' | 'monochrome' | 'oxide' | 'relay';
}

/**
 * Zeno Official Logo Component
 * Geometric 'Z' formed from 3 connected P2P nodes interlocking with code-brackets < >.
 * Supports Brand colors (Oxide Orange & Relay Cyan), Monochrome, and optional Squircle Frame.
 */
export const ZenoLogo: React.FC<ZenoLogoProps> = ({
  size = 32,
  className = '',
  withFrame = false,
  withText = false,
  colorMode = 'brand',
}) => {
  // Color configuration
  const oxideColor = colorMode === 'monochrome' ? 'currentColor' : 'var(--accent-oxide, #F97316)';
  const relayColor = colorMode === 'monochrome' ? 'currentColor' : 'var(--accent-relay, #38BDF8)';
  const strokeColor = colorMode === 'monochrome' 
    ? 'currentColor' 
    : colorMode === 'oxide' 
      ? 'var(--accent-oxide, #F97316)' 
      : colorMode === 'relay' 
        ? 'var(--accent-relay, #38BDF8)' 
        : 'var(--text-primary, #F4F4F6)';

  return (
    <div 
      className={`zeno-logo-container ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', verticalAlign: 'middle' }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="zenoZGrad" x1="28%" y1="28%" x2="72%" y2="72%">
            <stop offset="0%" stopColor={oxideColor} />
            <stop offset="50%" stopColor={strokeColor} />
            <stop offset="100%" stopColor={relayColor} />
          </linearGradient>
        </defs>

        {/* Optional Squircle Frame */}
        {withFrame && (
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="22"
            ry="22"
            fill="var(--bg-elevated, rgba(31, 31, 41, 0.5))"
            stroke={colorMode === 'brand' ? 'var(--border-island, #262633)' : strokeColor}
            strokeWidth="2.5"
          />
        )}

        {/* Left Code Bracket: < */}
        <path
          d="M 37 33 L 24 42 L 37 51"
          stroke={oxideColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Code Bracket: > */}
        <path
          d="M 63 49 L 76 58 L 63 67"
          stroke={relayColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Geometric 'Z' Main Track */}
        <path
          d="M 32 28 L 68 28 L 32 72 L 68 72"
          stroke="url(#zenoZGrad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3 Connected P2P Nodes */}
        {/* Node 1: Top-Left (Oxide) */}
        <circle cx="32" cy="28" r="4.2" fill={oxideColor} />
        
        {/* Node 2: Center Diagonal Intersection (Relay/Core) */}
        <circle cx="50" cy="50" r="4.8" fill={relayColor} />
        <circle cx="50" cy="50" r="2.2" fill="var(--bg-canvas, #08080B)" />

        {/* Node 3: Bottom-Right (Relay) */}
        <circle cx="68" cy="72" r="4.2" fill={relayColor} />
      </svg>

      {withText && (
        <span 
          style={{ 
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', 
            fontWeight: 700, 
            letterSpacing: '0.18em',
            fontSize: typeof size === 'number' ? `${size * 0.55}px` : '16px',
            color: 'var(--text-primary, #F4F4F6)',
            textTransform: 'uppercase',
            lineHeight: 1
          }}
        >
          Zeno
        </span>
      )}
    </div>
  );
};

export default ZenoLogo;
