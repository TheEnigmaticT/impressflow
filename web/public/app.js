/**
 * ImpressFlow Web Application
 * Client-side application for generating presentations
 */

// DOM Elements
const markdownTab = document.querySelector('[data-tab="markdown"]');
const notionTab = document.querySelector('[data-tab="notion"]');
const markdownTabContent = document.getElementById('markdown-tab');
const notionTabContent = document.getElementById('notion-tab');
const markdownInput = document.getElementById('markdown-input');
const notionUrl = document.getElementById('notion-url');
const themeSelect = document.getElementById('theme-select');
const layoutSelect = document.getElementById('layout-select');
const generateImagesCheckbox = document.getElementById('generate-images');
const apiKeySection = document.getElementById('api-key-section');
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const generateBtn = document.getElementById('generate-btn');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoading = generateBtn.querySelector('.btn-loading');
const previewIframe = document.getElementById('preview-iframe');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const downloadBtn = document.getElementById('download-btn');

// State
let currentTab = 'markdown';
let generatedHtml = null;

// Embedded impress.js with substep support (no CDN dependency)
const IMPRESS_JS = `(function(document, window) {
  'use strict';
  var pfx = (function() {
    var style = document.createElement('dummy').style,
        prefixes = 'Webkit Moz O ms Khtml'.split(' '),
        memory = {};
    return function(prop) {
      if (typeof memory[prop] === 'undefined') {
        var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
            props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
        memory[prop] = null;
        for (var i in props) {
          if (style[props[i]] !== undefined) {
            memory[prop] = props[i];
            break;
          }
        }
      }
      return memory[prop];
    };
  })();
  var body = document.body;
  var impressSupported = (pfx('perspective') !== null) && (body.classList) && (body.dataset);
  var roots = {};
  var defaults = { width: 1024, height: 768, maxScale: 1, minScale: 0, perspective: 1000, transitionDuration: 1000 };
  var impress = window.impress = function(rootId) {
    rootId = rootId || 'impress';
    if (roots['impress-root-' + rootId]) return roots['impress-root-' + rootId];
    var stepsData = {}, activeStep = null, currentState = null, steps = null, config = null, windowScale = null;
    var root = document.getElementById(rootId);
    var canvas = document.createElement('div');
    var initialized = false, lastEntered = null;
    var computeWindowScale = function(config) {
      var hScale = window.innerHeight / config.height, wScale = window.innerWidth / config.width;
      var scale = hScale > wScale ? wScale : hScale;
      if (config.maxScale && scale > config.maxScale) scale = config.maxScale;
      if (config.minScale && scale < config.minScale) scale = config.minScale;
      return scale;
    };
    var css = function(el, props) {
      for (var key in props) { if (props.hasOwnProperty(key)) { var pkey = pfx(key); if (pkey !== null) el.style[pkey] = props[key]; } }
      return el;
    };
    var translate = function(t) { return ' translate3d(' + t.x + 'px,' + t.y + 'px,' + t.z + 'px) '; };
    var rotate = function(r) { return ' rotateX(' + r.x + 'deg) rotateY(' + r.y + 'deg) rotateZ(' + r.z + 'deg) '; };
    var rotateReverse = function(r) { return ' rotateZ(' + r.z + 'deg) rotateY(' + r.y + 'deg) rotateX(' + r.x + 'deg) '; };
    var scale = function(s) { return ' scale(' + s + ') '; };
    var perspective = function(p) { return ' perspective(' + p + 'px) '; };
    var getElementFromHash = function() { var h = window.location.hash.substring(1); if (h.charAt(0) === '/') h = h.substring(1); return document.getElementById(h); };
    var triggerEvent = function(el, eventName, detail) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, true, true, detail);
      el.dispatchEvent(event);
    };

    // Substep management
    var getSubsteps = function(step) {
      return step ? Array.from(step.querySelectorAll('.substep')) : [];
    };
    var getActiveSubsteps = function(step) {
      return step ? Array.from(step.querySelectorAll('.substep.substep-active')) : [];
    };
    var getInactiveSubsteps = function(step) {
      return step ? Array.from(step.querySelectorAll('.substep:not(.substep-active)')) : [];
    };
    var activateNextSubstep = function() {
      var inactive = getInactiveSubsteps(activeStep);
      if (inactive.length > 0) {
        inactive[0].classList.add('substep-active');
        triggerEvent(inactive[0], 'impress:substep:enter', {});
        return true;
      }
      return false;
    };
    var deactivatePrevSubstep = function() {
      var active = getActiveSubsteps(activeStep);
      if (active.length > 0) {
        var last = active[active.length - 1];
        last.classList.remove('substep-active');
        triggerEvent(last, 'impress:substep:leave', {});
        return true;
      }
      return false;
    };
    var activateAllSubsteps = function(step) {
      getSubsteps(step).forEach(function(s) { s.classList.add('substep-active'); });
    };
    var deactivateAllSubsteps = function(step) {
      getSubsteps(step).forEach(function(s) { s.classList.remove('substep-active'); });
    };

    var initStep = function(el, idx) {
      var data = el.dataset;
      var step = {
        translate: { x: Number(data.x) || 0, y: Number(data.y) || 0, z: Number(data.z) || 0 },
        rotate: { x: Number(data.rotateX) || 0, y: Number(data.rotateY) || 0, z: Number(data.rotateZ) || Number(data.rotate) || 0 },
        scale: Number(data.scale) || 1, el: el
      };
      if (!el.id) el.id = 'step-' + (idx + 1);
      stepsData['impress-' + el.id] = step;
      var transformStr = translate(step.translate) + rotate(step.rotate) + scale(step.scale);
      css(el, { position: 'absolute', transform: 'translate(-50%,-50%) ' + transformStr, transformStyle: 'preserve-3d' });
    };
    var init = function() {
      if (initialized) return;
      body.classList.remove('impress-not-supported');
      body.classList.add('impress-supported');
      body.classList.add('impress-enabled');
      root.style.position = 'absolute'; root.style.left = '50%'; root.style.top = '50%';
      config = {
        width: Number(root.dataset.width) || defaults.width,
        height: Number(root.dataset.height) || defaults.height,
        maxScale: Number(root.dataset.maxScale) || defaults.maxScale,
        minScale: Number(root.dataset.minScale) || defaults.minScale,
        perspective: Number(root.dataset.perspective) || defaults.perspective,
        transitionDuration: Number(root.dataset.transitionDuration) || defaults.transitionDuration
      };
      windowScale = computeWindowScale(config);
      css(root, { transform: perspective(config.perspective / windowScale) + scale(windowScale), transformStyle: 'preserve-3d', transformOrigin: '0 0' });
      canvas.id = 'impress-canvas';
      while (root.firstChild) canvas.appendChild(root.firstChild);
      root.appendChild(canvas);
      css(canvas, { position: 'absolute', top: '0px', left: '0px', transformOrigin: '0 0', transformStyle: 'preserve-3d', transition: 'all ' + (config.transitionDuration / 1000) + 's ease-in-out' });
      steps = canvas.querySelectorAll('.step');
      steps.forEach(initStep);
      currentState = { translate: { x: 0, y: 0, z: 0 }, rotate: { x: 0, y: 0, z: 0 }, scale: 1 };
      initialized = true;
      triggerEvent(root, 'impress:init', { api: roots['impress-root-' + rootId] });
    };
    var getStep = function(step) {
      if (typeof step === 'number') step = step < 0 ? steps[steps.length + step] : steps[step];
      else if (typeof step === 'string') step = document.getElementById(step);
      return (step && step.id && stepsData['impress-' + step.id]) ? step : null;
    };
    var goto = function(el, fromSubstep) {
      if (!initialized || !(el = getStep(el))) return false;
      if (activeStep) {
        activeStep.classList.remove('active');
        body.classList.remove('impress-on-' + activeStep.id);
        // Deactivate substeps when leaving a slide
        if (!fromSubstep) deactivateAllSubsteps(activeStep);
      }
      el.classList.add('active');
      body.classList.add('impress-on-' + el.id);
      var step = stepsData['impress-' + el.id];
      currentState = {
        translate: { x: -step.translate.x, y: -step.translate.y, z: -step.translate.z },
        rotate: { x: -step.rotate.x, y: -step.rotate.y, z: -step.rotate.z },
        scale: 1 / step.scale
      };
      windowScale = computeWindowScale(config);
      var rootTransform = perspective(config.perspective / windowScale) + scale(windowScale * currentState.scale);
      var canvasTransform = rotateReverse(currentState.rotate) + translate(currentState.translate);
      css(root, { transform: rootTransform, transitionDuration: config.transitionDuration + 'ms' });
      css(canvas, { transform: canvasTransform, transitionDuration: config.transitionDuration + 'ms' });
      if (activeStep !== el) {
        if (lastEntered) triggerEvent(lastEntered, 'impress:stepleave', {});
        triggerEvent(el, 'impress:stepenter', {});
        lastEntered = el;
      }
      activeStep = el;
      window.location.hash = '#/' + el.id;
      return el;
    };
    var prev = function() {
      // First try to deactivate a substep
      if (deactivatePrevSubstep()) return activeStep;
      // Otherwise go to previous slide (with all substeps active)
      var p = steps.indexOf(activeStep) - 1;
      var target = p >= 0 ? steps[p] : steps[steps.length - 1];
      var result = goto(target);
      if (result) activateAllSubsteps(result);
      return result;
    };
    var next = function() {
      // First try to activate a substep
      if (activateNextSubstep()) return activeStep;
      // Otherwise go to next slide
      var n = steps.indexOf(activeStep) + 1;
      return goto(n < steps.length ? steps[n] : steps[0]);
    };
    if (!impressSupported) { body.classList.add('impress-not-supported'); return; }
    root.addEventListener('impress:init', function() { steps = Array.from(steps); goto(getElementFromHash() || steps[0]); }, false);
    window.addEventListener('hashchange', function() { var t = getElementFromHash(); if (t && t !== activeStep) goto(t); }, false);
    window.addEventListener('resize', function() { windowScale = computeWindowScale(config); css(root, { transform: perspective(config.perspective / windowScale) + scale(windowScale * currentState.scale) }); }, false);
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 9 || (e.keyCode >= 32 && e.keyCode <= 40)) {
        switch (e.keyCode) { case 33: case 37: case 38: prev(); break; case 9: case 32: case 34: case 39: case 40: next(); break; }
        e.preventDefault();
      }
    }, false);
    document.addEventListener('click', function(e) {
      var t = e.target;
      while (t && t !== document.documentElement) { if (t.classList.contains('step')) { if (t !== activeStep) goto(t); break; } t = t.parentNode; }
    }, false);
    roots['impress-root-' + rootId] = { init: init, goto: goto, next: next, prev: prev };
    return roots['impress-root-' + rootId];
  };
})(document, window);`;

