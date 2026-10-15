import React from 'react';

export interface ZenoLogoProps {
  size?: number | string;
  className?: string;
  withFrame?: boolean;
  withText?: boolean;
  colorMode?: 'brand' | 'monochrome' | 'oxide' | 'relay';
}

export const ZenoLogo: React.FC<ZenoLogoProps> = ({
  size = 32,
  className = '',
  withFrame = false,
  withText = false,
  colorMode = 'brand',
}) => {
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', verticalAlign: 'middle' }}
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
          <linearGradient id="webZenoZGrad" x1="28%" y1="28%" x2="72%" y2="72%">
            <stop offset="0%" stopColor={oxideColor} />
            <stop offset="50%" stopColor={strokeColor} />
            <stop offset="100%" stopColor={relayColor} />
          </linearGradient>
        </defs>

        {withFrame && (
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="22"
            ry="22"
            fill="var(--bg-elevated, rgba(31, 31, 41, 0.6))"
            stroke={colorMode === 'brand' ? 'var(--border-island, #262633)' : strokeColor}
            strokeWidth="2.5"
          />
        )}

        <path
          d="M 37 33 L 24 42 L 37 51"
          stroke={oxideColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 63 49 L 76 58 L 63 67"
          stroke={relayColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 32 28 L 68 28 L 32 72 L 68 72"
          stroke="url(#webZenoZGrad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="32" cy="28" r="4.2" fill={oxideColor} />
        <circle cx="50" cy="50" r="4.8" fill={relayColor} />
        <circle cx="50" cy="50" r="2.2" fill="var(--bg-canvas, #08080B)" />
        <circle cx="68" cy="72" r="4.2" fill={relayColor} />
      </svg>

      {withText && (
        <span 
          style={{ 
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', 
            fontWeight: 800, 
            letterSpacing: '0.15em',
            fontSize: typeof size === 'number' ? `${size * 0.55}px` : '18px',
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
