FROM node:24-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/* && corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/app.db
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/* && groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app --home /app app && mkdir /data && chown app:app /data
COPY --from=build --chown=app:app /app/.output ./.output
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/prisma.config.ts ./prisma.config.ts
USER app
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
