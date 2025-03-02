# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json files for all components
COPY package.json .yarnrc.yml yarn.lock ./
COPY api/package.json ./api/
COPY frontend/package.json ./frontend/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/types/package.json ./packages/types/

# Install dependencies using yarn workspaces
RUN corepack enable
RUN yarn install

# Build the SDK and frontend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.yarnrc.yml ./
COPY --from=deps /app/yarn.lock ./

# Copy source code
COPY . .

# Build everything using the scripts from package.json
# This ensures correct build order: types -> sdk -> api & frontend
RUN corepack enable
RUN yarn build

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Enable corepack for yarn version management
RUN corepack enable

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy the entire app directory structure to maintain workspace relationships
COPY --from=builder /app .

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the server
CMD ["yarn", "start"]

FROM runner AS prod

# Development image with tappd simulator endpoint
FROM runner AS dev
# ENV DSTACK_SIMULATOR_ENDPOINT="http://host.docker.internal:8090"
ENV DSTACK_SIMULATOR_ENDPOINT="http://172.17.0.1:8090"
