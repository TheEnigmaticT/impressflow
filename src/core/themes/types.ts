/**
 * Theme configuration interface
 */
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
