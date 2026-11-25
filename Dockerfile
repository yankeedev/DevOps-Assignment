# syntax=docker/dockerfile:1

# Building the frontend assets
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/. .
RUN npm run build

# build backend typescript app
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci
COPY backend/. .
RUN npx prisma generate
RUN npm run build

# Production runtime image for the application
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=6000

# install curl for health-checks and create a non-root user for security
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    groupadd --system app && useradd --system --gid app --create-home --home-dir /home/app app && \
    mkdir -p /app/backend /app/frontend && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Copy the built backend files and runtime dependencies
COPY --from=backend-build /app/backend/package*.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/prisma ./backend/prisma

# copy the built frontend bundle 
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# FIX: Ensure the 'app' user owns all files and has WRITE permissions
RUN chown -R app:app /app /home/app && \
    chmod -R u+w /app/backend/node_modules

# switch to a non-root user before runtime
USER app

# Expose both ports the app is running to
EXPOSE 6000 4174

# Health check for the API Part of the app
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:6000/health || exit 1

# Start service in the same container. Node.js handles serving BOTH the API and Frontend.
CMD ["sh", "-c", "cd /app/backend && ./node_modules/.bin/prisma db push; cd /app && node /app/backend/dist/index.js"]
