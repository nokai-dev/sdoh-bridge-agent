/**
 * Simple A2A Reverse Proxy — serves agent cards directly + routes A2A messages.
 *
 * Maps agent names to local ports.
 * Prompt Opinion calls: POST /<agent-name>/
 * Proxy forwards to: localhost:<agent-port>/
 */

import express from 'express';

const AGENT_ROUTES: Record<string, number> = {
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
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Forward API key
        const apiKey = req.headers['x-api-key'];
        if (apiKey) headers['X-API-Key'] = apiKey as string;

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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', agents: Object.keys(AGENT_ROUTES) });
});

const PORT = Number(process.env['PORT'] ?? 3000);
app.listen(PORT, () => {
    console.log(`A2A Reverse Proxy running on port ${PORT}`);
    console.log('Routes:');
    for (const [name, port] of Object.entries(AGENT_ROUTES)) {
        console.log(`  GET  /${name}/.well-known/agent-card.json → localhost:${port}/.well-known/agent-card.json`);
        console.log(`  POST /${name}/                           → localhost:${port}/`);
    }
});
