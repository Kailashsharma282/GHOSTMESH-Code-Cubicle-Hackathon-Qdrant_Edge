# ==============================================================================
# GHOSTMESH FRONTEND CONSOLE DOCKERFILE (Production Multi-Stage)
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY apps/frontend/package.json ./

# Install dependencies cleanly
RUN npm install

# Copy application source code
COPY apps/frontend/ ./

# Build production distribution bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Production Nginx Runner Stage
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default Nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static bundle
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom reverse-proxy and WebSocket configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
