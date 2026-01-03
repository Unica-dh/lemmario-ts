FROM node:20-alpine

# Install pnpm and required tools
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY .env ./.env

# Copy payload package
COPY packages/payload-cms ./packages/payload-cms

# Install ALL dependencies (including dev for ts-node)
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3000

# Start server in development mode with ts-node
WORKDIR /app/packages/payload-cms
CMD ["pnpm", "dev"]
