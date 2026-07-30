FROM node:20-slim AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@repo/database run generate
RUN pnpm --filter=@repo/database run build
RUN pnpm --filter=web build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production
# outputFileTracingRoot points at the monorepo root, so standalone output
# mirrors that structure under apps/web/ rather than flattening to app root.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
