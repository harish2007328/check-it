// Design System Tokens (NutriPam Inspired Pastel + Liquid Glass)

export const Colors = {
  // Brand & Accent Colors (Reference Palette)
  primary: '#FC9244',            // Faded Orange
  primaryHover: '#EA7C2E',
  primaryGlow: 'rgba(252, 146, 68, 0.28)',
  primaryLight: '#FFF4EC',

  // Reference Pastel Containers
  porcelain: '#E6F4F1',          // Soft Cyan/Mint pastel
  porcelainDark: '#C9EAE4',
  chromeWhite: '#EBF5C2',        // Soft Lime/Yellow highlight pastel
  chromeWhiteDark: '#D8E8A1',

  // Dark Elements & Island Nav
  almostBlack: '#0D0D12',        // Deep Charcoal/Black
  almostBlackLight: '#1C1C24',
  darkGlass: 'rgba(13, 13, 18, 0.92)',

  // Neutral Foundations
  canvas: '#F7F9FC',             // Screen background
  surface: '#FFFFFF',            // Pure White Card
  surfaceSubtle: '#F1F4F9',
  border: 'rgba(13, 13, 18, 0.08)',
  borderLight: 'rgba(13, 13, 18, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.85)',
  glassBorderDark: 'rgba(255, 255, 255, 0.12)',

  // Typography
  textPrimary: '#0D0D12',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Functional Status Colors & Pastels
  pass: '#16A34A',               // Forest Green
  passBg: '#D2F5DC',             // Pastel Green
  fail: '#E11D48',               // Crimson Red
  failBg: '#FFD1D5',             // Pastel Rose
  review: '#EA580C',             // Amber/Orange
  reviewBg: '#FFD8BE',           // Pastel Peach
  info: '#7C3AED',               // Purple
  infoBg: '#E2D9F3',             // Pastel Lavender

  // Helper values
  white: '#FFFFFF',
  black: '#000000',
  overlayDark: 'rgba(13, 13, 18, 0.65)',
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
};

export const Radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 9999,
};

export const Shadows = {
  soft: {
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  glassIsland: {
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  glowOrange: {
    shadowColor: '#FC9244',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const Typography = {
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, color: Colors.textPrimary },
  headline: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3, color: Colors.textPrimary },
  title: { fontSize: 17, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, color: Colors.textSecondary },
  bodyMedium: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20, color: Colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  labelCaps: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
};
