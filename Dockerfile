# Flex Wallet — Hugging Face Docker Space
# Single-process: Bun API + pre-built Vite frontend on port 7860

FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# ── Build frontend ────────────────────────────────────────────────────────────
# Need devDependencies for the Vite build
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# ── Final image ───────────────────────────────────────────────────────────────
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app

# Copy production deps
COPY --from=base /app/node_modules ./node_modules
COPY package.json ./

# Copy server source
COPY server/ ./server/

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Persist data directory (SQLite)
RUN mkdir -p /app/data

ENV PORT=7860
EXPOSE 7860

# HF Spaces runs as uid 1000
RUN addgroup -S flexwallet && adduser -S flexwallet -G flexwallet
RUN chown -R flexwallet:flexwallet /app
USER flexwallet

CMD ["bun", "run", "server/start.ts"]
