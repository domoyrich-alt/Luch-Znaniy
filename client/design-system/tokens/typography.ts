/**
 * DESIGN SYSTEM - TYPOGRAPHY
 * Enhanced typography system with display, headline, body, and label styles
 */

export const Typography = {
  display: {
    large: { 
      fontSize: 40, 
      lineHeight: 48, 
      fontWeight: '800' as const, 
      letterSpacing: -1 
    },
    medium: { 
      fontSize: 32, 
      lineHeight: 40, 
      fontWeight: '700' as const, 
      letterSpacing: -0.5 
    },
    small: { 
      fontSize: 28, 
      lineHeight: 36, 
      fontWeight: '700' as const, 
      letterSpacing: -0.25 
    },
  },
  headline: {
    large: { 
      fontSize: 28, 
      lineHeight: 36, 
      fontWeight: '600' as const 
    },
    medium: { 
      fontSize: 24, 
      lineHeight: 32, 
      fontWeight: '600' as const 
    },
    small: { 
      fontSize: 20, 
      lineHeight: 28, 
      fontWeight: '600' as const 
    },
  },
  title: {
    large: { 
      fontSize: 22, 
      lineHeight: 28, 
      fontWeight: '500' as const 
    },
    medium: { 
      fontSize: 18, 
      lineHeight: 24, 
      fontWeight: '500' as const 
    },
    small: { 
      fontSize: 16, 
      lineHeight: 22, 
      fontWeight: '500' as const 
    },
  },
  body: {
    large: { 
      fontSize: 18, 
      lineHeight: 28, 
      fontWeight: '400' as const 
    },
    medium: { 
      fontSize: 16, 
      lineHeight: 24, 
      fontWeight: '400' as const 
    },
    small: { 
      fontSize: 14, 
      lineHeight: 20, 
      fontWeight: '400' as const 
    },
  },
  label: {
    large: { 
      fontSize: 14, 
      lineHeight: 20, 
      fontWeight: '500' as const, 
      letterSpacing: 0.5 
    },
    medium: { 
      fontSize: 12, 
      lineHeight: 16, 
      fontWeight: '500' as const, 
      letterSpacing: 0.5 
    },
    small: { 
      fontSize: 11, 
      lineHeight: 14, 
      fontWeight: '500' as const, 
      letterSpacing: 0.5 
    },
  },
};

// Legacy typography for backward compatibility
export const LegacyTypography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  link: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
};
