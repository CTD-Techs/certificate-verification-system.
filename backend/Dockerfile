# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production && npm cache clean --force; \
    else \
      npm install --only=production && npm cache clean --force; \
    fi

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production && npm cache clean --force; \
    else \
      npm install --only=production && npm cache clean --force; \
    fi

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY --chown=nodejs:nodejs . .

# Create directories for logs and storage
RUN mkdir -p logs storage && \
    chown -R nodejs:nodejs logs storage

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]