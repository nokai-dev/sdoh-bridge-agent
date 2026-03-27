/**
 * SDOH Bridge Agent — server entry point.
 *
 * Implements the A2A protocol for the SDOH Bridge Agent.
 * Receives FHIR context from Prompt Opinion, returns resource referrals.
 */

import 'dotenv/config';
import { createA2aApp } from '../shared/appFactory.js';
import { sdohBridgeAgent } from './agent.js';

const PORT = Number(process.env['PORT'] ?? 3001);
const URL = process.env['SDOH_BRIDGE_AGENT_URL'] ?? `http://localhost:${PORT}`;

const FHIR_EXTENSION = process.env['FHIR_EXTENSION_URI'] ?? 'http://localhost:5139/schemas/a2a/v1/fhir-context';

const app = createA2aApp({
    agent: sdohBridgeAgent,
    name: 'sdoh_bridge_agent',
    description: (
        'Identifies Social Determinants of Health (SDOH) and connects patients to ' +
        'community resources. Takes FHIR patient context, screens for social risk factors, ' +
        'matches to Z-coded resources, and generates referral packets.'
    ),
    url: URL,
    version: '1.0.0',
    fhirExtensionUri: FHIR_EXTENSION,
    requireApiKey: false,  // Open for demo — restrict in production
});

app.listen(PORT, () => {
    console.info(`sdoh_bridge_agent running on port ${PORT}`);
    console.info(`Agent card: GET http://localhost:${PORT}/.well-known/agent-card.json`);
    console.info(`A2A endpoint: POST http://localhost:${PORT}/`);
});
