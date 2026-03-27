/**
 * A2A Reverse Proxy — compiled to JS for production deployment.
 *
 * Serves agent cards directly + routes A2A messages.
 */

import express from 'express';

const AGENT_ROUTES = {
    sdoh_bridge: 3001,
    resource: 3002,
    referral: 3003,
    outreach: 3004,
};

const app = express();
app.use(express.json({ limit: '10mb' }));

// Serve agent card directly (no redirect)
app.get('/:agent/.well-known/agent-card.json', async (req, res) => {
    const agentKey = req.params.agent.toLowerCase();
    const targetPort = AGENT_ROUTES[agentKey];

    if (!targetPort) {
        res.status(404).json({ error: `Unknown agent: ${agentKey}` });
        return;
    }

    try {
        const response = await fetch(`http://localhost:${targetPort}/.well-known/agent-card.json`);
        const text = await response.text();
        res.type('json').status(response.status).send(text);
    } catch (err) {
        console.error(`Proxy error for ${agentKey}:`, err);
        res.status(502).json({ error: `Failed to reach agent ${agentKey}` });
    }
});

// Proxy A2A requests
app.all('/:agent/', async (req, res) => {
    const agentKey = req.params.agent.toLowerCase();
    const targetPort = AGENT_ROUTES[agentKey];

    if (!targetPort) {
        res.status(404).json({ error: `Unknown agent: ${agentKey}` });
        return;
    }

    const url = `http://localhost:${targetPort}/`;
    try {
        const headers = { 'Content-Type': 'application/json' };
        const apiKey = req.headers['x-api-key'];
        if (apiKey) headers['X-API-Key'] = apiKey;

        const response = await fetch(url, {
            method: req.method,
            headers,
            body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
        });

        const text = await response.text();
        res.type('json').status(response.status).send(text);
    } catch (err) {
        console.error(`Proxy error for ${agentKey}:`, err);
        res.status(502).json({ error: `Failed to reach agent ${agentKey}` });
    }
});

const PORT = Number(process.env['PORT'] ?? 3000);
app.listen(PORT, () => {
    console.log(`A2A Reverse Proxy running on port ${PORT}`);
});
