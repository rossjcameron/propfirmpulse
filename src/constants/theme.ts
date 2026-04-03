export const theme = {
  colors: {
    // Backgrounds
    background: '#050507',
    backgroundElevated: '#0C0C10',
    card: '#101014',
    cardAlt: '#16161C',
    cardHighlight: '#1A1A22',

    // Borders & dividers
    border: '#1E1E28',
    borderLight: '#2A2A36',
    borderFocus: '#39FF8844',

    // Text hierarchy
    text: '#EAEAF0',
    textSecondary: '#B0B0C0',
    textMuted: '#6B6B80',
    textDim: '#44445A',

    // Accents
    primary: '#39FF88',
    primaryDim: '#39FF8833',
    primaryGlow: '#39FF8818',
    secondary: '#7B6CF6',
    secondaryDim: '#7B6CF633',

    // Semantic
    profit: '#39FF88',
    loss: '#FF4466',
    lossDim: '#FF446633',
    warning: '#FFB020',
    warningDim: '#FFB02033',
    info: '#3B82F6',
    infoDim: '#3B82F633',

    // Status chips
    statusEval: '#7B6CF6',
    statusEvalBg: '#7B6CF618',
    statusFunded: '#39FF88',
    statusFundedBg: '#39FF8818',
    statusFailed: '#FF4466',
    statusFailedBg: '#FF446618',

    // Misc
    overlay: 'rgba(0,0,0,0.6)',
    shimmer: 'rgba(255,255,255,0.03)',
  },

  spacing: {
    xxs: 4,
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
  },

  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    cardHover: {
      shadowColor: '#39FF88',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
    },
    glow: {
      shadowColor: '#39FF88',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};