FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Build arguments for Payload Admin UI
ARG PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
ARG DATABASE_URI=postgres://localhost:5432/lemmario_db

# Set environment variables for build
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV DATABASE_URI=${DATABASE_URI}

# LAYER CACHING OPTIMIZATION:
# Step 1: Copy only dependency files (change rarely)
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY packages/payload-cms/package.json ./packages/payload-cms/

# Step 2: Install dependencies (cached if lockfile unchanged)
RUN pnpm install --frozen-lockfile

# Step 3: Copy source code (changes frequently)
COPY tsconfig.json ./
COPY packages/payload-cms ./packages/payload-cms

# Step 4: Build TypeScript and Payload Admin panel
WORKDIR /app/packages/payload-cms
RUN pnpm build && npx payload build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8.15.1

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./

# Copy payload package.json for pnpm install
COPY packages/payload-cms/package.json ./packages/payload-cms/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/packages/payload-cms/dist ./packages/payload-cms/dist
COPY --from=builder /app/packages/payload-cms/build ./packages/payload-cms/build

# Copy necessary config files
COPY packages/payload-cms/tsconfig.json ./packages/payload-cms/

# Expose port
EXPOSE 3000

# Set working directory for execution
WORKDIR /app/packages/payload-cms

# Use production mode
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/server.js"]
