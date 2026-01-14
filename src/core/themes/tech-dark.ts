import type { Theme } from './types.js';

export const techDark: Theme = {
  name: 'tech-dark',
  displayName: 'Tech Dark',

  colors: {
    background: '#0a0a0f',
    backgroundGradient: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)',
    text: '#e0e0e0',
    textMuted: '#888888',
    heading: '#ffffff',
    accent: '#00d4ff',
    accentSecondary: '#ff00aa',
    codeBackground: '#1a1a2e',
    codeText: '#00ff88',
    blockquoteBackground: 'rgba(0, 212, 255, 0.1)',
    blockquoteBorder: '#00d4ff',
  },

  fonts: {
    heading: "'JetBrains Mono', 'Fira Code', monospace",
    body: "'Inter', 'Segoe UI', sans-serif",
    code: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSizes: {
    h1: '72px',
    h2: '48px',
    body: '32px',
    small: '24px',
    code: '28px',
  },

  spacing: {
    slidePadding: '80px',
    elementGap: '40px',
    columnGap: '60px',
  },

  effects: {
    slideBoxShadow: '0 0 60px rgba(0, 212, 255, 0.3)',
    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
    borderRadius: '8px',
  },

  defaultLayout: 'spiral',
  imagePromptModifier: 'cyberpunk style, neon lights, dark background, high tech',
  googleFonts: ['JetBrains+Mono:wght@400;700', 'Inter:wght@400;600;700'],
};
