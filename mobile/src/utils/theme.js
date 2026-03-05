// src/utils/theme.js
export const colors = {
  primary: '#1DB954',    // Fresh Green
  secondary: '#FF6B35',  // Warm Orange
  accent: '#F5A623',     // Gold
  dark: '#1A1A2E',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48,
};

export const borderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
