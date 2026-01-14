import type { Theme } from './types.js';

export const creative: Theme = {
  name: 'creative',
  displayName: 'Creative',

  colors: {
    background: '#1f1f2e',
    backgroundGradient: 'linear-gradient(145deg, #2d1b4e 0%, #1f1f2e 50%, #0d1b2a 100%)',
    text: '#f0f0f0',
    textMuted: '#a0a0a0',
    heading: '#ffffff',
    accent: '#f472b6',
    accentSecondary: '#a78bfa',
    codeBackground: '#2d2d44',
    codeText: '#f9a8d4',
    blockquoteBackground: 'rgba(244, 114, 182, 0.1)',
    blockquoteBorder: '#f472b6',
  },

  fonts: {
    heading: "'Playfair Display', 'Georgia', serif",
    body: "'Nunito', 'Trebuchet MS', sans-serif",
    code: "'Fira Code', 'Consolas', monospace",
  },

  fontSizes: {
    h1: '80px',
    h2: '52px',
    body: '30px',
    small: '22px',
    code: '26px',
  },

  spacing: {
    slidePadding: '70px',
    elementGap: '36px',
    columnGap: '54px',
  },

  effects: {
    slideBoxShadow: '0 0 40px rgba(244, 114, 182, 0.2), 0 0 80px rgba(167, 139, 250, 0.1)',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    borderRadius: '16px',
  },

  defaultLayout: 'herringbone',
  imagePromptModifier: 'artistic creative style, vibrant colors, abstract elements, modern art inspired',
  googleFonts: ['Playfair+Display:wght@400;700', 'Nunito:wght@400;600;700', 'Fira+Code:wght@400;600'],
};