// Sample markdown for demo
const sampleMarkdown = `---
title: Welcome to ImpressFlow
theme: tech-dark
layout: line
---

# ImpressFlow

::: transform-slideup
>>>Transform your ideas<<< into >>>stunning 3D presentations<<<
:::

*Press → or Space to advance through animations*

---

# The Problem

::: transform-appear
Most presentation tools are >>>boring<<<, >>>flat<<<, and >>>forgettable<<<.
:::

Your audience deserves better.

^
---

# The Solution

::: transform-reveal
>>>ImpressFlow<<< turns simple Markdown into >>>cinematic experiences<<<.
:::

::: transform-highlight
Write in Markdown. >>>Present in 3D.<<<
:::

---

# Two-Column Layouts

::: two-column
+++
### Left Column

Use the \`+++ separator\` to split content between columns.

Perfect for comparisons!

+++
### Right Column

Professional side-by-side layouts for features, pros/cons, or image + text.

*No CSS required.*
:::

^
---

# Three-Column Layouts

::: three-column
+++
### Plan

- Define your story
- Write in Markdown
- Choose a theme

+++
### Create

- Pick a 3D layout
- Add animations
- Generate images

+++
### Present

- Fullscreen mode
- Keyboard navigation
- Wow your audience
:::

---

# Static Images

Embed any image with standard Markdown:

![Demo](https://placehold.co/800x300/1a1a2e/00d4ff?text=Your+Logo+%E2%80%A2+Screenshots+%E2%80%A2+Diagrams)

\`![Alt text](https://your-image-url.com/image.png)\`

---

# AI-Generated Images

Or let AI create visuals from your descriptions:

![image: Abstract glowing neural network with flowing data streams](placeholder)

\`![image: Your description here](placeholder)\`

*Enable AI Images and add your Gemini API key*

^
---

# Animation: Appear

::: transform-appear
Every presentation tells a story. Build tension by revealing >>>one idea<<< at a >>>time<<<.
:::

Perfect for bullet points and key messages.

---

# Animation: Reveal

::: transform-reveal
>>>Transform-reveal<<< creates a >>>dramatic curtain wipe<<< that >>>unveils your message<<<.
:::

Great for reveals and announcements.

---

# Animation: Slide Up

::: transform-slideup
Content >>>rises into view<<< with >>>smooth motion<<< creating >>>visual flow<<<.
:::

Ideal for lists and sequential information.

---

# Animation: Slide Left

::: transform-slideleft
Ideas >>>enter the stage<<< from >>>off-screen<<< bringing >>>dynamic energy<<<.
:::

Use for introductions and new concepts.

^
---

# Animation: Highlight

::: transform-highlight
When you need to emphasize the >>>most important point<<<, highlight it.
:::

::: transform-highlight
>>>This is your key takeaway.<<<
:::

---

# Animation: Glow

::: transform-glow
Add >>>dramatic emphasis<<< with a >>>pulsing glow<<< effect.
:::

Perfect for calls-to-action and important numbers.

---

# Animation: Big

::: transform-big
Sometimes you just need to go >>>BIG<<<.
:::

::: transform-big
>>>$1M<<< in revenue. >>>10x<<< growth. >>>100%<<< satisfaction.
:::

---

# Animation: Skew

::: transform-skew
Add >>>attitude<<< and >>>edge<<< to your message.
:::

Great for bold statements and disruptive ideas.

^
---

# 6 Professional Themes

::: two-column
+++
### Dark Themes
- **Tech Dark** - Cyberpunk vibes
- **Creative** - Bold gradients
- **Workshop** - Hacker aesthetic

+++
### Light Themes
- **Clean Light** - Minimal elegance
- **Corporate** - Business professional
- **Crowd Tamers** - Startup fresh
:::

---

# 7 Spatial Layouts

::: two-column
+++
### Classic
1. **Line** - Snake pattern (this demo!)
2. **Spiral** - Flowing journey
3. **Grid** - Organized matrix

+++
### Dynamic
4. **Herringbone** - Zigzag energy
5. **Zoom** - Depth navigation
6. **Sphere** - 3D orbital
7. **Cascade** - Waterfall effect
:::

^
---

# Get Started

::: transform-slideup
>>>1. Write<<< your content in Markdown
:::

::: transform-slideup
>>>2. Choose<<< your theme and layout
:::

::: transform-slideup
>>>3. Add<<< animations and images
:::

::: transform-slideup
>>>4. Present<<< in stunning 3D
:::

---

# Ready?

::: transform-big
>>>Start creating.<<<
:::

Edit the Markdown on the left and click **Generate Presentation**.
`;

