// Application Branding
export const APP_NAME = 'Beulah-Care' as const;
export const APP_DESCRIPTION = 'Modern Electronic Health Records System' as const;

// UI Constants
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

// Color Palette
export const COLORS = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    900: '#111827',
  },
  success: {
    100: '#dcfce7',
    800: '#166534',
  },
  warning: {
    100: '#fef3c7',
    800: '#92400e',
  },
  error: {
    100: '#fee2e2',
    600: '#dc2626',
    800: '#991b1b',
  },
} as const;

// Animation Durations
export const ANIMATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
} as const;

// Common CSS Classes
export const UI_CLASSES = {
  // Buttons
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    sizes: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
  },
  // Cards
  card: 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
  // Forms
  input:
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  // Layout
  container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  section: 'py-6 sm:py-8',
} as const;
