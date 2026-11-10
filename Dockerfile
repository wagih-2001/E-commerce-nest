
# Stage 1: Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Use the same npm version as the local environment
RUN npm install -g npm@11.20.0

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build NestJS application
RUN npm run build


# Stage 2: Production
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Use the same npm version
RUN npm install -g npm@11.20.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Application port
EXPOSE 3000

CMD ["node", "dist/main.js"]
