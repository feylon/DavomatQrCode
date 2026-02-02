# ---------- 1-bosqich: build ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- 2-bosqich: production ----------
FROM node:22-slim AS production
ENV NODE_ENV=production \
    TZ=Asia/Tashkent \
    PORT=3001
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migratsiyalar ilova ishga tushganda avtomatik bajariladi (DB_MIGRATIONS_RUN=true)
CMD ["node", "dist/src/main"]
