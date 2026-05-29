FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine

# Apply the latest alpine security patches on top of the pinned base image
# (the base lags behind fixed OS-package CVEs; image-scan blocks on those).
USER root
RUN apk --no-cache upgrade
USER nginx

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/ || exit 1
