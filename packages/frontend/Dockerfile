FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./

# Copy frontend package
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/frontend ./packages/frontend

# Build
WORKDIR /app/packages/frontend
RUN pnpm build

# Production stage
FROM node:20-alpine

RUN npm install -g pnpm@8.15.1

WORKDIR /app

# Copy built application
COPY --from=base /app/packages/frontend/.next ./.next
COPY --from=base /app/packages/frontend/public ./public
COPY --from=base /app/packages/frontend/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
