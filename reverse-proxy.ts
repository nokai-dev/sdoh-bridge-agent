/**
 * Simple A2A Reverse Proxy
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

app.use(express.json());

// Proxy all A2A requests to the appropriate agent
app.all('/:agent/', async (req, res) => {
    const agentKey = req.params.agent.toLowerCase();
    const targetPort = AGENT_ROUTES[agentKey];

    if (!targetPort) {
        res.status(404).json({ error: `Unknown agent: ${agentKey}` });
        return;
    }

    const url = `http://localhost:${targetPort}/`;
    try {
        const response = await fetch(url, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': req.headers['x-api-key'] as string ?? '',
                ...Object.fromEntries(
                    Object.entries(req.headers)
                        .filter(([k]) => k.startsWith('x-') || k === 'authorization')
                ),
            },
            body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
        });

        const text = await response.text();
        res.status(response.status).type('json').send(text);
    } catch (err) {
        console.error(`Proxy error for ${agentKey}:`, err);
        res.status(502).json({ error: `Failed to reach agent ${agentKey}` });
    }
});

// Agent card requests — redirect to correct agent
app.get('/:agent/.well-known/agent-card.json', (req, res) => {
    const agentKey = req.params.agent.toLowerCase();
    const targetPort = AGENT_ROUTES[agentKey];

    if (!targetPort) {
        res.status(404).json({ error: `Unknown agent: ${agentKey}` });
        return;
    }

    res.redirect(`http://localhost:${targetPort}/.well-known/agent-card.json`);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`A2A Reverse Proxy running on port ${PORT}`);
    console.log('Routes:');
    for (const [name, port] of Object.entries(AGENT_ROUTES)) {
        console.log(`  /${name}/ → localhost:${port}/`);
    }
});
