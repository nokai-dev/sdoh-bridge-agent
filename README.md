# SDOH Bridge Agent

**A2A + MCP + FHIR for Social Determinants of Health**

Connect patients to community resources by bridging clinical FHIR records with social risk screening and referral tracking.

---

## Architecture

```
Prompt Opinion Platform
│
├── SDOH Bridge Agent (port 3001) ◄─── FHIR Context (patient data)
│   │
│   ├── Resource Agent (port 3002) ──► Community Resources (mock 211/Aunt Bertha)
│   │
│   ├── Referral Agent (port 3003) ──► Referral Packet + Follow-up
│   │
│   └── Outreach Agent (port 3004) ──► Patient Follow-up + Outcome
│
└── Synthea Mock FHIR Server ──── 3 synthetic SDOH patients
```

## Agents

| Agent | Port | Role |
|-------|------|------|
| **sdoh_bridge_agent** | 3001 | Root agent — orchestrates full SDOH workflow |
| **resource_agent** | 3002 | Matches Z-codes to community resources |
| **referral_agent** | 3003 | Generates referral packets + schedules follow-up |
| **outreach_agent** | 3004 | Verifies connection, records outcomes |

## Quick Start

### 1. Generate Synthea Test Data

```bash
npm run synthea
```

This creates 3 synthetic patients with realistic SDOH factors.

### 2. Start All Agents

```bash
npm run dev
```

Agents start on ports 3001-3004. Agent cards at:
- `http://localhost:3001/.well-known/agent-card.json`
- `http://localhost:3002/.well-known/agent-card.json`
- `http://localhost:3003/.well-known/agent-card.json`
- `http://localhost:3004/.well-known/agent-card.json`

### 3. Test with curl

```bash
# Get agent card
curl http://localhost:3001/.well-known/agent-card.json | jq .

# Send A2A message (requires X-API-Key)
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sdoh-bridge-secret-key-2026" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "getPatientDemographics",
      "arguments": {}
    },
    "id": 1
  }'
```

## Z-Codes (ICD-10 SDOH Taxonomy)

| Code | Category | Example |
|------|----------|---------|
| Z55 | Education/Literacy | Cannot read, language barrier |
| Z58 | Physical Environment | Air pollution, water, food access |
| Z59 | Housing/Economic | Homeless, poverty, low income |
| Z60 | Social Environment | Living alone, acculturation |
| Z61 | Childhood Adversity | Abuse, neglect, parental loss |
| Z62 | Childhood Adversity | Inadequate supervision, hostility |
| Z63 | Psychosocial/Support | Family separation, dependent relative |
| Z64 | Pregnancy/Healthcare | Unwanted pregnancy, bariatric surgery |
| Z65 | Legal/Social | Imprisonment, crime victim, war |

## FHIR Context

When deployed on Prompt Opinion, FHIR context is injected automatically via A2A message metadata:

```json
{
  "fhirUrl": "https://fhir.example.com/r4",
  "fhirToken": "Bearer eyJ...",
  "patientId": "patient-maria-santos"
}
```

## Demo Mode

In demo mode (`FHIR_MOCK=true`), agents use local Synthea JSON files instead of a real FHIR server. This allows full workflow testing without external dependencies.

## Built With

- [@google/adk](https://github.com/google/adk-python) — Agent Development Kit
- [@a2a-js/sdk](https://github.com/nickolas/jspm.io) — A2A Protocol
- FHIR R4 — Healthcare data standard
- ICD-10 Z-codes — Social determinants taxonomy