// Initialize
function init() {
  // Set sample markdown
  markdownInput.value = sampleMarkdown;

  // Sync dropdowns with frontmatter from sample
  const fmMatch = sampleMarkdown.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fmLines = fmMatch[1].split('\n');
    for (const line of fmLines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        if (key.trim() === 'theme') themeSelect.value = value;
        if (key.trim() === 'layout') layoutSelect.value = value;
      }
    }
  }

  // Tab switching
  markdownTab.addEventListener('click', () => switchTab('markdown'));
  notionTab.addEventListener('click', () => switchTab('notion'));

  // Generate button
  generateBtn.addEventListener('click', handleGenerate);

  // Preview actions
  fullscreenBtn.addEventListener('click', openFullscreen);
  downloadBtn.addEventListener('click', downloadHtml);

  // API Key toggle
  generateImagesCheckbox.addEventListener('change', (e) => {
    apiKeySection.style.display = e.target.checked ? 'flex' : 'none';
  });

  // Load saved API key
  const savedApiKey = localStorage.getItem('gemini-api-key');
  if (savedApiKey) {
    geminiApiKeyInput.value = savedApiKey;
  }

  // Save API key on change
  geminiApiKeyInput.addEventListener('change', (e) => {
    localStorage.setItem('gemini-api-key', e.target.value);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleGenerate();
    }
  });

  // Handle window resize - update iframe dimensions
  window.addEventListener('resize', () => {
    if (generatedHtml && previewIframe.classList.contains('visible')) {
      const container = previewIframe.parentElement;
      const rect = container.getBoundingClientRect();
      previewIframe.style.width = rect.width + 'px';
      previewIframe.style.height = rect.height + 'px';
    }
  });
}

// Tab switching
function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons
  markdownTab.classList.toggle('active', tab === 'markdown');
  notionTab.classList.toggle('active', tab === 'notion');

  // Update tab content
  markdownTabContent.classList.toggle('active', tab === 'markdown');
  notionTabContent.classList.toggle('active', tab === 'notion');
}

// Generate presentation
async function handleGenerate() {
  const theme = themeSelect.value;
  const layout = layoutSelect.value;
  const generateImages = generateImagesCheckbox.checked;
  const apiKey = geminiApiKeyInput.value.trim();

  let source, sourceType;

  if (currentTab === 'markdown') {
    source = markdownInput.value.trim();
    sourceType = 'markdown';

    if (!source) {
      showToast('Please enter some Markdown content', 'error');
      return;
    }
  } else {
    source = notionUrl.value.trim();
    sourceType = source.includes('notion.site') ? 'notion-public' : 'notion-api';

    if (!source) {
      showToast('Please enter a Notion URL', 'error');
      return;
    }
  }

  // Check for API key if images are requested
  if (generateImages && !apiKey) {
    showToast('Please enter a Gemini API key to generate images', 'error');
    return;
  }

  // Show loading state
  setLoading(true);

  try {
    // Generate HTML (async for image generation)
    console.log('Generating presentation...');
    generatedHtml = await generatePresentation(source, theme, layout, apiKey, generateImages);
    console.log('Generated HTML length:', generatedHtml.length);

    // Update preview
    showPreview(generatedHtml);

    showToast('Presentation generated successfully!', 'success');
  } catch (error) {
    console.error('Generation error:', error);
    showToast(error.message || 'Failed to generate presentation', 'error');
  } finally {
    setLoading(false);
  }
}

