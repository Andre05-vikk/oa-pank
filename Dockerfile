# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    sqlite-dev

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite \
    libc6-compat

WORKDIR /usr/src/app

# Create necessary directories
RUN mkdir -p /usr/src/app/data /usr/src/app/keys

# Copy built node modules and application from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Set proper permissions for SQLite
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

EXPOSE 3000

CMD ["npm", "start"]