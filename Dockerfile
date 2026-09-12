# Multi-stage build for Signet

# Stage 1: Build the React Mini App
FROM node:22-alpine AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Build the Fastify Backend
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV STORAGE_DIR=/app/storage

# Install production dependencies only
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend output
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend output into server static directory
COPY --from=web-builder /app/web/dist ./dist/public

# Create storage directory for ephemeral PDFs
RUN mkdir -p /app/storage && chown -R node:node /app

USER node
EXPOSE 8080

CMD ["node", "dist/index.js"]
