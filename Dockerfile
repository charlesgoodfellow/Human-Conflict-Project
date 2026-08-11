# Build the atlas, then serve dist/ as static files.
#
# Container hosts (Railway, Fly, Render) cannot detect this project by sniffing
# the repo: the site is generated into dist/, which is git-ignored, so there is
# no index.html, requirements.txt or package.json at the root to find. A
# Dockerfile states the build explicitly and skips detection altogether.

FROM python:3.12-slim AS build
WORKDIR /src
COPY . .

# SITE_URL is baked into canonical links, the sitemap and the social tags, so it
# has to be known at build time. Railway exposes the generated service domain as
# RAILWAY_PUBLIC_DOMAIN; set SITE_URL in the service variables to override it
# with a custom domain.
ARG SITE_URL=""
ARG RAILWAY_PUBLIC_DOMAIN=""
RUN SITE_URL="${SITE_URL:-https://${RAILWAY_PUBLIC_DOMAIN:-redrawn.example}}" \
    python3 build_site.py

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv
