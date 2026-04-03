// Blunderz Color Theme - Золотой и Черный (Premium & Elegant)

export const theme = {
  colors: {
    // Primary colors - золотой и черный
    primary: '#0a0a0a',        // Глубокий черный
    secondary: '#1a1a1a',      // Темно-серый
    accent: '#d4af37',         // Золотой (классический)
    accentLight: '#f4d03f',    // Светлый золотой
    accentDark: '#b8941e',     // Темный золотой
    
    // Background
    background: '#000000',     // Чистый черный
    surface: '#1a1a1a',        // Темная поверхность
    surfaceLight: '#2a2a2a',   // Светлее поверхность
    
    // Text colors
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    textMuted: '#707070',
    textGold: '#d4af37',
    
    // Status colors
    success: '#d4af37',        // Золотой для побед
    error: '#8b0000',          // Темно-красный для поражений
    warning: '#ff8c00',        // Оранжевый для ничьих
    info: '#d4af37',           // Золотой для информации
    
    // Game colors
    white: '#ffffff',
    black: '#0a0a0a',
    
    // Borders
    border: '#2a2a2a',
    borderLight: '#3a3a3a',
    borderGold: '#d4af37',
  },
  
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.5)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.6)',
    large: '0 8px 24px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(212, 175, 55, 0.4)',
    glowStrong: '0 0 30px rgba(212, 175, 55, 0.6)',
  },
  
  gradients: {
    gold: 'linear-gradient(135deg, #f4d03f 0%, #d4af37 50%, #b8941e 100%)',
    goldSubtle: 'linear-gradient(135deg, rgba(244, 208, 63, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)',
    black: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
  },
  
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xl: '16px',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '48px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

// Helper functions for consistent styling
export const button = {
  primary: {
    background: theme.gradients.gold,
    color: '#000000',
    border: 'none',
    padding: '12px 24px',
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: theme.shadows.glow,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textGold,
    border: `2px solid ${theme.colors.borderGold}`,
    padding: '12px 24px',
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  outline: {
    backgroundColor: 'transparent',
    color: theme.colors.textPrimary,
    border: `2px solid ${theme.colors.border}`,
    padding: '10px 22px',
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export const card = {
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.large,
  padding: theme.spacing.lg,
  boxShadow: theme.shadows.medium,
};

