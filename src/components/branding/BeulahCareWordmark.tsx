import React from 'react';

interface BeulahCareWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  simplified?: boolean; // For small sizes where glow might not render well
}

/**
 * Beulah-Care Wordmark Logo - Clinical Elegance Design
 *
 * Design Features:
 * - Weight contrast: Bold "Beulah" + Regular "Care" creates visual hierarchy
 * - Glowing hyphen: Medical-grade aesthetic with subtle cyan glow
 * - Glowing underline: Gradient accent beneath "Care" for premium feel
 * - Professional typography: DM Sans for clinical yet warm appearance
 *
 * This wordmark clearly signals "brand logo" rather than plain text through:
 * - Intentional weight differentiation
 * - Decorative glow elements
 * - Styled hyphen (not keyboard punctuation)
 * - Precise spacing and color coordination
 */
export const BeulahCareWordmark: React.FC<BeulahCareWordmarkProps> = ({
  size = 'md',
  className = '',
  simplified = false,
}) => {
  const sizeConfig = {
    sm: {
      fontSize: '18px',
      hyphenGlow: '3px',
      underlineHeight: '2px',
      underlineOffset: '-3px',
      glowBlur: '6px',
    },
    md: {
      fontSize: '24px',
      hyphenGlow: '5px',
      underlineHeight: '2.5px',
      underlineOffset: '-3px',
      glowBlur: '8px',
    },
    lg: {
      fontSize: '32px',
      hyphenGlow: '6px',
      underlineHeight: '3px',
      underlineOffset: '-4px',
      glowBlur: '10px',
    },
    xl: {
      fontSize: '40px',
      hyphenGlow: '8px',
      underlineHeight: '4px',
      underlineOffset: '-5px',
      glowBlur: '12px',
    },
  };

  const config = sizeConfig[size];

  // Simplified version for very small sizes (no glow effects)
  if (simplified) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily:
            '"DM Sans", -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
          fontSize: config.fontSize,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontWeight: 700, color: '#1A5F7A' }}>Beulah</span>
        <span style={{ fontWeight: 400, color: '#159A9C', margin: '0 0.1em' }}>-</span>
        <span style={{ fontWeight: 400, color: '#159A9C' }}>Care</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
        fontSize: config.fontSize,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Beulah - Bold, Deep Medical Blue */}
      <span
        style={{
          fontWeight: 700,
          color: '#1A5F7A',
          letterSpacing: '0em',
        }}
      >
        Beulah
      </span>

      {/* Styled Hyphen with Subtle Glow */}
      <span
        style={{
          fontWeight: 400,
          color: '#159A9C',
          margin: '0 0.15em',
          textShadow: `0 0 ${config.hyphenGlow} rgba(58, 180, 197, 0.6)`,
          display: 'inline-block',
          transform: 'scaleX(1.5)',
        }}
        aria-hidden="true"
      >
        −
      </span>

      {/* Care - Regular weight, with glowing underline */}
      <span
        style={{
          position: 'relative',
          fontWeight: 400,
          color: '#159A9C',
          letterSpacing: '0.02em',
        }}
      >
        Care
        {/* Glowing Gradient Underline */}
        <span
          style={{
            position: 'absolute',
            bottom: config.underlineOffset,
            left: 0,
            right: 0,
            height: config.underlineHeight,
            background: 'linear-gradient(90deg, #159A9C 0%, rgba(58, 180, 197, 0.5) 100%)',
            borderRadius: '2px',
            boxShadow: `0 0 ${config.glowBlur} rgba(58, 180, 197, 0.4)`,
          }}
          aria-hidden="true"
        />
      </span>
    </div>
  );
};

/**
 * Compact version for use in tight spaces (like mobile headers)
 * Removes underline glow to save space
 */
export const BeulahCareWordmarkCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '20px',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 700, color: '#1A5F7A' }}>Beulah</span>
      <span
        style={{
          fontWeight: 400,
          color: '#159A9C',
          margin: '0 0.12em',
          textShadow: '0 0 4px rgba(58, 180, 197, 0.5)',
          display: 'inline-block',
          transform: 'scaleX(1.4)',
        }}
      >
        −
      </span>
      <span style={{ fontWeight: 400, color: '#159A9C', letterSpacing: '0.01em' }}>Care</span>
    </div>
  );
};
