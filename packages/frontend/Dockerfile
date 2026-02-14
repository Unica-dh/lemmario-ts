FROM node:20-alpine AS base

# Build arguments for environment variables
ARG NEXT_PUBLIC_SITE_URL=https://glossari.dh.unica.it
ARG NEXT_PUBLIC_API_URL=https://glossari.dh.unica.it/api

# Set as environment variables for build
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# LAYER CACHING OPTIMIZATION:
# Step 1: Copy only dependency files (change rarely)
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY packages/frontend/package.json ./packages/frontend/

# Step 2: Install dependencies (cached if lockfile unchanged)
RUN pnpm install --frozen-lockfile

# Step 3: Copy source code (changes frequently)
COPY tsconfig.json ./
COPY packages/frontend ./packages/frontend

# Step 4: Build (with environment variables)
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
COPY --from=base /app/packages/frontend/next.config.js ./packages/frontend/
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/frontend/node_modules ./packages/frontend/node_modules

WORKDIR /app/packages/frontend

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
