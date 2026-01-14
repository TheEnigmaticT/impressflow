/**
 * Simple development server for the ImpressFlow web app
 * Usage: node web/server.js [port]
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');
const PORT = parseInt(process.argv[2]) || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function serveFile(filePath, res) {
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

const server = createServer(async (req, res) => {
  // Remove query string and decode URI
  let pathname = decodeURIComponent(req.url.split('?')[0]);

  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = join(PUBLIC_DIR, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  try {
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Serve index.html from directory
      await serveFile(join(filePath, 'index.html'), res);
    } else {
      await serveFile(filePath, res);
    }
  } catch {
    // File not found, try serving index.html for SPA routing
    await serveFile(join(PUBLIC_DIR, 'index.html'), res);
  }
});

server.listen(PORT, () => {
  console.log(`
  ImpressFlow Web App
  -------------------
  Local:   http://localhost:${PORT}

  Press Ctrl+C to stop
  `);
});
