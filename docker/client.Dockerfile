# Build the Angular client
FROM node:24-bookworm-slim AS builder
WORKDIR /app

COPY src/main/webapp/package*.json ./
RUN npm ci

COPY src/main/webapp .

ENV NODE_ENV=production

RUN npm run build

# Minimal nginx to serve the Angular app
FROM nginx:alpine AS production

COPY --from=builder /app/dist/StaffPlan/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
