# Use the official Bun image as the base image
FROM oven/bun:1.0 as base

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb (if exists)
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies
FROM base as dependencies
RUN bun install --frozen-lockfile

# Build the application
FROM dependencies as build
COPY . .
RUN bun run build
RUN bun run build:worker

# Production image
FROM oven/bun:1.0-slim as production

WORKDIR /app

# Copy node_modules and built files from the build stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Set environment variables
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Create a script to run both the API server and worker
RUN echo '#!/bin/sh\n\
bun run dist/index.js & \
bun run dist/worker.js & \
wait\n' > /app/start.sh && chmod +x /app/start.sh

# Run the application
CMD ["/app/start.sh"]
