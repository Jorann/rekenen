# Builds the iPad app and runs it together with the API on port 3000.
# The built frontend is the same on every platform, so build it natively (fast) even for arm64 images.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY dashboard/package.json dashboard/
RUN npm ci
COPY shared shared
COPY client client
RUN npm run build -w client

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY dashboard/package.json dashboard/
RUN npm ci --omit=dev --workspace server
COPY shared shared
COPY server server
COPY --from=build /app/client/dist client/dist
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server/src/index.ts"]
