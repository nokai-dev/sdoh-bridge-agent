# SDOH Bridge Agent

**Social Determinants of Health (SDOH) Bridge — A2A + MCP + FHIR**

Identifies patients' social risk factors (ICD-10 Z-codes Z55–Z65), matches them to community resources, generates referral packets, and tracks outcomes.

Built for the [Agents Assemble Hackathon](https://agents-assemble.devpost.com/) · May 11, 2026

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Prompt Opinion Platform                   │
│  (FHIR Context injected automatically into A2A messages)    │
└──────────────────────┬──────────────────────────────────────┘
                       │ A2A + FHIR Context
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               SDOH Bridge Agent (port 3001)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ SDOH Screen  │→│  Resource    │→│  Referral + Follow │  │
│  │ Interpreter  │ │  Matcher     │ │  up Scheduler      │  │
│  └──────────────┘ └──────────────┘ └──────────────────────-┘  │
│         ↑                                     ↑               │
│         └───────── FHIR R4 Server ──────────┘               │
│              (Synthea mock or real)                          │
└─────────────────────────────────────────────────────────────┘
                       │ A2A (sub-agents)
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│  Resource Agent │      │ Outreach Agent  │
│   (port 3002)   │      │   (port 3003)   │
└─────────────────┘      └─────────────────┘
```

## Agents

| Agent | Port | Role |
|-------|------|------|
| `sdoh_bridge_agent` | 3001 | Root agent. Receives FHIR context, orchestrates workflow |
| `resource_agent` | 3002 | Matches Z-codes to community resources |
| `outreach_agent` | 3003 | Schedules follow-up, writes outcomes to FHIR |

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY

# 3. Run all agents
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google AI Studio API key | Required |
| `SDOH_BRIDGE_AGENT_URL` | Public URL of this agent | `http://localhost:3001` |
| `FHIR_SERVER_URL` | FHIR R4 server URL | `http://localhost:8080` |
| `FHIR_SERVER_TOKEN` | FHIR bearer token | `demo-token` |

## A2A Testing

```bash
# Send a test message (no FHIR context)
curl -s -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", "id": 1, "method": "message/send",
    "params": {
      "messageId": "test-001",
      "message": {
        "messageId": "test-001", "role": "user",
        "content": [{"kind": "text", "text": "Patient has food insecurity (Z582). Find resources."}]
      }
    }
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['message']['parts'][0]['text'])"

# With FHIR context (simulating Prompt Opinion injection)
curl -s -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", "id": 1, "method": "message/send",
    "params": {
      "messageId": "fhir-001",
      "message": {
        "messageId": "fhir-001", "role": "user",
        "content": [{"kind": "text", "text": "Screen patient for SDOH needs"}],
        "metadata": {"http://localhost:5139/schemas/a2a/v1/fhir-context": {
          "fhirUrl": "http://localhost:8080",
          "fhirToken": "demo-token",
          "patientId": "patient-001"
        }}
      }
    }
  }'
```

## Tool Overview

### SDOH Tools (FHIR)
- `getSocialHistory` — Tobacco, alcohol, occupation, living situation
- `getSDOHObservations` — Documented Z-code observations
- `getActiveConditions` — Clinical context

### Resource Tools
- `sdoh_screen_interpreter` — PRAPARE/AHC → Z-codes with confidence
- `resource_matcher` — Z-codes → ranked community resources

### Referral Tools
- `referral_formatter` — Generate referral packet (letter + structured data)
- `followup_scheduler` — Schedule 14-day check-in task
- `outcome_writer` — Record outcome to FHIR CarePlan + SDOHObservation

## Z-Code Taxonomy (ICD-10 Z55–Z65)

| Code | Category |
|------|----------|
| Z582 | Food insecurity |
| Z591 | Housing instability |
| Z596 | Low income |
| Z602 | Living alone |
| Z603 | Acculturation difficulty |
| Z615–Z616 | Abuse (sexual/physical) |
| Z650 | Legal system access |
| Z658 | Psychosocial circumstances |

Full taxonomy: 50+ Z-codes mapped to resource categories in `shared/tools/sdoh.ts`

## Deployment

```bash
# Build
npm run build

# Production (Docker)
docker build -t ghcr.io/nokai-dev/sdoh-bridge-agent .
docker push ghcr.io/nokai-dev/sdoh-bridge-agent:latest
```

## Connection to Prompt Opinion

1. Build and deploy this agent (or run locally with ngrok for public URL)
2. In Prompt Opinion: **Agents → External Agents → Add Connection**
3. Enter your agent's base URL
4. Enable **FHIR Context** extension — Prompt Opinion injects credentials automatically

## Demo Flow

```
1. Care coordinator says: "Patient Maria G. — food insecure, isolated, can't afford meds"
2. SDOH Bridge Agent:
   - Interprets → Z582 (food), Z602 (living alone), Z596 (low income)
   - Matches → Community Food Bank, Senior Services, Medication Assistance
   - Generates referral packet with contact info + eligibility
   - Schedules 14-day follow-up
3. Outcome written back to FHIR
```

## License

MIT
