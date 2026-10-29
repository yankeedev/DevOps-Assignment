# syntax=docker/dockerfile:1

# Building the frontend assets
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend

# copy and install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# copy the frontend source and build production bundle
COPY frontend/. .
RUN npm run build

# build backend typescript app
FROM node:22-bookworm-slim AS backend-build

WORKDIR /app/backend

# Copy and install backend depencencies
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci

# Copy backend source and generate Prisma client before compiling TypeScript
COPY backend/. .
RUN npx prisma generate
RUN npm run build

# Production runtime image for the application
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# install curl for health-checks and create a non-root user for security
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    groupadd --system app && useradd --system --gid app --create-home --home-dir /home/app app && \
    mkdir -p /app/backend /app/frontend && \
    chown -R app:app /app

# Copy the built backend files and runtime dependencies
COPY --from=backend-build /app/backend/package*.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/prisma ./backend/prisma

# copy the built frontend bundle 
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# install the frontend static serve globally
RUN npm install -g serve

# switch to a non-root user before runtime
USER app

# Expose both ports the app is running to
EXPOSE 5000 4173

# Health check for the API Part of the app
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:5000/health || exit 1

# Start service in the same container
CMD ["sh", "-c", "node /app/backend/dist/index.js & serve -s /app/frontend/dist -l 4173 & wait"]