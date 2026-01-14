# Phase 10: Web App & Polish

**Completion Promise:** `<promise>ALL_PHASES_COMPLETE</promise>`

## Scope
Web UI, full integration, documentation, final polish.

## Tasks
1. Create web/index.html with library UI
2. Implement presentation list view
3. Implement create modal (markdown paste, Notion URL input)
4. Implement present button (opens in new tab)
5. Implement refresh button (for Notion-sourced presentations)
6. Add Notion OAuth connect button
7. Write README with full usage instructions
8. Create example presentations
9. Test all theme + layout combinations
10. Performance optimization (if needed)

## Web App Structure

```
web/
├── index.html        # Main app
├── app.js            # Client-side logic
├── styles.css        # Styles
└── auth.js           # Supabase auth handling
```

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ImpressFlow - Presentations from Markdown</title>
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div id="app">
    <!-- Auth state: logged out -->
    <div id="auth-view" class="view">
      <div class="auth-container">
        <h1>🎭 ImpressFlow</h1>
        <p>Create stunning 3D presentations from Markdown or Notion</p>
        <button id="login-btn" class="primary">Sign in with Google</button>
      </div>
    </div>
    
    <!-- Auth state: logged in -->
    <div id="library-view" class="view hidden">
      <header>
        <h1>🎭 My Presentations</h1>
        <div class="header-actions">
          <button id="notion-connect-btn" class="secondary">
            Connect Notion
          </button>
          <button id="create-btn" class="primary">
            + New Presentation
          </button>
          <button id="logout-btn" class="text">Sign Out</button>
        </div>
      </header>
      
      <div id="presentations-grid" class="grid">
        <!-- Populated by JS -->
      </div>
      
      <div id="empty-state" class="empty hidden">
        <p>No presentations yet. Create your first one!</p>
      </div>
    </div>
  </div>
  
  <!-- Create Modal -->
  <dialog id="create-modal">
    <h2>Create Presentation</h2>
    
    <div class="tabs">
      <button class="tab active" data-tab="markdown">Paste Markdown</button>
      <button class="tab" data-tab="notion-url">Notion URL</button>
      <button class="tab" data-tab="notion-pages">My Notion Pages</button>
    </div>
    
    <div class="tab-content" id="tab-markdown">
      <textarea id="markdown-input" rows="10" 
        placeholder="# My Presentation

---

# Slide One

Content here...

---

# Slide Two

More content..."></textarea>
    </div>
    
    <div class="tab-content hidden" id="tab-notion-url">
      <input type="url" id="notion-url" placeholder="https://mysite.notion.site/...">
      <p class="hint">Enter a published Notion page URL</p>
    </div>
    
    <div class="tab-content hidden" id="tab-notion-pages">
      <div id="notion-pages-list">
        <p class="hint">Connect Notion to see your pages</p>
      </div>
    </div>
    
    <div class="options">
      <label>
        Theme
        <select id="theme-select">
          <option value="tech-dark">Tech Dark</option>
          <option value="clean-light">Clean Light</option>
          <option value="creative">Creative</option>
          <option value="corporate">Corporate</option>
          <option value="workshop">Workshop</option>
        </select>
      </label>
      
      <label>
        Layout
        <select id="layout-select">
          <option value="spiral">Spiral</option>
          <option value="grid">Grid</option>
          <option value="herringbone">Herringbone</option>
          <option value="zoom">Infinite Zoom</option>
          <option value="sphere">Sphere</option>
          <option value="cascade">Cascade</option>
        </select>
      </label>
    </div>
    
    <div class="modal-actions">
      <button id="cancel-create" class="secondary">Cancel</button>
      <button id="confirm-create" class="primary">Generate</button>
    </div>
    
    <div id="create-loading" class="loading hidden">
      <p>⏳ Generating presentation...</p>
    </div>
  </dialog>
  
  <script src="auth.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

## app.js

