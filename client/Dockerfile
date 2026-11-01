# ==============================================================================
# Cyber Law Awareness Portal — Production Frontend Dockerfile
# Multi-stage build: Compiles React Vite SPA and serves via Nginx Alpine
# ==============================================================================

# Stage 1: Build the Vite production bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . ./

# Build arguments (defaults to relative /api for reverse-proxy routing)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build static bundle to /app/dist
RUN npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine-slim

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

