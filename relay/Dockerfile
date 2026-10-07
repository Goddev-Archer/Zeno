# ==============================================================================
#   ZENO ZERO-KNOWLEDGE RELAY DOCKERFILE
#   Ultra-leichtgewichtiges, gehärtetes Alpine-Image für 1-Klick-Deployments
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Metadaten
LABEL org.opencontainers.image.title="Zeno Zero-Knowledge Relay"
LABEL org.opencontainers.image.description="Ephemeral WebSocket Blind Relay for Zeno Sovereign Messenger"
LABEL org.opencontainers.image.licenses="MIT"

# Abhängigkeiten installieren
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Quellcode kopieren
COPY server.mjs ./

# Sicherheits-Härtung: Nicht als Root ausführen
USER node

# Port freigeben
EXPOSE 4242

# Umgebungsvariablen
ENV NODE_ENV=production
ENV PORT=4242
ENV HOST=0.0.0.0

# Integrierter Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4242/health || exit 1

# Start-Kommando
CMD ["node", "server.mjs"]

