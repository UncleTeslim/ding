FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
RUN npm ci \
    && ROLLUP_NATIVE="$(node -e 'const version = require("./node_modules/rollup/package.json").version; const libc = process.report.getReport().header.glibcVersionRuntime ? "gnu" : "musl"; const arch = { x64: `x64-${libc}`, arm64: `arm64-${libc}`, arm: `arm-${libc === "gnu" ? "gnueabihf" : "musleabihf"}`, ppc64: `ppc64-${libc}`, riscv64: `riscv64-${libc}`, s390x: "s390x-gnu" }[process.arch]; if (!arch) throw new Error(`Unsupported Rollup Linux architecture: ${process.arch}`); process.stdout.write(`@rollup/rollup-linux-${arch}@${version}`)')" \
    && ROLLUP_PACKAGE="${ROLLUP_NATIVE%@*}" \
    && ROLLUP_ARCHIVE="$(npm pack "$ROLLUP_NATIVE" --silent)" \
    && mkdir -p "node_modules/$ROLLUP_PACKAGE" \
    && tar -xzf "$ROLLUP_ARCHIVE" --strip-components=1 -C "node_modules/$ROLLUP_PACKAGE" \
    && rm "$ROLLUP_ARCHIVE"
RUN npm run build

FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache su-exec
COPY package*.json ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/widget/package.json ./packages/widget/package.json
COPY packages/dashboard/package.json ./packages/dashboard/package.json
RUN apk add --no-cache --virtual .native-build python3 make g++ \
    && npm ci --omit=dev --workspace @ding/server --include-workspace-root=false \
    && apk del .native-build
# The runtime serves prebuilt browser assets and does not need package managers.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg
RUN mkdir -p /app/data && chown -R node:node /app
COPY --from=builder --chown=node:node /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=node:node /app/packages/server/src/db/migrations ./packages/server/dist/db/migrations
COPY --from=builder --chown=node:node /app/packages/dashboard/dist ./packages/dashboard/dist
COPY --from=builder --chown=node:node /app/packages/widget/dist ./packages/widget/dist
COPY --chown=node:node scripts/setup.mjs ./scripts/setup.mjs
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "packages/server/dist/index.js"]
