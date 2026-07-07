# syntax=docker/dockerfile:1
# admin-hub (SYSTEM_ADMIN console) — Vite/React SPA → nginx for Cloud Run.
# Cloud Run injects PORT (default 8080); nginx listens on 8080.

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines this at BUILD time. It's a PUBLIC API URL, safe to bake.
ARG VITE_ADMIN_GRAPHQL_URL="https://api.diaspoplug.net/graphql"
ENV VITE_ADMIN_GRAPHQL_URL=$VITE_ADMIN_GRAPHQL_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
