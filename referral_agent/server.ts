/**
 * Referral Agent — server entry point.
 */

import 'dotenv/config';
import { createA2aApp } from '../shared/appFactory.js';
import { referralAgent } from './agent.js';

const PORT = Number(process.env['PORT'] ?? 3003);
const URL = process.env['REFERRAL_AGENT_URL'] ?? `http://localhost:${PORT}`;

const app = createA2aApp({
    agent: referralAgent,
    name: 'referral_agent',
    description: (
        'Generates community resource referral packets and tracks follow-up outcomes. ' +
        'Creates formatted referral letters, schedules check-ins, and writes results to FHIR.'
    ),
    url: URL,
    version: '1.0.0',
    requireApiKey: false,
});

app.listen(PORT, () => {
    console.info(`referral_agent running on port ${PORT}`);
    console.info(`Agent card: GET http://localhost:${PORT}/.well-known/agent-card.json`);
});
