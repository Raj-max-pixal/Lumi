export const COLORS = {
  // Primary palette
  bg: '#050505',
  surface: '#0f0f0f',
  card: '#141414',
  cardBorder: 'rgba(255,255,255,0.08)',
  
  // Accent
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.15)',
  purpleGlow: '#C084FC',
  cyan: '#22D3EE',
  cyanDim: 'rgba(34,211,238,0.15)',
  sky: '#38BDF8',
  
  // Text
  white: '#FFFFFF',
  text: '#F1F5F9',
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.35)',
  
  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  
  // Gradients (used as arrays)
  gradientPurple: ['#7C3AED', '#A855F7'] as [string, string],
  gradientCyan: ['#0891B2', '#22D3EE'] as [string, string],
  gradientStory: ['#FBBF24', '#EC4899', '#8B5CF6'] as [string, string, string],
  gradientDark: ['#1a0533', '#050505'] as [string, string],
};

export const FONTS = {
  regular: undefined, // System font
  medium: undefined,
  bold: undefined,
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
  },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};
