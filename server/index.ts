/**
 * Flex Wallet — dev API server
 * Runs on port 3001; Vite proxies /api → here in development.
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { buildApi } from './api'

new Elysia()
  .use(cors({ origin: true }))
  .use(buildApi())
  .listen(3001)

console.log('Flex Wallet API running on http://localhost:3001')
