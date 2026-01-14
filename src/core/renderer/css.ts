/**
 * Generate CSS for slide layouts
 */
export function generateLayoutCSS(): string {
  return `
/* Single column layout */
.layout-single .slide-content {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
}

/* Two column layout */
.layout-two-column .content-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--column-gap);
}

/* Three column layout */
.layout-three-column .content-body {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--column-gap);
}

/* Image left layout */
.layout-image-left .content-body {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: var(--column-gap);
  align-items: center;
}

/* Image right layout */
.layout-image-right .content-body {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: var(--column-gap);
  align-items: center;
}

/* Full bleed layout */
.layout-full-bleed {
  padding: 0 !important;
}

.layout-full-bleed .slide-content {
  width: 100%;
  height: 100%;
}

.layout-full-bleed .slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Title only layout */
.layout-title-only .slide-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
}

.layout-title-only .slide-title {
  font-size: calc(var(--h1-size) * 1.2);
}

/* Quote layout */
.layout-quote .slide-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.layout-quote blockquote {
  font-size: 150%;
  text-align: center;
  max-width: 80%;
  margin: 0 auto;
  font-style: italic;
}

.layout-quote blockquote p:last-child {
  font-style: normal;
  font-size: 60%;
  margin-top: 1em;
  color: var(--text-muted);
}

/* Slide images */
.slide-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
}

/* List styling */
.slide-content ul,
.slide-content ol {
  list-style-position: inside;
  padding-left: 0;
}

.slide-content li {
  margin-bottom: 0.5em;
}

/* Code blocks */
.slide-content pre {
  padding: 1em;
  border-radius: var(--border-radius);
  overflow-x: auto;
}

.slide-content code {
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

.slide-content pre code {
  padding: 0;
  background: transparent;
}
`;
}
