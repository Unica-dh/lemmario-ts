FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./

# Copy payload package
COPY packages/payload-cms ./packages/payload-cms

# Install ALL dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Build TypeScript and Payload Admin panel
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