// Generate presentation HTML (client-side)
async function generatePresentation(markdown, theme, layout, apiKey, generateImages) {
  // Quick-parse frontmatter to get theme for image generation
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  let frontmatterTheme = null;
  if (fmMatch) {
    const themeMatch = fmMatch[1].match(/^theme:\s*(.+)$/m);
    if (themeMatch) frontmatterTheme = themeMatch[1].trim();
  }

  // Determine theme early for image styling
  const finalTheme = theme || frontmatterTheme || 'tech-dark';

  // Process images first (before parsing) with theme for styling
  const processedMarkdown = await processImagesInMarkdown(markdown, apiKey, generateImages, finalTheme);

  // Parse markdown
  const { frontmatter, slides, directions } = parseMarkdown(processedMarkdown);

  // Use frontmatter values as defaults for layout
  const finalLayout = layout || frontmatter.layout || 'line';

  // Calculate positions (pass directions for line layout)
  const positions = calculatePositions(slides.length, finalLayout, directions);

  // Generate slides HTML
  const slidesHtml = slides.map((slide, i) => {
    const pos = positions[i];
    return `
      <div id="slide-${i + 1}"
           class="step slide"
           data-x="${pos.x}"
           data-y="${pos.y}"
           data-z="${pos.z}"
           data-rotate-x="${pos.rotateX}"
           data-rotate-y="${pos.rotateY}"
           data-rotate-z="${pos.rotateZ}"
           data-scale="${pos.scale}">
        <div class="slide-content">
          ${slide.html}
        </div>
      </div>
    `;
  }).join('\n');

  // Build full HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.title || 'ImpressFlow Presentation'}</title>
  <link href="${getGoogleFontsUrl(finalTheme)}" rel="stylesheet">
  <style>
    ${getThemeCSS(finalTheme)}
    ${getBaseCSS()}
  </style>
</head>
<body class="impress-not-supported">
  <div id="impress" data-width="1200" data-height="700">
    ${slidesHtml}
    <div id="overview" class="step" data-x="0" data-y="0" data-scale="10"></div>
  </div>

  <!-- Navigation hover zones -->
  <div id="nav-prev" class="nav-zone nav-prev" onclick="impress().prev()">
    <div class="nav-icon">&lt;</div>
  </div>
  <div id="nav-next" class="nav-zone nav-next" onclick="impress().next()">
    <div class="nav-icon">&gt;</div>
  </div>

  <script>${IMPRESS_JS}<\/script>
  <script>impress().init();<\/script>
</body>
</html>`;
}

// Parse markdown into slides
function parseMarkdown(content) {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let frontmatter = {};
  let body = content;

  if (frontmatterMatch) {
    const fmLines = frontmatterMatch[1].split('\n');
    for (const line of fmLines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        frontmatter[key.trim()] = valueParts.join(':').trim();
      }
    }
    body = frontmatterMatch[2];
  }

  // Split into slides
  const slideTexts = body.split(/\n---\n/).filter(s => s.trim());

  // Extract direction markers (^ at end of slide means next goes down)
  const directions = [];
  const cleanedSlideTexts = slideTexts.map(text => {
    const trimmed = text.trim();
    // Check if slide ends with ^ on its own line
    const lines = trimmed.split('\n');
    let lastContentLine = lines.length - 1;
    while (lastContentLine >= 0 && lines[lastContentLine].trim() === '') {
      lastContentLine--;
    }

    if (lastContentLine >= 0 && lines[lastContentLine].trim() === '^') {
      // Remove the marker and record direction as 'down'
      lines.splice(lastContentLine, 1);
      directions.push('down');
      return lines.join('\n').trim();
    }

    directions.push('right');
    return trimmed;
  });

  const slides = cleanedSlideTexts.map((text, index) => {
    // Convert markdown to HTML
    const html = markdownToHtml(text.trim());
    const titleMatch = text.match(/^#\s+(.+)$/m);

    return {
      index,
      title: titleMatch ? titleMatch[1] : `Slide ${index + 1}`,
      html,
    };
  });

  return { frontmatter, slides, directions };
}

// Extract image generation requests from markdown
function extractImageRequests(md) {
  const requests = [];
  const regex = /!\[image:\s*([^\]]+)\]\(([^)]*)\)/gi;
  let match;
  while ((match = regex.exec(md)) !== null) {
    const fallbackUrl = match[2].trim();
    requests.push({
      fullMatch: match[0],
      prompt: match[1].trim(),
      fallback: fallbackUrl && fallbackUrl !== 'placeholder' ? fallbackUrl : null
    });
  }
  return requests;
}

// Theme-specific image style prompts
function getImageStyleForTheme(theme) {
  const styles = {
    'tech-dark': {
      style: 'Simple abstract geometric shapes combining to form a cohesive illustration. Minimalist, modern, clean lines. Low-poly or vector art aesthetic. Dark background.',
      colors: 'Use cyan (#00d4ff) as the primary accent color, with purple (#7c3aed) as secondary. Subtle use of pink (#f472b6) for highlights. Dark navy/black (#0a0a0f) background.'
    },
    'clean-light': {
      style: 'Corporate Memphis illustration style. Flat design with simple shapes, elongated limbs on human figures, playful but professional. Minimal shadows, bold simple forms.',
      colors: 'Use blue (#2563eb) as primary color, with slate gray (#64748b) for secondary elements. Amber/orange (#f59e0b) for accents. Clean white (#ffffff) background.'
    },
    'creative': {
      style: 'Collage-style illustration with pieced-together elements. Mixed media aesthetic, vibrant and bold. Neo-brutalist influence with raw, unpolished edges. Overlapping shapes and textures.',
      colors: 'Vibrant pink (#ec4899) as primary, purple (#8b5cf6) secondary, cyan (#06b6d4) accents. Warm cream (#fef3c7) background. High contrast, bold color blocking.'
    },
    'corporate': {
      style: 'Simple, refined, reserved aesthetic. Photorealistic or clean 3D rendered style. Professional and polished. Subtle gradients, soft lighting, premium feel.',
      colors: 'Deep blue (#1e40af) as primary, professional slate (#475569) secondary, green (#059669) for accents. Light gray (#f8fafc) background. Muted, sophisticated palette.'
    },
    'workshop': {
      style: 'Hand-drawn watercolor illustration style. Sketchy, artistic, looks hand-crafted. Pen and ink aesthetic with watercolor washes. Whiteboard or notebook sketch feel.',
      colors: 'Green (#22c55e) as primary color, purple (#a855f7) secondary, yellow (#eab308) accents. Dark charcoal (#18181b) background with illustrations appearing on light paper or whiteboard areas.'
    },
    'crowd-tamers': {
      style: 'Clean modern professional illustration style. Flat design with friendly approachable aesthetic. Startup vibes, minimal and polished. Simple shapes with soft gradients.',
      colors: 'Green (#61cf70) as primary accent, cyan/blue (#1fc2f9) secondary. Dark navy (#1A202C) for contrast elements. Light backgrounds (#F7FAFC, #ffffff). Professional yet warm feel.'
    }
  };

  return styles[theme] || styles['tech-dark'];
}

// Generate image using Gemini API
async function generateImage(prompt, apiKey, theme) {
  const themeStyle = getImageStyleForTheme(theme);
  const enhancedPrompt = `${prompt}.

Art Style: ${themeStyle.style}

Color Palette: ${themeStyle.colors}

Format: 16:9 aspect ratio, high quality, suitable for presentation slide.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate an image: ${enhancedPrompt}` }]
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'text/plain'
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract image data from response
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error('No image in response');
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

// Create placeholder SVG for images
function createImagePlaceholder(prompt) {
  const truncated = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
    <rect width="400" height="225" fill="#1a1a2e" stroke="#7c3aed" stroke-width="2" stroke-dasharray="8,4"/>
    <text x="200" y="100" text-anchor="middle" fill="#8888aa" font-family="sans-serif" font-size="14">AI Image</text>
    <text x="200" y="125" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="11">${truncated}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Process markdown and generate images
async function processImagesInMarkdown(md, apiKey, generateImages, theme) {
  const requests = extractImageRequests(md);

  if (requests.length === 0) return md;

  let result = md;

  for (const req of requests) {
    let imageUrl;

    if (generateImages && apiKey) {
      showToast(`Generating image: ${req.prompt.substring(0, 30)}...`, 'info');
      imageUrl = await generateImage(req.prompt, apiKey, theme);
    }

    // Fall back to: 1) provided fallback URL, 2) placeholder SVG
    if (!imageUrl) {
      imageUrl = req.fallback || createImagePlaceholder(req.prompt);
    }

    // Replace the markdown image syntax with an img tag
    result = result.replace(req.fullMatch, `<img src="${imageUrl}" alt="${req.prompt}" class="ai-image">`);
  }

  return result;
}

// Parse column layout directives
function parseColumnLayout(md) {
  // Check for column layout directive (more lenient regex)
  const twoColMatch = md.match(/:::\s*two-column\s*\n([\s\S]*?)\n\s*:::/);
  const threeColMatch = md.match(/:::\s*three-column\s*\n([\s\S]*?)\n\s*:::/);

  // Parse columns from content - splits on +++ and extracts metadata
  function parseColumns(content) {
    const columns = [];
    // Match each column: +++ followed by optional metadata, then content until next +++ or end
    const regex = /\+\+\+([^\n]*)\n([\s\S]*?)(?=\n\+\+\+|$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const metadata = match[1].trim();
      const colContent = match[2].trim();
      const hasSpan2 = metadata.includes('{.span-2}');
      columns.push({
        content: colContent,
        span2: hasSpan2
      });
    }
    return columns;
  }

  // Helper to render a column
  function renderColumn(col) {
    const spanClass = col.span2 ? ' span-2' : '';
    return `<div class="column${spanClass}">${markdownToHtmlBasic(col.content)}</div>`;
  }

  if (twoColMatch) {
    const content = twoColMatch[1];
    const columns = parseColumns(content);
    const colHtml = columns.map(renderColumn).join('');

    const before = md.substring(0, twoColMatch.index);
    const after = md.substring(twoColMatch.index + twoColMatch[0].length);
    return {
      html: markdownToHtmlBasic(before) + `<div class="columns two-column">${colHtml}</div>` + markdownToHtmlBasic(after),
      hasColumns: true
    };
  }

  if (threeColMatch) {
    const content = threeColMatch[1];
    const columns = parseColumns(content);
    const colHtml = columns.map(renderColumn).join('');

    const before = md.substring(0, threeColMatch.index);
    const after = md.substring(threeColMatch.index + threeColMatch[0].length);
    return {
      html: markdownToHtmlBasic(before) + `<div class="columns three-column">${colHtml}</div>` + markdownToHtmlBasic(after),
      hasColumns: true
    };
  }

  return { html: null, hasColumns: false };
}

// Basic markdown to HTML (without column parsing to avoid recursion)
function markdownToHtmlBasic(md) {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images (already processed, just pass through img tags)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ordered">$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive list items
    .replace(/(<li class="ordered">.*<\/li>\n?)+/gs, '<ol>$&</ol>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<].+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h|<ul|<ol|<pre|<blockquote|<img|<div)/g, '$1')
    .replace(/(<\/h\d>|<\/ul>|<\/ol>|<\/pre>|<\/blockquote>|<\/div>)<\/p>/g, '$1');
}

// Valid transform types
const TRANSFORM_TYPES = ['appear', 'reveal', 'slideup', 'slideleft', 'skew', 'glow', 'big', 'highlight'];

// Parse transform block directives and markers
function parseTransformBlocks(md) {
  // Match ::: transform-{type} ... ::: blocks
  const transformRegex = /:::\s*transform-(\w+)\s*\n([\s\S]*?)\n\s*:::/g;
  let result = md;
  let hasTransforms = false;

  result = result.replace(transformRegex, (match, transformType, content) => {
    // Validate transform type
    if (!TRANSFORM_TYPES.includes(transformType)) {
      return match; // Return unchanged if invalid type
    }

    hasTransforms = true;

    // Process >>>text<<< markers within the block
    // Each marker becomes a substep with the specified transform
    let substepIndex = 0;
    const processedContent = content.replace(/>>>([^<]+)<<</g, (markerMatch, text) => {
      substepIndex++;
      // For skew, add a random skew angle between 1-17 degrees, positive or negative
      if (transformType === 'skew') {
        const angle = (Math.floor(Math.random() * 17) + 1) * (Math.random() < 0.5 ? -1 : 1);
        return `<span class="substep substep-${transformType}" data-substep="${substepIndex}" style="--skew-angle: ${angle}deg">${text}</span>`;
      }
      return `<span class="substep substep-${transformType}" data-substep="${substepIndex}">${text}</span>`;
    });

    // Wrap in a transform container
    return `<div class="transform-block transform-${transformType}">${markdownToHtmlBasic(processedContent)}</div>`;
  });

  return { html: result, hasTransforms };
}

// Simple markdown to HTML conversion with column and transform support
function markdownToHtml(md) {
  // First check for column layouts
  const columnResult = parseColumnLayout(md);
  if (columnResult.hasColumns) {
    // Also process transforms within column content
    const transformResult = parseTransformBlocks(columnResult.html);
    return transformResult.html;
  }

  // Check for transform blocks
  const transformResult = parseTransformBlocks(md);
  if (transformResult.hasTransforms) {
    // Process remaining markdown that's not in transform blocks
    return transformResult.html.replace(/(<div class="transform-block[^>]*>)([\s\S]*?)(<\/div>)/g, (match, open, content, close) => {
      return open + content + close;
    }).split(/(<div class="transform-block[\s\S]*?<\/div>)/).map((part, i) => {
      if (part.startsWith('<div class="transform-block')) {
        return part;
      }
      return markdownToHtmlBasic(part);
    }).join('');
  }

  return markdownToHtmlBasic(md);
}

// Calculate slide positions
function calculatePositions(count, layout, directions = []) {
  const positions = [];

  // Handle line layout separately (needs directions array)
  if (layout === 'line') {
    return calculateLinePositions(count, directions);
  }

  for (let i = 0; i < count; i++) {
    let pos;

    switch (layout) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(count));
        const col = i % cols;
        const row = Math.floor(i / cols);
        pos = { x: col * 1500, y: row * 1000, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
        break;
      }
      case 'herringbone': {
        const direction = i % 2 === 0 ? 1 : -1;
        pos = {
          x: i * 800,
          y: direction * 400,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: direction * 15,
          scale: 1,
        };
        break;
      }
      case 'zoom': {
        pos = { x: 0, y: 0, z: -i * 3000, rotateX: 0, rotateY: 0, rotateZ: 0, scale: Math.pow(0.8, i) };
        break;
      }
      case 'sphere': {
        // === SPHERE LAYOUT ===
        // Imagine pulling a string from the center of the sphere outward in a random direction.
        // Where it intersects the sphere surface is where a slide is placed.
        // The slide faces outward (away from center).
        // The camera is even further out along that same line, looking back at the slide.

        // Calculate sphere radius based on total slide area
        // Each slide is 1200x700 = 840,000 sq pixels
        // Sphere surface area should be ~5x total slide area for comfortable spacing
        const slideWidth = 1200;
        const slideHeight = 700;
        const slideArea = slideWidth * slideHeight;
        const totalSlideArea = count * slideArea;
        const sphereSurfaceArea = 5 * totalSlideArea;
        // Surface area of sphere = 4πr², so r = sqrt(surfaceArea / 4π)
        const radius = Math.sqrt(sphereSurfaceArea / (4 * Math.PI));

        // Use Fibonacci sphere algorithm for even distribution across the sphere
        // This gives much better spacing than random placement
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5° - the golden angle

        // y goes from near-top to near-bottom (avoiding exact poles where rotation is undefined)
        // For single slide, place at equator
        const t = count === 1 ? 0.5 : i / (count - 1);
        const y = 0.9 - t * 1.8; // y from 0.9 to -0.9

        // Radius at this y level on unit sphere: sqrt(1 - y²)
        const radiusAtY = Math.sqrt(1 - y * y);

        // Azimuthal angle using golden angle for even spacing around the sphere
        const phi = i * goldenAngle;

        // Convert to Cartesian coordinates on the sphere surface
        const x = Math.cos(phi) * radiusAtY * radius;
        const z = Math.sin(phi) * radiusAtY * radius;
        const yPos = y * radius;

        // Calculate rotation so the slide faces OUTWARD from sphere center
        // The slide's default orientation faces +Z direction
        // We need to rotate it to face the outward radial direction

        // rotateY: rotation around Y axis to face the correct azimuthal direction
        // atan2(x, z) gives the angle from +Z toward +X
        const rotateY = Math.atan2(x, z) * (180 / Math.PI);

        // rotateX: tilt up or down based on latitude
        // At y=0 (equator): no tilt needed (rotateX = 0)
        // At y>0 (upper hemisphere): tilt up (negative rotateX)
        // At y<0 (lower hemisphere): tilt down (positive rotateX)
        const rotateX = -Math.asin(y) * (180 / Math.PI);

        pos = {
          x: Math.round(x),
          y: Math.round(yPos),
          z: Math.round(z),
          rotateX: Math.round(rotateX),
          rotateY: Math.round(rotateY),
          rotateZ: 0,
          scale: 1,
        };

        // Debug logging
        console.log(`Slide ${i}: pos(${pos.x}, ${pos.y}, ${pos.z}) rot(${pos.rotateX}, ${pos.rotateY}, 0) radius=${Math.round(radius)}`);
        break;
      }
      case 'cascade': {
        // Waterfall effect with better separation
        pos = {
          x: i * 300,
          y: i * 250,
          z: -i * 800,
          rotateX: 15,
          rotateY: -10,
          rotateZ: 0,
          scale: 1 - (i * 0.05), // Slightly smaller as they go back
        };
        break;
      }
      case 'spiral':
      default: {
        const angle = (i / count) * Math.PI * 4;
        const radius = 800 + i * 200;
        pos = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: -i * 500,
          rotateX: 0,
          rotateY: 0,
          rotateZ: (angle * 180) / Math.PI,
          scale: 1,
        };
        break;
      }
    }

    positions.push(pos);
  }

  return positions;
}

// Calculate positions for line layout with direction support
function calculateLinePositions(count, directions = []) {
  const stepX = 1500;
  const stepY = 1000;
  const positions = [];

  let x = 0;
  let y = 0;
  let horizontalDir = 1; // 1 = right, -1 = left

  for (let i = 0; i < count; i++) {
    // Record current position
    positions.push({
      x,
      y,
      z: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
    });

    // Determine next move based on direction marker
    if (directions[i] === 'down') {
      // Move down and reverse horizontal direction
      y += stepY;
      horizontalDir = horizontalDir === 1 ? -1 : 1;
    } else {
      // Move horizontally
      x += stepX * horizontalDir;
    }
  }

  return positions;
}

// Theme configurations including colors and fonts
const THEME_CONFIG = {
  'tech-dark': {
    colors: {
      '--background': '#0a0a0f',
      '--foreground': '#ffffff',
      '--primary': '#00d4ff',
      '--secondary': '#7c3aed',
      '--accent': '#f472b6',
      '--muted': '#8888aa',
    },
    fonts: {
      heading: "'JetBrains Mono', 'Fira Code', monospace",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      code: "'JetBrains Mono', 'Fira Code', monospace",
    },
    googleFonts: 'family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700',
  },
  'clean-light': {
    colors: {
      '--background': '#ffffff',
      '--foreground': '#1a1a1a',
      '--primary': '#2563eb',
      '--secondary': '#64748b',
      '--accent': '#f59e0b',
      '--muted': '#666666',
    },
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      code: "'JetBrains Mono', monospace",
    },
    googleFonts: 'family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400',
  },
  'creative': {
    colors: {
      '--background': '#fef3c7',
      '--foreground': '#1e1b4b',
      '--primary': '#ec4899',
      '--secondary': '#8b5cf6',
      '--accent': '#06b6d4',
      '--muted': '#6b7280',
    },
    fonts: {
      heading: "'Space Grotesk', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      code: "'JetBrains Mono', monospace",
    },
    googleFonts: 'family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400',
  },
  'corporate': {
    colors: {
      '--background': '#f8fafc',
      '--foreground': '#0f172a',
      '--primary': '#1e40af',
      '--secondary': '#475569',
      '--accent': '#059669',
      '--muted': '#64748b',
    },
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      code: "'JetBrains Mono', monospace",
    },
    googleFonts: 'family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400',
  },
  'workshop': {
    colors: {
      '--background': '#18181b',
      '--foreground': '#fafafa',
      '--primary': '#22c55e',
      '--secondary': '#a855f7',
      '--accent': '#eab308',
      '--muted': '#a1a1aa',
    },
    fonts: {
      heading: "'Caveat', cursive",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      code: "'JetBrains Mono', monospace",
    },
    googleFonts: 'family=Caveat:wght@400;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400',
  },
  'crowd-tamers': {
    colors: {
      '--background': '#F7FAFC',
      '--foreground': '#1A202C',
      '--primary': '#61cf70',
      '--secondary': '#1fc2f9',
      '--accent': '#61cf70',
      '--muted': '#718096',
    },
    fonts: {
      heading: "'Questrial', 'Inter', sans-serif",
      body: "'Quicksand', 'Inter', sans-serif",
      code: "'JetBrains Mono', monospace",
    },
    googleFonts: 'family=Questrial&family=Quicksand:wght@400;500;600;700&family=JetBrains+Mono:wght@400',
  },
};

// Get Google Fonts URL for a theme
function getGoogleFontsUrl(theme) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG['tech-dark'];
  return `https://fonts.googleapis.com/css2?${config.googleFonts}&display=swap`;
}

