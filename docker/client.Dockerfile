# Build the Angular client
FROM node:24-bookworm-slim AS builder
WORKDIR /app

COPY src/main/webapp/package*.json ./
RUN npm ci

COPY src/main/webapp .

ENV NODE_ENV=production

RUN npm run build

# Minimal image to hold the built files
FROM alpine:3.21

COPY --from=builder /app/dist/StaffPlan/browser /srv

CMD ["sh", "-c", "echo 'Static files ready in /srv' && sleep infinity"]
