# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S valthera -u 1001

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY --chown=valthera:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown valthera:nodejs logs

# Switch to non-root user
USER valthera

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node src/scripts/healthcheck.js || exit 1

# Start the bot
CMD ["node", "src/index.js"]
