# Relais SMTP open source INVOOBLAST — déployable sur tout hébergeur Docker (Render, Fly.io, VPS…).
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY smtp-relay.mjs bounce-scan.mjs ./

ENV NODE_ENV=production
ENV INVOOBLAST_SMTP_RELAY_HOST=0.0.0.0

# Le port d’écoute vient de PORT (Render, Fly…) ou 18765 en local.
CMD ["node", "smtp-relay.mjs"]
