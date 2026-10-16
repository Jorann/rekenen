# The parent dashboard: its own service, reading the app's database. Build from the repository root:
#   docker build -f dashboard/Dockerfile .
# The web part is the same on every platform, so build it natively (fast) even for arm64 images.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY dashboard/package.json dashboard/
RUN npm ci
COPY shared shared
# The dashboard draws her character with the app's own drawings.
COPY client/src client/src
COPY dashboard dashboard
RUN npm run build -w dashboard

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY dashboard/package.json dashboard/
RUN npm ci --omit=dev --workspace dashboard
COPY shared shared
COPY dashboard/server dashboard/server
COPY --from=build /app/dashboard/dist dashboard/dist
EXPOSE 3001
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "dashboard/server/index.ts"]
