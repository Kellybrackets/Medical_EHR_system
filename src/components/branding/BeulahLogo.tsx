import React from 'react';

interface BeulahLogoProps {
  size?: number;
  variant?: 'default' | 'dark' | 'mono';
  withWordmark?: boolean;
  className?: string;
}

/**
 * Beulah Logo - Unity Mark Concept
 *
 * Design: Two interlocking organic forms representing doctor-patient partnership
 * Symbolism: Caring, collaboration, human-centered healthcare
 *
 * The forms create a subtle "B" shape while maintaining abstract elegance.
 * Suitable for headers, login screens, and favicon usage.
 */
export const BeulahLogo: React.FC<BeulahLogoProps> = ({
  size = 32,
  variant = 'default',
  withWordmark = false,
  className = '',
}) => {
  const colorSchemes = {
    default: {
      primary: '#1A5F7A',
      secondary: '#159A9C',
      gradientEnd: '#57C5B6',
    },
    dark: {
      primary: '#2E8A99',
      secondary: '#3AB4C5',
      gradientEnd: '#57C5B6',
    },
    mono: {
      primary: 'currentColor',
      secondary: 'currentColor',
      gradientEnd: 'currentColor',
    },
  };

  const colors = colorSchemes[variant];
  const useGradient = variant !== 'mono';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} style={{ height: size }}>
      {/* Logo Symbol */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Beulah logo"
      >
        <defs>
          {useGradient && (
            <linearGradient
              id="beulah-gradient"
              x1="30"
              y1="30"
              x2="30"
              y2="90"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor={colors.primary} />
            </linearGradient>
          )}
        </defs>

        {/* Left caring form - rises from bottom-left, protective curve */}
        <path
          d="M 30,92
             Q 22,78 24,62
             T 32,38
             Q 36,28 46,30
             L 54,46
             Q 52,54 50,64
             Q 48,74 46,82
             Q 44,88 40,90
             Z"
          fill={useGradient ? 'url(#beulah-gradient)' : colors.primary}
        />

        {/* Right caring form - descends from top-right, interlocks with left */}
        <path
          d="M 90,28
             Q 98,42 96,58
             T 88,82
             Q 84,92 74,90
             L 66,74
             Q 68,66 70,56
             Q 72,46 74,38
             Q 76,32 80,30
             Z"
          fill={colors.primary}
        />

        {/* Subtle highlight for depth and dimensionality */}
        <path
          d="M 54,46
             Q 58,50 60,56
             L 58,60
             Q 56,54 54,50
             Z"
          fill="#FFFFFF"
          opacity="0.15"
        />

        {/* Additional highlight on right form */}
        <path
          d="M 66,74
             Q 70,70 72,64
             L 70,60
             Q 68,66 66,70
             Z"
          fill="#FFFFFF"
          opacity="0.12"
        />
      </svg>

      {/* Wordmark (optional) */}
      {withWordmark && (
        <span
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Inter", "DM Sans", system-ui, sans-serif',
            fontSize: size * 0.625, // 20px for 32px logo
            fontWeight: 600,
            color: colors.primary,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Beulah
        </span>
      )}
    </div>
  );
};

/**
 * Simplified version for favicons and small sizes
 * Removes gradients and fine details for clarity at small sizes
 */
export const BeulahLogoSimplified: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#1A5F7A',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Beulah"
    >
      {/* Simplified left form - thicker strokes for visibility */}
      <path
        d="M 30,92
           Q 22,78 24,62
           T 32,38
           Q 36,28 46,30
           L 54,46
           Q 52,54 50,64
           Q 48,74 46,82
           Q 44,88 40,90
           Z"
        fill={color}
      />

      {/* Simplified right form */}
      <path
        d="M 90,28
           Q 98,42 96,58
           T 88,82
           Q 84,92 74,90
           L 66,74
           Q 68,66 70,56
           Q 72,46 74,38
           Q 76,32 80,30
           Z"
        fill={color}
      />
    </svg>
  );
};
