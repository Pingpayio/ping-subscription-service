# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json files for all components
COPY package.json ./
COPY api/package.json ./api/
COPY frontend/package.json ./frontend/
COPY sdk/package.json ./sdk/

# Install dependencies for all components
RUN npm install
RUN cd api && npm install
RUN cd frontend && npm install
RUN cd sdk && npm install

# Build the SDK and frontend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/sdk/node_modules ./sdk/node_modules

# Copy source code
COPY . .

# Build the SDK
RUN cd sdk && npm pack

# Build the frontend
RUN cd frontend && npm run build

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy necessary files
COPY --from=builder /app/frontend/dist ./dist
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/api/server.js ./server.js
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/api/package.json ./package.json
COPY --from=deps /app/api/node_modules ./node_modules

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the server
CMD ["node", "server.js"]

FROM runner AS prod

# Development image with tappd simulator endpoint
FROM runner AS dev
# ENV DSTACK_SIMULATOR_ENDPOINT="http://host.docker.internal:8090"
ENV DSTACK_SIMULATOR_ENDPOINT="http://172.17.0.1:8090"
