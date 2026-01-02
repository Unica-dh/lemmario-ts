FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./

# Copy payload package
COPY packages/payload-cms/package.json ./packages/payload-cms/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/payload-cms ./packages/payload-cms

# Build
WORKDIR /app/packages/payload-cms
RUN pnpm build

# Production stage
FROM node:20-alpine

RUN npm install -g pnpm@8.15.1

WORKDIR /app

# Copy built application
COPY --from=base /app/packages/payload-cms/dist ./dist
COPY --from=base /app/packages/payload-cms/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]
