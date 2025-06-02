# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# Use --frozen-lockfile for reproducible installs if package-lock.json is up-to-date
# Or use `npm ci` which is generally recommended for CI/build environments
RUN npm ci

# Copy the rest of the application code (respecting .dockerignore)
COPY . .

# Build the application
# The `NEXT_TELEMETRY_DISABLED` environment variable is optional, to disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# ENV PORT 3000 # Next.js listens on port 3000 by default, uncomment to override

# Create a non-root user for security
# Using `nextjs` as username, matching the chown in COPY
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
# These files are created by `next build` when `output: 'standalone'` is set in next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# The CMD for a standalone Next.js app is to run the server.js file
CMD ["node", "server.js"]
