# syntax=docker/dockerfile:1.7
# Contexto de build: a raiz do repositório (o lockfile do pnpm fica lá).
#   docker build -f apps/api/Dockerfile -t tectalk-api .

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @tectalk/api build

# O Prisma CLI (migrate deploy) e o tsx (seed) são devDependencies e fazem parte da execução.
FROM build AS runtime
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["pnpm", "--filter", "@tectalk/api", "start:prod"]
