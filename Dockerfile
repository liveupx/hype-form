# ===========================================
# HYPEFORM - Production Dockerfile
# ===========================================

# Build stage for client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install dependencies for sharp (image processing)
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma and generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy server code
COPY server/ ./server/

# Copy built client
COPY --from=client-builder /app/client/dist ./client/dist

# Create directories
RUN mkdir -p uploads logs

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server/index.js"]
