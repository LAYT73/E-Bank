# Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else yarn install --frozen-lockfile; \
  fi

COPY . .

ARG VITE_API_URL
ARG VITE_DEFAULT_CACHE_TTL
ARG VITE_DEFAULT_TIMEOUT
ARG NODE_ENV=production

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEFAULT_CACHE_TTL=$VITE_DEFAULT_CACHE_TTL
ENV VITE_DEFAULT_TIMEOUT=$VITE_DEFAULT_TIMEOUT
ENV NODE_ENV=$NODE_ENV

RUN yarn build

# Production-образ с Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
