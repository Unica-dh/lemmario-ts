FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./

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

# Copy package files for production dependencies
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/pnpm-lock.yaml ./
COPY --from=base /app/package.json ./
COPY --from=base /app/packages/payload-cms/package.json ./packages/payload-cms/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=base /app/packages/payload-cms/dist ./packages/payload-cms/dist

# Expose port
EXPOSE 3000

# Start server from the correct directory
WORKDIR /app/packages/payload-cms
CMD ["node", "dist/server.js"]
