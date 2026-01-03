FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./

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

# Copy workspace files
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-workspace.yaml ./

# Copy built application
COPY --from=base /app/packages/frontend/.next ./packages/frontend/.next
COPY --from=base /app/packages/frontend/public ./packages/frontend/public
COPY --from=base /app/packages/frontend/package.json ./packages/frontend/
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/frontend/node_modules ./packages/frontend/node_modules

WORKDIR /app/packages/frontend

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
