# Multi-stage build for production optimization
FROM node:18-alpine as builder

# Install Sharp dependencies for Alpine Linux
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy frontend package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY backend/ ./backend/
COPY src/ ./src/
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY tailwind.config.js postcss.config.js ./

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine

# Install Sharp dependencies for Alpine Linux
RUN apk add --no-cache vips-dev

WORKDIR /app

# Copy backend and built frontend
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p backend/uploads backend/processed

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
WORKDIR /app/backend
CMD ["node", "server.js"]