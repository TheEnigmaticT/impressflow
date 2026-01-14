import type { Theme } from './types.js';

export const workshop: Theme = {
  name: 'workshop',
  displayName: 'Workshop',

  colors: {
    background: '#18181b',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    heading: '#fafafa',
    accent: '#facc15',
    accentSecondary: '#a3e635',
    codeBackground: '#27272a',
    codeText: '#a3e635',
    blockquoteBackground: 'rgba(250, 204, 21, 0.15)',
    blockquoteBorder: '#facc15',
  },

  fonts: {
    heading: "'IBM Plex Sans', 'Arial', sans-serif",
    body: "'IBM Plex Sans', 'Arial', sans-serif",
    code: "'IBM Plex Mono', monospace",
  },

  // Extra large for back-of-room visibility
  fontSizes: {
    h1: '96px',
    h2: '64px',
    body: '36px',
    small: '28px',
    code: '32px',
  },

  spacing: {
    slidePadding: '60px',
    elementGap: '48px',
    columnGap: '60px',
  },

  effects: {
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    borderRadius: '0px',
  },

  defaultLayout: 'cascade',
  imagePromptModifier: 'bold simple graphics, high contrast, flat design, yellow accents',
  googleFonts: ['IBM+Plex+Sans:wght@400;600;700', 'IBM+Plex+Mono:wght@400;600'],
};
