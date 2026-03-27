/**
 * Outreach Agent — server entry point.
 */

import 'dotenv/config';
import { createA2aApp } from '../shared/appFactory.js';
import { outreachAgent } from './agent.js';

const PORT = Number(process.env['PORT'] ?? 3004);
const URL = process.env['OUTREACH_AGENT_URL'] ?? `http://localhost:${PORT}`;

const app = createA2aApp({
    agent: outreachAgent,
    name: 'outreach_agent',
    description: (
        'Verifies patients connected with community resources. Handles follow-up, ' +
        'identifies barriers, and escalates unresolvable issues.'
    ),
    url: URL,
    version: '1.0.0',
    requireApiKey: false,
});

app.listen(PORT, () => {
    console.info(`outreach_agent running on port ${PORT}`);
    console.info(`Agent card: GET http://localhost:${PORT}/.well-known/agent-card.json`);
});
