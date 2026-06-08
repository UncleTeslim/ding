FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY packages/server/package.json ./packages/server/package.json
RUN npm install --omit=dev -w @ding/server
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/src/db/migrations ./packages/server/dist/db/migrations
COPY --from=builder /app/packages/dashboard/dist ./packages/dashboard/dist
COPY --from=builder /app/packages/widget/dist ./packages/widget/dist
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]
