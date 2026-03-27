/**
 * Resource Agent — server entry point.
 */

import 'dotenv/config';
import { createA2aApp } from '../shared/appFactory.js';
import { resourceAgent } from './agent.js';

const PORT = Number(process.env['PORT'] ?? 3002);
const URL = process.env['RESOURCE_AGENT_URL'] ?? `http://localhost:${PORT}`;

const app = createA2aApp({
    agent: resourceAgent,
    name: 'resource_agent',
    description: (
        'Matches social needs (Z-codes) to community resources. ' +
        'Provides contact info, eligibility, languages, and Medicaid acceptance.'
    ),
    url: URL,
    version: '1.0.0',
    requireApiKey: false,
});

app.listen(PORT, () => {
    console.info(`resource_agent running on port ${PORT}`);
    console.info(`Agent card: GET http://localhost:${PORT}/.well-known/agent-card.json`);
});
