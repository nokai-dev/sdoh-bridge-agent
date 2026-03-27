/**
 * Outreach Agent — server entry point.
 */

import 'dotenv/config';
import { createA2aApp } from '../shared/appFactory.js';
import { outreachAgent } from './agent.js';

const PORT = Number(process.env['PORT'] ?? 3003);
const URL = process.env['OUTREACH_AGENT_URL'] ?? `http://localhost:${PORT}`;

const app = createA2aApp({
    agent: outreachAgent,
    name: 'outreach_agent',
    description: (
        'Manages follow-up and outcome tracking for SDOH referrals. ' +
        'Records whether patients connected with community resources and writes outcomes to FHIR.'
    ),
    url: URL,
    version: '1.0.0',
    requireApiKey: false,
});

app.listen(PORT, () => {
    console.info(`outreach_agent running on port ${PORT}`);
    console.info(`Agent card: GET http://localhost:${PORT}/.well-known/agent-card.json`);
});
