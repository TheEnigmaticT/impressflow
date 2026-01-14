import type { Theme } from './types.js';

export const corporate: Theme = {
  name: 'corporate',
  displayName: 'Corporate',

  colors: {
    background: '#f8fafc',
    backgroundGradient: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    text: '#1e293b',
    textMuted: '#64748b',
    heading: '#0f172a',
    accent: '#0284c7',
    accentSecondary: '#059669',
    codeBackground: '#f1f5f9',
    codeText: '#475569',
    blockquoteBackground: 'rgba(2, 132, 199, 0.05)',
    blockquoteBorder: '#0284c7',
  },

  fonts: {
    heading: "'Roboto', 'Helvetica', sans-serif",
    body: "'Roboto', 'Helvetica', sans-serif",
    code: "'Roboto Mono', 'Courier New', monospace",
  },

  fontSizes: {
    h1: '56px',
    h2: '40px',
    body: '26px',
    small: '20px',
    code: '22px',
  },

  spacing: {
    slidePadding: '48px',
    elementGap: '28px',
    columnGap: '40px',
  },

  effects: {
    slideBoxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    borderRadius: '4px',
  },

  defaultLayout: 'grid',
  imagePromptModifier: 'professional corporate style, business graphics, clean lines, blue accents',
  googleFonts: ['Roboto:wght@400;500;700', 'Roboto+Mono:wght@400;500'],
};
