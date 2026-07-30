FROM node:20-slim AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@repo/database run generate
RUN pnpm --filter=@repo/database run build
RUN pnpm --filter=server build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

# Copy root dependencies and workspace config
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages

# Copy the server application preserving directory structure
COPY --from=builder /app/apps/server ./apps/server

RUN chmod +x apps/server/docker-entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["apps/server/docker-entrypoint.sh"]
