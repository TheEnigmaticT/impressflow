# ImpressFlow

Transform Markdown into stunning 3D presentations powered by [impress.js](https://impress.js.org/).

## About

ImpressFlow is a web-based tool that converts Markdown documents into beautiful, spatially-arranged presentations. Built on top of the excellent [impress.js](https://github.com/impress/impress.js) library by Bartek Szopka, ImpressFlow adds:

- **Markdown-first authoring** - Write your presentations in simple Markdown
- **Notion integration** - Import from public Notion pages
- **Six 3D layouts** - Spiral, Grid, Herringbone, Zoom, Sphere, and Cascade
- **Five professional themes** - Tech Dark, Clean Light, Creative, Corporate, and Workshop
- **AI image generation** - Generate images from prompts using Gemini API
- **Column layouts** - Two and three-column layouts with spanning support

## Quick Start

1. Visit the web app
2. Write your Markdown (separate slides with `---`)
3. Choose a theme and layout
4. Click "Generate Presentation"
5. Download or view in fullscreen

## Markdown Syntax

### Basic Slides

```markdown
# My Presentation

---

# Slide One

Your content here with **bold** and *italic* text.

- Bullet points
- Work great

---

# Slide Two

More content...
```

### AI Image Generation

Generate images with the Gemini API using this syntax:

```markdown
![image: A futuristic city skyline at sunset]()
```

With a fallback URL:

```markdown
![image: A mountain landscape](https://example.com/fallback.jpg)
```

### Column Layouts

**Two columns:**

```markdown
::: two-column
+++
Left column content
+++
Right column content
:::
```

**Three columns with spanning:**

```markdown
::: three-column
+++ {.span-2}
This spans two columns
+++
Single column
:::
```

## Themes

| Theme | Description |
|-------|-------------|
| **Tech Dark** | Dark background with cyan and purple accents |
| **Clean Light** | Professional light theme with blue accents |
| **Creative** | Vibrant pinks and purples, neo-brutalist feel |
| **Corporate** | Refined, professional with deep blues |
| **Workshop** | Hand-drawn aesthetic with green accents |

## Layouts

| Layout | Description |
|--------|-------------|
| **Spiral** | Slides arranged in a 3D spiral |
| **Grid** | Classic grid arrangement |
| **Herringbone** | Alternating diagonal pattern |
| **Zoom** | Nested zoom effect |
| **Sphere** | Slides on a 3D sphere surface |
| **Cascade** | Stacked cascade arrangement |

## Credits

ImpressFlow is built on [impress.js](https://github.com/impress/impress.js), created by Bartek Szopka ([@bartaz](https://github.com/bartaz)). impress.js is a presentation framework based on the power of CSS3 transforms and transitions.

- **impress.js**: [https://github.com/impress/impress.js](https://github.com/impress/impress.js)
- **impress.js License**: MIT License

## License

MIT License

---

*Built with [impress.js](https://impress.js.org/)*
