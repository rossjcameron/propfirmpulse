export const typography = {
  // Hero numbers — the big stats that grab your eye
  heroStat: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
  },

  // Large stats — account balances, P&L figures
  stat: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },

  // Screen titles
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },

  // Section headings
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },

  // Card titles
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },

  // Body copy — medium weight for data-heavy UI
  bodyMedium: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },

  // Body copy — regular weight
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },

  // Labels above inputs, small metadata
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },

  // Tiny captions, timestamps
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },

  // Monospaced numbers for tabular data
  mono: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'monospace',
    letterSpacing: -0.3,
  },

  monoLarge: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
};