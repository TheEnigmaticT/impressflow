import type { Theme } from './types.js';
import { techDark } from './tech-dark.js';
import { cleanLight } from './clean-light.js';
import { creative } from './creative.js';
import { corporate } from './corporate.js';
import { workshop } from './workshop.js';
import { crowdTamers } from './crowd-tamers.js';

const themes: Record<string, Theme> = {
  'tech-dark': techDark,
  'clean-light': cleanLight,
  creative: creative,
  corporate: corporate,
  workshop: workshop,
  'crowd-tamers': crowdTamers,
};

/**
 * Get a theme by name
 */
export function getTheme(name: string): Theme {
  const theme = themes[name];
  if (!theme) {
    throw new Error(`Unknown theme: ${name}`);
  }
  return theme;
}

/**
 * Get all available theme names
 */
export function getThemeNames(): string[] {
  return Object.keys(themes);
}

/**
 * Check if a theme name is valid
 */
export function isValidTheme(name: string): boolean {
  return name in themes;
}

/**
 * Generate CSS from a theme configuration
 */
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

/**
 * Generate Google Fonts link tags for a theme
 */
export function generateFontLinks(theme: Theme): string {
  if (!theme.googleFonts?.length) {
    return '';
  }
  const families = theme.googleFonts.join('&family=');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
}

// Re-export types
export type { Theme } from './types.js';

// Re-export individual themes
export { techDark } from './tech-dark.js';
export { cleanLight } from './clean-light.js';
export { creative } from './creative.js';
export { corporate } from './corporate.js';
export { workshop } from './workshop.js';
export { crowdTamers } from './crowd-tamers.js';
