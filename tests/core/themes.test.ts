import { describe, it, expect } from 'vitest';
import {
  getTheme,
  getThemeNames,
  isValidTheme,
  generateThemeCSS,
  generateFontLinks,
} from '../../src/core/themes/index.js';

describe('Themes', () => {
  it('loads all built-in themes', () => {
    const names = getThemeNames();
    expect(names).toContain('tech-dark');
    expect(names).toContain('clean-light');
    expect(names).toContain('creative');
    expect(names).toContain('corporate');
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
    getThemeNames().forEach((name) => {
      const theme = getTheme(name);
      const links = generateFontLinks(theme);
      expect(links).toContain('fonts.googleapis.com');
    });
  });

  it('throws for unknown theme', () => {
    expect(() => getTheme('nonexistent')).toThrow('Unknown theme: nonexistent');
  });

  it('validates theme names correctly', () => {
    expect(isValidTheme('tech-dark')).toBe(true);
    expect(isValidTheme('workshop')).toBe(true);
    expect(isValidTheme('invalid')).toBe(false);
  });

  it('generates CSS with all required variables', () => {
    const theme = getTheme('clean-light');
    const css = generateThemeCSS(theme);

    // Colors
    expect(css).toContain('--text:');
    expect(css).toContain('--heading:');
    expect(css).toContain('--code-bg:');
    expect(css).toContain('--code-text:');

    // Fonts
    expect(css).toContain('--font-heading:');
    expect(css).toContain('--font-body:');
    expect(css).toContain('--font-code:');

    // Sizes
    expect(css).toContain('--h1-size:');
    expect(css).toContain('--body-size:');
    expect(css).toContain('--slide-padding:');
  });

  it('generates font link tags with preconnect', () => {
    const theme = getTheme('corporate');
    const links = generateFontLinks(theme);

    expect(links).toContain('<link rel="preconnect"');
    expect(links).toContain('fonts.gstatic.com');
    expect(links).toContain('display=swap');
  });

  it('each theme has imagePromptModifier for AI images', () => {
    getThemeNames().forEach((name) => {
      const theme = getTheme(name);
      expect(theme.imagePromptModifier).toBeTruthy();
      expect(theme.imagePromptModifier.length).toBeGreaterThan(10);
    });
  });

  it('each theme has a defaultLayout', () => {
    getThemeNames().forEach((name) => {
      const theme = getTheme(name);
      expect(theme.defaultLayout).toBeTruthy();
    });
  });

  it('creative theme has artistic styling', () => {
    const theme = getTheme('creative');
    expect(theme.fonts.heading).toContain('Playfair');
    expect(theme.colors.accent).toBe('#f472b6');
  });

  it('corporate theme is professional looking', () => {
    const theme = getTheme('corporate');
    expect(theme.fonts.heading).toContain('Roboto');
    expect(theme.effects.borderRadius).toBe('4px');
  });
});
