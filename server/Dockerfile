# ==============================================================================
# Cyber Law Awareness Portal — Production Backend Dockerfile
# Optimized lightweight Alpine container running Express under Node.js 20 LTS
# ==============================================================================

FROM node:20-alpine AS base

# Install system dependencies if required
RUN apk add --no-cache dumb-init

# Set environment
ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY server.js ./
COPY config/ ./config/
COPY models/ ./models/
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY services/ ./services/
COPY utils/ ./utils/

# Enforce least-privilege non-root execution
RUN chown -R node:node /app
USER node

# Expose internal Express port
EXPOSE 5000

# Container liveness & readiness health check using native Node.js fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Handle init process signals cleanly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]

