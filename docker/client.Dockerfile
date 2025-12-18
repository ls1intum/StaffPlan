# Build the Angular/Vite client
FROM node:24-bookworm-slim AS builder
WORKDIR /app

COPY src/main/webapp/package*.json ./
RUN npm ci

COPY src/main/webapp .

ENV NODE_ENV=production

RUN npm run build

# Serve the production build with nginx
FROM nginx:1.29-alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