// Theme CSS
function getThemeCSS(theme) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG['tech-dark'];
  const { colors, fonts } = config;

  return `:root {
    ${Object.entries(colors).map(([k, v]) => `${k}: ${v};`).join('\n    ')}
    --font-heading: ${fonts.heading};
    --font-body: ${fonts.body};
    --font-code: ${fonts.code};
  }`;
}

// Base CSS for presentations
function getBaseCSS() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: var(--background);
    }

    body {
      font-family: var(--font-body);
      color: var(--foreground);
    }

    /* impress.js handles positioning dynamically - don't override */
    .impress-enabled #impress {
      position: absolute;
      transform-origin: top left;
      transition: all 1s ease-in-out;
    }

    .impress-enabled #impress-canvas {
      position: absolute;
      transform-origin: top left;
      transition: all 1s ease-in-out;
    }

    .step.slide {
      width: 1200px;
      height: 700px;
      padding: 60px;
      box-sizing: border-box;
      background: var(--background);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
    }

    .slide-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .slide h1 {
      font-family: var(--font-heading);
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }

    .slide h2 {
      font-family: var(--font-heading);
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 1rem;
    }

    .slide h3 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.75rem;
    }

    .slide p {
      font-size: 1.5rem;
      line-height: 1.7;
      margin-bottom: 1rem;
      color: var(--foreground);
    }

    .slide ul, .slide ol {
      font-size: 1.5rem;
      line-height: 1.8;
      margin-left: 2rem;
      margin-bottom: 1rem;
    }

    .slide li {
      margin-bottom: 0.5rem;
    }

    .slide code {
      background: rgba(0,0,0,0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: var(--font-code);
      font-size: 0.9em;
    }

    .slide pre {
      background: rgba(0,0,0,0.3);
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }

    .slide pre code {
      background: none;
      padding: 0;
      font-family: var(--font-code);
      font-size: 1.1rem;
      line-height: 1.5;
    }

    .slide blockquote {
      border-left: 4px solid var(--primary);
      padding-left: 1.5rem;
      font-style: italic;
      font-size: 1.75rem;
      color: var(--muted);
      margin: 1.5rem 0;
    }

    .slide strong {
      font-weight: 600;
      color: var(--primary);
    }

    /* Fallback: show first slide if impress.js fails */
    .impress-not-supported .step {
      position: relative;
      margin: 20px auto;
      opacity: 1;
    }

    .impress-not-supported #impress {
      position: relative;
      overflow: auto;
      height: auto;
    }

    .impress-enabled .step {
      opacity: 0.3;
      transition: opacity 0.5s;
    }

    .impress-enabled .step.active {
      opacity: 1;
    }

    #overview {
      pointer-events: none;
    }

    /* Column layouts */
    .columns {
      display: grid;
      gap: 40px;
      width: 100%;
      margin-top: 1rem;
    }

    .columns.two-column {
      grid-template-columns: 1fr 1fr;
    }

    .columns.three-column {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .column {
      display: flex;
      flex-direction: column;
    }

    .column h3 {
      color: var(--primary);
      margin-bottom: 0.75rem;
      font-size: 1.5rem;
    }

    /* Column spanning */
    .column.span-2 {
      grid-column: span 2;
    }

    /* AI generated images */
    .ai-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .slide-content img {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 8px;
    }

    /* ========================================
       SUBSTEP ANIMATIONS
       ======================================== */

    /* Base substep styles - hidden by default */
    .substep {
      opacity: 0;
      transition: all 0.6s ease-out;
    }

    /* Active substep - revealed */
    .substep.substep-active {
      opacity: 1;
    }

    /* Transform block container */
    .transform-block {
      display: inline;
    }

    /* ---- APPEAR: Simple fade in ---- */
    .substep-appear {
      opacity: 0;
    }
    .substep-appear.substep-active {
      opacity: 1;
    }

    /* ---- REVEAL: Mask slides off (clip-path wipe) ---- */
    .substep-reveal {
      opacity: 1;
      clip-path: inset(0 100% 0 0);
      transition: clip-path 0.8s ease-out;
    }
    .substep-reveal.substep-active {
      clip-path: inset(0 0 0 0);
    }

    /* ---- SLIDEUP: Slides up from below ---- */
    .substep-slideup {
      opacity: 0;
      transform: translateY(30px);
      display: inline-block;
    }
    .substep-slideup.substep-active {
      opacity: 1;
      transform: translateY(0);
    }

    /* ---- SLIDELEFT: Slides in from right ---- */
    .substep-slideleft {
      opacity: 0;
      transform: translateX(50px);
      display: inline-block;
    }
    .substep-slideleft.substep-active {
      opacity: 1;
      transform: translateX(0);
    }

    /* ---- SKEW: Starts normal, ends skewed with random angle ---- */
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

    /* ---- GLOW: Fade in with pulsing glow ---- */
    .substep-glow {
      opacity: 0;
      text-shadow: none;
    }
    .substep-glow.substep-active {
      opacity: 1;
      animation: glowPulse 2s ease-in-out infinite;
    }
    @keyframes glowPulse {
      0%, 100% {
        text-shadow: 0 0 10px var(--primary), 0 0 20px var(--primary), 0 0 30px var(--primary);
      }
      50% {
        text-shadow: 0 0 5px var(--primary), 0 0 10px var(--primary);
      }
    }

    /* ---- BIG: Scales up to 1.3x and bolds ---- */
    .substep-big {
      opacity: 0;
      transform: scale(1);
      display: inline-block;
    }
    .substep-big.substep-active {
      opacity: 1;
      transform: scale(1.3);
      transform-origin: center center;
      font-weight: bold;
    }

    /* ---- HIGHLIGHT: Animated background highlight ---- */
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
      background: var(--secondary);
      z-index: -1;
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 0.5s ease-out;
      border-radius: 4px;
    }
    .substep-highlight.substep-active::before {
      transform: scaleX(1);
    }

    /* Ensure highlighted text is readable */
    .substep-highlight.substep-active {
      color: var(--background);
      transition: color 0.3s ease-out 0.2s;
    }

    /* ========================================
       NAVIGATION HOVER ZONES
       ======================================== */

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

    .nav-zone:active .nav-icon {
      transform: scale(0.95);
    }

    /* Hide navigation in overview */
    .impress-on-overview .nav-zone {
      display: none;
    }
  `;
}

// Show preview
function showPreview(html) {
  // Get the actual container dimensions and set explicit pixel dimensions
  const container = previewIframe.parentElement;
  const containerRect = container.getBoundingClientRect();
  previewIframe.style.width = containerRect.width + 'px';
  previewIframe.style.height = containerRect.height + 'px';

  // Set the content
  previewIframe.srcdoc = html;
  previewIframe.classList.add('visible');
  previewPlaceholder.classList.add('hidden');
}

// Open fullscreen
function openFullscreen() {
  if (!generatedHtml) {
    showToast('Generate a presentation first', 'error');
    return;
  }

  const newWindow = window.open('', '_blank');
  newWindow.document.write(generatedHtml);
  newWindow.document.close();
}

// Download HTML
function downloadHtml() {
  if (!generatedHtml) {
    showToast('Generate a presentation first', 'error');
    return;
  }

  const blob = new Blob([generatedHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'presentation.html';
  a.click();
  URL.revokeObjectURL(url);

  showToast('Downloaded presentation.html', 'success');
}

// Set loading state
function setLoading(loading) {
  console.log('setLoading called with:', loading);
  generateBtn.disabled = loading;
  btnText.style.display = loading ? 'none' : 'inline';
  btnLoading.style.display = loading ? 'inline-flex' : 'none';
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