```javascript
// Initialize Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// DOM Elements
const authView = document.getElementById('auth-view');
const libraryView = document.getElementById('library-view');
const presentationsGrid = document.getElementById('presentations-grid');
const emptyState = document.getElementById('empty-state');
const createModal = document.getElementById('create-modal');

// Auth state
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    showLibrary();
    loadPresentations();
  } else {
    currentUser = null;
    showAuth();
  }
});

function showAuth() {
  authView.classList.remove('hidden');
  libraryView.classList.add('hidden');
}

function showLibrary() {
  authView.classList.add('hidden');
  libraryView.classList.remove('hidden');
}

// Login
document.getElementById('login-btn').onclick = async () => {
  await supabase.auth.signInWithOAuth({ provider: 'google' });
};

document.getElementById('logout-btn').onclick = async () => {
  await supabase.auth.signOut();
};

// Load presentations
async function loadPresentations() {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading presentations:', error);
    return;
  }
  
  if (data.length === 0) {
    presentationsGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  presentationsGrid.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  presentationsGrid.innerHTML = data.map(p => `
    <div class="presentation-card" data-id="${p.id}">
      <h3>${escapeHtml(p.title)}</h3>
      <p class="meta">${p.slide_count} slides • ${p.theme}</p>
      <p class="date">${new Date(p.created_at).toLocaleDateString()}</p>
      <div class="card-actions">
        <button onclick="present('${p.id}')" class="primary">▶ Present</button>
        ${p.notion_page_id ? `<button onclick="refresh('${p.id}')" class="secondary">↻</button>` : ''}
        <button onclick="deletePres('${p.id}')" class="danger">🗑</button>
      </div>
    </div>
  `).join('');
}

// Present
async function present(id) {
  const { data } = await supabase
    .from('presentations')
    .select('storage_path')
    .eq('id', id)
    .single();
  
  if (data) {
    const { data: urlData } = supabase.storage
      .from('presentations')
      .getPublicUrl(`${data.storage_path}/index.html`);
    
    window.open(urlData.publicUrl, '_blank');
  }
}

// Refresh (re-generate from Notion)
async function refresh(id) {
  if (!confirm('Re-generate this presentation from Notion?')) return;
  
  // Fetch presentation details
  const { data: pres } = await supabase
    .from('presentations')
    .select('*')
    .eq('id', id)
    .single();
  
  // Re-generate
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-presentation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: pres.source_type,
      input: pres.source_url,
      theme: pres.theme,
      layout: pres.layout,
      imageStyle: pres.image_style
    })
  });
  
  if (response.ok) {
    loadPresentations();
  }
}

// Delete
async function deletePres(id) {
  if (!confirm('Delete this presentation?')) return;
  
  await supabase.from('presentations').delete().eq('id', id);
  loadPresentations();
}

// Create modal
document.getElementById('create-btn').onclick = () => {
  createModal.showModal();
};

document.getElementById('cancel-create').onclick = () => {
  createModal.close();
};

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  };
});

// Create presentation
document.getElementById('confirm-create').onclick = async () => {
  const loading = document.getElementById('create-loading');
  loading.classList.remove('hidden');
  
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  let source, input;
  
  if (activeTab === 'markdown') {
    source = 'markdown';
    input = document.getElementById('markdown-input').value;
  } else if (activeTab === 'notion-url') {
    source = 'notion_published';
    input = document.getElementById('notion-url').value;
  }
  
  const theme = document.getElementById('theme-select').value;
  const layout = document.getElementById('layout-select').value;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-presentation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source, input, theme, layout })
    });
    
    if (response.ok) {
      createModal.close();
      loadPresentations();
    } else {
      const { error } = await response.json();
      alert(`Error: ${error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
  
  loading.classList.add('hidden');
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

## README.md

```markdown
# ImpressFlow 🎭

Transform Markdown and Notion pages into stunning 3D presentations with impress.js.

## Features

- 📝 **Multiple input sources**: Local Markdown, Notion published pages, Notion API
- 🎨 **5 themes**: tech-dark, clean-light, creative, corporate, workshop
- 🌀 **6 layouts**: spiral, grid, herringbone, zoom, sphere, cascade
- 🖼️ **AI images**: Auto-generate graphics with Gemini (Nano Banana)
- ⚡ **Lazy loading**: Images load progressively as you present
- ☁️ **Web app**: Host your presentation library in the cloud

## CLI Usage

### Installation

```bash
npm install -g impressflow
```

### Generate a presentation

```bash
impressflow presentation.md
```

### Options

```bash
impressflow slides.md --theme workshop --layout cascade -o ./dist
```

| Option | Description |
|--------|-------------|
| `-t, --theme` | Theme name (default: tech-dark) |
| `-l, --layout` | Layout algorithm (default: spiral) |
| `-o, --output` | Output directory (default: ./output) |
| `--no-images` | Disable AI image generation |

## Markdown Syntax

```markdown
---
title: My Presentation
theme: tech-dark
layout: spiral
---

# Slide Title
<!-- H1 creates a new slide -->

Content here.

![image: A robot helping an entrepreneur](placeholder)
<!-- AI-generated image -->

::: two-column
### Left
Content

### Right
Content
:::

<!-- NOTES: Speaker notes here -->
```

## Web App

Visit [impressflow.app](https://impressflow.app) to:
- Create presentations from Markdown paste or Notion URL
- Connect your Notion account for private pages
- Manage your presentation library
- Present directly from the browser

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm run test

# Run locally
npm run dev
```

## License

MIT
```

## Final Verification Checklist

1. **All themes work**
   ```bash
   for theme in tech-dark clean-light creative corporate workshop; do
     node dist/index.js examples/demo.md -t $theme -o /tmp/$theme --no-images
   done
   ```

2. **All layouts work**
   ```bash
   for layout in spiral grid herringbone zoom sphere cascade; do
     node dist/index.js examples/demo.md -l $layout -o /tmp/$layout --no-images
   done
   ```

3. **Tests pass**
   ```bash
   npm run typecheck && npm run test && npm run test:e2e
   ```

4. **CLI works end-to-end**
   ```bash
   node dist/index.js examples/demo.md -o ./test-output
   open ./test-output/index.html
   ```

5. **Supabase functions deploy**
   ```bash
   supabase functions deploy
   ```

## Verification

```bash
# Full test suite
npm run typecheck && npm run test && npm run test:e2e

# Build CLI
npm run build

# Test CLI end-to-end
node dist/index.js examples/demo.md -o examples/output
open examples/output/index.html

# Start local Supabase
supabase start

# Deploy functions
supabase functions deploy
```

When all verifications pass, output:

`<promise>ALL_PHASES_COMPLETE</promise>`
