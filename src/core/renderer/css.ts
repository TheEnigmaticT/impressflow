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

/* Transform blocks for word-level animations */
.transform-block {
  margin: 0.5em 0;
}

/* Base substep styles - hidden by default */
.substep {
  opacity: 0;
  transition: all 0.6s ease-out;
}

.substep.substep-active {
  opacity: 1;
}

/* APPEAR: Simple fade in */
.substep-appear {
  opacity: 0;
}

.substep-appear.substep-active {
  opacity: 1;
}

/* REVEAL: Mask slides off (clip-path wipe) */
.substep-reveal {
  opacity: 1;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.8s ease-out;
}

.substep-reveal.substep-active {
  clip-path: inset(0 0 0 0);
}

/* SLIDEUP: Slides up from below */
.substep-slideup {
  opacity: 0;
  transform: translateY(30px);
}

.substep-slideup.substep-active {
  opacity: 1;
  transform: translateY(0);
}

/* SLIDELEFT: Slides in from right */
.substep-slideleft {
  opacity: 0;
  transform: translateX(50px);
}

.substep-slideleft.substep-active {
  opacity: 1;
  transform: translateX(0);
}

/* SKEW: Starts normal, ends skewed with random angle */
.substep-skew {
  opacity: 0;
  transform: skewX(0deg);
  display: inline-block;
  --skew-angle: -8deg; /* fallback */
}

.substep-skew.substep-active {
  opacity: 1;
  transform: skewX(var(--skew-angle));
}

/* GLOW: Fade in with pulsing glow */
.substep-glow {
  opacity: 0;
}

.substep-glow.substep-active {
  opacity: 1;
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { text-shadow: 0 0 10px var(--accent), 0 0 20px var(--accent); }
  50% { text-shadow: 0 0 20px var(--accent), 0 0 40px var(--accent), 0 0 60px var(--accent); }
}

/* BIG: Scales up to 1.3x */
.substep-big {
  opacity: 0;
  transform: scale(1);
  display: inline-block;
  transform-origin: center center;
}

.substep-big.substep-active {
  opacity: 1;
  transform: scale(1.3);
}

/* HIGHLIGHT: Animated background highlight */
.substep-highlight {
  position: relative;
  opacity: 1;
}

.substep-highlight::before {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: -2px;
  bottom: -2px;
  background: var(--accent-secondary, var(--accent));
  z-index: -1;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.5s ease-out;
}

.substep-highlight.substep-active::before {
  transform: scaleX(1);
}

/* ========================================
   MOBILE TOUCH SUPPORT
   ======================================== */

/* Navigation zones for mobile */
.nav-zone {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 8%;
  z-index: 9999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-zone:hover {
  opacity: 1;
}

.nav-prev {
  left: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.3), transparent);
}

.nav-next {
  right: 0;
  background: linear-gradient(to left, rgba(0,0,0,0.3), transparent);
}

.nav-icon {
  width: 60px;
  height: 60px;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
  backdrop-filter: blur(4px);
  transition: transform 0.2s ease, background 0.2s ease;
}

.nav-zone:hover .nav-icon {
  transform: scale(1.1);
  background: rgba(255,255,255,0.3);
}

/* Mobile-friendly navigation zones */
@media (pointer: coarse), (max-width: 768px) {
  .nav-zone {
    opacity: 0.4;
    width: 15%;
  }

  .nav-zone:active {
    opacity: 0.8;
    background: rgba(255,255,255,0.15);
  }

  .nav-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }

  /* Adjust slide content for mobile */
  .step.slide {
    padding: 40px;
  }

  .slide-title {
    font-size: 2.5rem;
  }

  .slide-content {
    font-size: 1.25rem;
  }
}

/* Hide navigation in overview */
.impress-on-overview .nav-zone {
  display: none;
}

/* Swipe hint for first-time mobile users */
.mobile-hint {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  z-index: 10000;
  pointer-events: none;
  animation: hintFadeInOut 4s ease-in-out forwards;
}

@keyframes hintFadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  70% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}
`;
}
