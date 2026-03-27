# ── SDOH Bridge Agent — Full Stack ───────────────────────────────────────────
#
# Multi-arch Docker image for SDOH Bridge Agent system.
# Builds all 4 agents + reverse proxy.
#
# Build:
#   docker build -t sdoh-bridge-agent .
#
# Run:
#   docker run --rm -p 3000:3000 \
#     -e GOOGLE_API_KEY=your-key \
#     -e PUBLIC_URL=https://your-public-url.com \
#     ghcr.io/nokai-dev/sdoh-bridge-agent:latest
#
# Or with docker-compose (see docker-compose.yml):
#   docker-compose up

FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Install tini for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/reverse-proxy.ts ./reverse-proxy.ts

# Default port
ENV PORT=3000

# Public URL of this service (used in Agent Cards)
# MUST be set when deploying — e.g. https://sdoh-bridge-agent.xxx.up.railway.app
ENV PUBLIC_URL=http://localhost:3000

# Google AI Studio API key — pass via -e or secrets at runtime
# DO NOT bake into image
ENV GOOGLE_API_KEY=

# FHIR Server URL (for demo mode without Prompt Opinion)
ENV FHIR_SERVER_URL=http://localhost:8080/fhir
ENV FHIR_TOKEN=demo-token
ENV DEMO_PATIENT_ID=patient-maria-santos

ENTRYPOINT ["/usr/bin/tini", "--"]

# Start reverse proxy + all 4 agents
CMD ["sh", "-c", "\
    PORT=3001 SDOH_BRIDGE_AGENT_URL=${PUBLIC_URL}/sdoh_bridge \
               FHIR_EXTENSION_URI=http://localhost:5139/schemas/a2a/v1/fhir-context \
               node dist/sdoh_bridge_agent/server.js & \
    PORT=3002 RESOURCE_AGENT_URL=${PUBLIC_URL}/resource \
               node dist/resource_agent/server.js & \
    PORT=3003 REFERRAL_AGENT_URL=${PUBLIC_URL}/referral \
               node dist/referral_agent/server.js & \
    PORT=3004 OUTREACH_AGENT_URL=${PUBLIC_URL}/outreach \
               node dist/outreach_agent/server.js & \
    node_modules/.bin/npx tsx reverse-proxy.ts & \
    wait"]
