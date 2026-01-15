import type { Theme } from './types.js';

export const crowdTamers: Theme = {
  name: 'crowd-tamers',
  displayName: 'Crowd Tamers',

  colors: {
    background: '#F7FAFC',
    backgroundGradient: 'linear-gradient(135deg, #ffffff 0%, #EDF2F7 50%, #F7FAFC 100%)',
    text: '#4A5568',
    textMuted: '#718096',
    heading: '#1A202C',
    accent: '#61cf70',
    accentSecondary: '#1fc2f9',
    codeBackground: '#1A202C',
    codeText: '#61cf70',
    blockquoteBackground: 'rgba(97, 207, 112, 0.1)',
    blockquoteBorder: '#61cf70',
  },

  fonts: {
    heading: "'Questrial', 'Inter', sans-serif",
    body: "'Quicksand', 'Inter', sans-serif",
    code: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSizes: {
    h1: '72px',
    h2: '48px',
    body: '32px',
    small: '24px',
    code: '26px',
  },

  spacing: {
    slidePadding: '80px',
    elementGap: '40px',
    columnGap: '60px',
  },

  effects: {
    slideBoxShadow: '0px 15px 40px -10px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
  },

  defaultLayout: 'spiral',
  imagePromptModifier: 'clean modern professional style, light background, friendly approachable aesthetic, startup vibes',
  googleFonts: ['Questrial', 'Quicksand:wght@400;500;600;700'],
};
