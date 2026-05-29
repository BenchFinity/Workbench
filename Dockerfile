FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Distroless Chainguard nginx: nonroot (uid 65532), no shell, no package
# manager, daily-rebuilt with near-zero CVEs. See docs/adr/0001-distroless-base-images.md.
# Digest-pinned for reproducibility; refresh via Dependabot/Renovate or manually
# (docker buildx imagetools inspect cgr.dev/chainguard/nginx:latest).
FROM cgr.dev/chainguard/nginx:latest@sha256:71093c1127c31422838904b00b32287bd2bf58cd06e0abc3c85d96597d46a448

# Chainguard nginx mirrors the stock layout: nginx.conf includes
# /etc/nginx/conf.d/*.conf, listens on 8080, and serves /usr/share/nginx/html.
# Overwrite the base's default site (nginx.default.conf, also :8080) so only our
# SPA server block is active and there is no duplicate default_server.
COPY docker/nginx.conf /etc/nginx/conf.d/nginx.default.conf
COPY docker/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

# No HEALTHCHECK: distroless has no shell/wget. Container health is handled by
# orchestrator probes (Helm uses httpGet; compose has no healthcheck).
