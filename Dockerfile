# ── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Accept build-time env (VITE_ vars are baked in at build time)
ARG VITE_MEALIE_URL=http://localhost:3000
ENV VITE_MEALIE_URL=$VITE_MEALIE_URL

RUN npm run build

# ── Serve stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS serve

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 4173

# vite preview serves the pre-built dist on 0.0.0.0:4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
