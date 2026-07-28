FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/widget/package.json ./packages/widget/package.json
COPY packages/dashboard/package.json ./packages/dashboard/package.json
RUN npm ci --omit=dev
RUN mkdir -p /app/data && chown -R node:node /app
COPY --from=builder --chown=node:node /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=node:node /app/packages/server/src/db/migrations ./packages/server/dist/db/migrations
COPY --from=builder --chown=node:node /app/packages/dashboard/dist ./packages/dashboard/dist
COPY --from=builder --chown=node:node /app/packages/widget/dist ./packages/widget/dist
USER node
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]
