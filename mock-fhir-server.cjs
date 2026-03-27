/**
 * Mock FHIR Server — plain JavaScript for production deployment.
 * Serves Synthea patient records as FHIR R4 resources.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PATIENTS_DIR = path.join(__dirname, 'synthea', 'patients');

// Load all patient bundles
const patients = {};
try {
    const files = fs.readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
        const bundle = JSON.parse(fs.readFileSync(path.join(PATIENTS_DIR, file), 'utf-8'));
        const entries = bundle.entry || [];
        for (const entry of entries) {
            if (entry.resource?.resourceType === 'Patient') {
                patients[entry.resource.id] = entry.resource;
            }
        }
        console.info(`Loaded: ${file} (${Object.keys(patients).length} patients)`);
    }
} catch (err) {
    console.warn('No Synthea patients found at', PATIENTS_DIR, err);
}

function sendBundle(resources) {
    return {
        resourceType: 'Bundle',
        type: 'collection',
        total: resources.length,
        entry: resources.map(r => ({ resource: r })),
    };
}

function sendJson(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, { 'Content-Type': 'application/fhir+json' });
    res.end(body);
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Health
    if (pathname === '/health') {
        sendJson(res, 200, { status: 'ok', patients: Object.keys(patients).length });
        return;
    }

    // FHIR metadata
    if (pathname === '/fhir/metadata') {
        sendJson(res, 200, {
            resourceType: 'CapabilityStatement',
            status: 'active',
            kind: 'instance',
            fhirVersion: '4.0.1',
            format: ['application/fhir+json'],
        });
        return;
    }

    // Patient by ID
    const patientMatch = pathname.match(/^\/fhir\/Patient\/([^/]+)$/);
    if (patientMatch) {
        const patient = patients[patientMatch[1]];
        if (patient) {
            sendJson(res, 200, patient);
        } else {
            sendJson(res, 404, { resourceType: 'OperationOutcome', issue: [{ severity: 'error', diagnostics: `Patient not found` }] });
        }
        return;
    }

    // Patient search
    if (pathname === '/fhir/Patient') {
        let results = Object.values(patients);
        const name = query.name;
        if (name) {
            results = results.filter(p => {
                const fullName = p.name?.[0]?.text || '';
                return fullName.toLowerCase().includes(name.toLowerCase());
            });
        }
        sendJson(res, 200, sendBundle(results));
        return;
    }

    // Observation search
    if (pathname === '/fhir/Observation') {
        const patientId = query.patient?.replace('Patient/', '') || '';
        const observations = [];
        try {
            const files = fs.readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const bundle = JSON.parse(fs.readFileSync(path.join(PATIENTS_DIR, file), 'utf-8'));
                for (const entry of bundle.entry || []) {
                    if (entry.resource?.resourceType !== 'Observation') continue;
                    const subjectId = entry.resource.subject?.reference?.replace('Patient/', '') || '';
                    if (patientId && subjectId !== patientId) continue;
                    observations.push(entry.resource);
                }
            }
        } catch (err) { /* ignore */ }
        sendJson(res, 200, sendBundle(observations));
        return;
    }

    // Default: 404
    sendJson(res, 404, { resourceType: 'OperationOutcome', issue: [{ severity: 'error', diagnostics: 'Not found' }] });
});

const PORT = Number(process.env['PORT'] ?? 8080);
server.listen(PORT, () => {
    console.info(`Mock FHIR Server running on port ${PORT}`);
    console.info(`Patients: ${Object.keys(patients).join(', ')}`);
});
