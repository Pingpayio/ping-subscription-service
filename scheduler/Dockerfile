# Use the official Bun image as the base image
FROM oven/bun:1.0 AS base

# Set environment variables
ENV BUN_INSTALL_CACHE_DIR=/app/.bun/cache

# Set the working directory
WORKDIR /app

# Create cache directory with correct permissions
RUN mkdir -p $BUN_INSTALL_CACHE_DIR && chmod 777 $BUN_INSTALL_CACHE_DIR

# Copy package files
COPY package.json bun.lock ./

# Install dependencies with caching
RUN --mount=type=cache,target=/app/.bun/cache \
    bun install

# Copy source files and build
COPY . .
RUN bun run build && bun run build:worker

# Production image
FROM oven/bun:1.0-slim AS production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs && \
    mkdir -p /app && \
    chown bunjs:nodejs /app

WORKDIR /app

# Copy node_modules and built files
COPY --from=base --chown=bunjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=bunjs:nodejs /app/dist ./dist
COPY --from=base --chown=bunjs:nodejs /app/package.json ./

# Expose the port the app runs on
EXPOSE 3001

# Create a script to run both the API server and worker
RUN echo '#!/bin/sh\nbun run dist/index.js & bun run dist/worker.js & wait\n' > /app/start.sh && \
    chmod +x /app/start.sh && \
    chown bunjs:nodejs /app/start.sh

# Use non-root user
USER bunjs

# Run the application
CMD ["/app/start.sh"]
