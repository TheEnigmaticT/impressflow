import type { Theme } from './types.js';

export const cleanLight: Theme = {
  name: 'clean-light',
  displayName: 'Clean Light',

  colors: {
    background: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
    text: '#333333',
    textMuted: '#666666',
    heading: '#1a1a1a',
    accent: '#2563eb',
    accentSecondary: '#7c3aed',
    codeBackground: '#f3f4f6',
    codeText: '#1f2937',
    blockquoteBackground: 'rgba(37, 99, 235, 0.05)',
    blockquoteBorder: '#2563eb',
  },

  fonts: {
    heading: "'Poppins', 'Helvetica Neue', sans-serif",
    body: "'Open Sans', 'Arial', sans-serif",
    code: "'Source Code Pro', 'Monaco', monospace",
  },

  fontSizes: {
    h1: '64px',
    h2: '44px',
    body: '28px',
    small: '20px',
    code: '24px',
  },

  spacing: {
    slidePadding: '60px',
    elementGap: '32px',
    columnGap: '48px',
  },

  effects: {
    slideBoxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
  },

  defaultLayout: 'grid',
  imagePromptModifier: 'clean minimalist style, white background, professional, modern illustration',
  googleFonts: ['Poppins:wght@400;600;700', 'Open+Sans:wght@400;600', 'Source+Code+Pro:wght@400;600'],
};
