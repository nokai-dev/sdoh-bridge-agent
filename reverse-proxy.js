/**
 * A2A Reverse Proxy — plain JavaScript for production deployment.
 *
 * Serves agent cards directly + routes A2A messages.
 */

const http = require('http');
const fs = require('fs');

const AGENT_ROUTES = {
    sdoh_bridge: 3001,
    resource: 3002,
    referral: 3003,
    outreach: 3004,
};

function parseJson(body) {
    try { return JSON.parse(body); }
    catch { return null; }
}

async function proxyRequest(port, req, res) {
    const options = {
        hostname: 'localhost',
        port,
        path: req.url,
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': req.headers['x-api-key'] || '',
        },
    };

    return new Promise((resolve) => {
        const proxyReq = http.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
                resolve();
            });
        });
        proxyReq.on('error', (err) => {
            res.writeHead(502);
            res.end(JSON.stringify({ error: `Failed to reach agent` }));
            resolve();
        });

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            if (body) proxyReq.write(body);
            proxyReq.end();
        });
    });
}

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // Health check
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', agents: Object.keys(AGENT_ROUTES) }));
        return;
    }

    // Agent card or A2A message
    const match = url.pathname.match(/^\/([^/]+)\//);
    if (!match) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    const agentKey = match[1].toLowerCase();
    const port = AGENT_ROUTES[agentKey];

    if (!port) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: `Unknown agent: ${agentKey}` }));
        return;
    }

    await proxyRequest(port, req, res);
});

const PORT = Number(process.env['PORT'] ?? 3000);
server.listen(PORT, () => {
    console.log(`A2A Reverse Proxy running on port ${PORT}`);
    console.log('Routes:', Object.entries(AGENT_ROUTES).map(([k, v]) => `/${k}/ → localhost:${v}/`).join(', '));
});
