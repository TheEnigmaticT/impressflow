# Phase 3: Theme System

**Completion Promise:** `<promise>PHASE_3_COMPLETE</promise>`

## Scope
Implement all 5 themes with CSS generation.

## Tasks
1. Define Theme interface
2. Implement tech-dark theme
3. Implement clean-light theme
4. Implement creative theme
5. Implement corporate theme
6. Implement workshop theme
7. Create CSS generator from theme config
8. Include Google Fonts links

## Files to Create

```
src/core/themes/
├── index.ts          # Theme loader + CSS generator
├── types.ts          # Theme interface
├── tech-dark.ts
├── clean-light.ts
├── creative.ts
├── corporate.ts
└── workshop.ts
```

## Theme Interface

```typescript
// src/core/themes/types.ts
export interface Theme {
  name: string;
  displayName: string;
  
  colors: {
    background: string;
    backgroundGradient?: string;
    text: string;
    textMuted: string;
    heading: string;
    accent: string;
    accentSecondary: string;
    codeBackground: string;
    codeText: string;
    blockquoteBackground: string;
    blockquoteBorder: string;
  };
  
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  
  fontSizes: {
    h1: string;
    h2: string;
    body: string;
    small: string;
    code: string;
  };
  
  spacing: {
    slidePadding: string;
    elementGap: string;
    columnGap: string;
  };
  
  effects: {
    slideBoxShadow?: string;
    textShadow?: string;
    borderRadius: string;
  };
  
  defaultLayout: string;
  imagePromptModifier: string;
  
  // Google Fonts to load
  googleFonts?: string[];
}
```

## Theme Examples

### tech-dark.ts
```typescript
import { Theme } from './types';

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
  
  fontSizes: { h1: '72px', h2: '48px', body: '32px', small: '24px', code: '28px' },
  spacing: { slidePadding: '80px', elementGap: '40px', columnGap: '60px' },
  effects: {
    slideBoxShadow: '0 0 60px rgba(0, 212, 255, 0.3)',
    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
    borderRadius: '8px',
  },
  
  defaultLayout: 'spiral',
  imagePromptModifier: 'cyberpunk style, neon lights, dark background, high tech',
  googleFonts: ['JetBrains+Mono:wght@400;700', 'Inter:wght@400;600;700'],
};
```

### workshop.ts (high contrast, large fonts)
```typescript
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
  fontSizes: { h1: '96px', h2: '64px', body: '36px', small: '28px', code: '32px' },
  spacing: { slidePadding: '60px', elementGap: '48px', columnGap: '60px' },
  effects: {
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    borderRadius: '0px',
  },
  
  defaultLayout: 'cascade',
  imagePromptModifier: 'bold simple graphics, high contrast, flat design, yellow accents',
  googleFonts: ['IBM+Plex+Sans:wght@400;600;700', 'IBM+Plex+Mono:wght@400;600'],
};
```

## CSS Generator

```typescript
// src/core/themes/index.ts
import { Theme } from './types';
import { techDark } from './tech-dark';
import { cleanLight } from './clean-light';
import { creative } from './creative';
import { corporate } from './corporate';
import { workshop } from './workshop';

const themes: Record<string, Theme> = {
  'tech-dark': techDark,
  'clean-light': cleanLight,
  'creative': creative,
  'corporate': corporate,
  'workshop': workshop,
};

export function getTheme(name: string): Theme {
  const theme = themes[name];
  if (!theme) throw new Error(`Unknown theme: ${name}`);
  return theme;
}

export function getThemeNames(): string[] {
  return Object.keys(themes);
}

export function generateThemeCSS(theme: Theme): string {
  return `
/* Theme: ${theme.displayName} */
:root {
  --background: ${theme.colors.background};
  --background-gradient: ${theme.colors.backgroundGradient || theme.colors.background};
  --text: ${theme.colors.text};
  --text-muted: ${theme.colors.textMuted};
  --heading: ${theme.colors.heading};
  --accent: ${theme.colors.accent};
  --accent-secondary: ${theme.colors.accentSecondary};
  --code-bg: ${theme.colors.codeBackground};
  --code-text: ${theme.colors.codeText};
  --blockquote-bg: ${theme.colors.blockquoteBackground};
  --blockquote-border: ${theme.colors.blockquoteBorder};
  
  --font-heading: ${theme.fonts.heading};
  --font-body: ${theme.fonts.body};
  --font-code: ${theme.fonts.code};
  
  --h1-size: ${theme.fontSizes.h1};
  --h2-size: ${theme.fontSizes.h2};
  --body-size: ${theme.fontSizes.body};
  --small-size: ${theme.fontSizes.small};
  --code-size: ${theme.fontSizes.code};
  
  --slide-padding: ${theme.spacing.slidePadding};
  --element-gap: ${theme.spacing.elementGap};
  --column-gap: ${theme.spacing.columnGap};
  
  --border-radius: ${theme.effects.borderRadius};
  ${theme.effects.slideBoxShadow ? `--slide-shadow: ${theme.effects.slideBoxShadow};` : ''}
  ${theme.effects.textShadow ? `--text-shadow: ${theme.effects.textShadow};` : ''}
}

body {
  background: var(--background-gradient);
  color: var(--text);
  font-family: var(--font-body);
  font-size: var(--body-size);
}

h1, h2, h3 { 
  font-family: var(--font-heading); 
  color: var(--heading);
  ${theme.effects.textShadow ? 'text-shadow: var(--text-shadow);' : ''}
}
h1 { font-size: var(--h1-size); }
h2 { font-size: var(--h2-size); }

.step.slide {
  padding: var(--slide-padding);
  border-radius: var(--border-radius);
  ${theme.effects.slideBoxShadow ? 'box-shadow: var(--slide-shadow);' : ''}
}

code, pre {
  font-family: var(--font-code);
  font-size: var(--code-size);
  background: var(--code-bg);
  color: var(--code-text);
}

blockquote {
  background: var(--blockquote-bg);
  border-left: 4px solid var(--blockquote-border);
  padding: 1em;
  border-radius: var(--border-radius);
}

a { color: var(--accent); }
.accent { color: var(--accent); }
.muted { color: var(--text-muted); }
`;
}

export function generateFontLinks(theme: Theme): string {
  if (!theme.googleFonts?.length) return '';
  const families = theme.googleFonts.join('&family=');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
}
```

## Tests

```typescript
// tests/core/themes.test.ts
describe('Themes', () => {
  it('loads all built-in themes', () => {
    const names = getThemeNames();
    expect(names).toContain('tech-dark');
    expect(names).toContain('workshop');
    expect(names.length).toBe(5);
  });

  it('generates valid CSS from theme config', () => {
    const theme = getTheme('tech-dark');
    const css = generateThemeCSS(theme);
    expect(css).toContain(':root');
    expect(css).toContain('--background:');
    expect(css).toContain('--accent:');
  });

  it('tech-dark has correct neon colors', () => {
    const theme = getTheme('tech-dark');
    expect(theme.colors.accent).toBe('#00d4ff');
  });

  it('workshop has extra-large font sizes', () => {
    const theme = getTheme('workshop');
    expect(parseInt(theme.fontSizes.h1)).toBeGreaterThanOrEqual(96);
  });

  it('all themes specify font imports', () => {
    getThemeNames().forEach(name => {
      const theme = getTheme(name);
      const links = generateFontLinks(theme);
      expect(links).toContain('fonts.googleapis.com');
    });
  });
});
```

## Verification

```bash
npm run typecheck && npm run test -- tests/core/themes.test.ts
```
