---
title: Building ImpressFlow with AI
theme: tech-dark
layout: spiral
---

# Building ImpressFlow with AI

From PRD to Production in One Session

---

# The Vision

**Problem:** Creating impress.js presentations requires manual HTML/CSS work

**Solution:** ImpressFlow - Convert Markdown to 3D Presentations

Started with a late-night conversation with Claude to draft the PRD

---

# The PRD Discussion

Collaborative design session with Claude:

- Defined core features and architecture
- Mapped out 11 development phases
- Created AGENTS.md specification
- Established verification criteria

*"What if we could build the whole thing autonomously?"*

---

# Enter Ralph Loops

**Ralph Loop** - Autonomous agent execution mode

```
/ralph-loop Read /workspace/AGENTS.md and execute
the agent to build ImpressFlow --max-iterations 10
```

One command to build an entire application

---

# The Architecture

```
src/
├── core/           # Pure functions, NO I/O
│   ├── parser/     # Markdown → SlideAST
│   ├── positioning/# 6 spatial algorithms
│   ├── themes/     # 5 themes
│   └── renderer/   # SlideAST → HTML

├── adapters/       # I/O boundaries
│   ├── input/      # File, Notion
│   ├── storage/    # Local, Supabase
│   └── images/     # Gemini AI
```

---

# 11 Phases, One Session

| Phase | Component | Tests |
|-------|-----------|-------|
| 0-1 | Scaffolding + Parser | 15 |
| 2-3 | Positioning + Themes | 37 |
| 4-5 | Renderer + CLI | 23 |
| 6-7 | Notion + Images | 31 |
| 8-10 | E2E + Supabase + Web | 50 |

**Total: 156 tests passing**

---

# The Magic: Autonomous Development

Each phase followed the same pattern:

1. Read phase specification
2. Implement features
3. Write comprehensive tests
4. Run verification: `npm run typecheck && npm run test && npm run build`
5. Output completion promise
6. Move to next phase

---

# What We Built

- **CLI Tool** - `impressflow input.md -o ./output`
- **6 Layouts** - Spiral, Grid, Herringbone, Zoom, Sphere, Cascade
- **5 Themes** - Tech Dark, Clean Light, Creative, Corporate, Workshop
- **Notion Integration** - Public pages and API access
- **AI Images** - Gemini-powered generation with caching
- **Web App** - Interactive browser-based editor

---

# Key Takeaways

1. **PRD Quality Matters** - Clear specs enable autonomous execution
2. **Phase-Based Development** - Small, verifiable increments
3. **Test-Driven** - Every phase has verification criteria
4. **Human + AI Collaboration** - Design together, execute autonomously

---

# Try It Yourself

```bash
# Generate this presentation
impressflow building-impressflow.md -o ./output

# Or use the web app
npm run web
# Open http://localhost:3000
```

**The future of software development is collaborative**

*Built with Claude Code + Ralph Loops*
