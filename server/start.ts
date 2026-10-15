/**
 * Flex Wallet — production entrypoint
 * Serves the Bun API + built Vite frontend from a single process.
 * HF Spaces expects PORT env var (default 7860).
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { join } from 'path'
import { existsSync, statSync } from 'fs'
import { buildApi } from './api'

const PORT = Number(process.env.PORT ?? 7860)
const DIST = join(process.cwd(), 'dist')

if (!existsSync(DIST)) {
  console.error('[start] dist/ not found — run `bun run build` first.')
  process.exit(1)
}

// Mime types for static assets
function mimeType(path: string): string {
  if (path.endsWith('.js'))   return 'application/javascript'
  if (path.endsWith('.mjs'))  return 'application/javascript'
  if (path.endsWith('.css'))  return 'text/css'
  if (path.endsWith('.svg'))  return 'image/svg+xml'
  if (path.endsWith('.png'))  return 'image/png'
  if (path.endsWith('.ico'))  return 'image/x-icon'
  if (path.endsWith('.woff2')) return 'font/woff2'
  if (path.endsWith('.woff'))  return 'font/woff'
  if (path.endsWith('.json')) return 'application/json'
  return 'text/plain'
}

function staticFile(rel: string): Response | null {
  const full = join(DIST, rel)
  if (!existsSync(full) || statSync(full).isDirectory()) return null
  return new Response(Bun.file(full), {
    headers: { 'Content-Type': mimeType(full) },
  })
}

new Elysia()
  .use(cors({ origin: true }))
  // API routes
  .use(buildApi())
  // Static assets (hashed filenames from vite build)
  .get('/assets/*', ({ request }) => {
    const url = new URL(request.url)
    return staticFile(url.pathname) ?? new Response('Not found', { status: 404 })
  })
  // Root and other static files
  .get('/*', ({ request }) => {
    const url = new URL(request.url)
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname
    return staticFile(pathname) ?? new Response(Bun.file(join(DIST, 'index.html')), {
      headers: { 'Content-Type': 'text/html' },
    })
  })
  .listen(PORT)

console.log(`[Flex Wallet] Running on http://0.0.0.0:${PORT}`)
