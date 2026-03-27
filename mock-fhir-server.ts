/**
 * Simple Mock FHIR R4 Server
 *
 * Serves Synthea-generated patient records as FHIR R4 resources.
 * No authentication required — for demo purposes only.
 *
 * Run: npx tsx mock-fhir-server.ts
 * Then: GET http://localhost:8080/fhir/Patient/patient-maria-santos
 */

import express from 'express';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATIENTS_DIR = join(__dirname, 'synthea', 'patients');

const app = express();
app.use(express.json());

// Load all patient bundles into memory
const patients: Record<string, Record<string, unknown>> = {};
try {
    const files = readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
        const bundle = JSON.parse(readFileSync(join(PATIENTS_DIR, file), 'utf-8')) as Record<string, unknown>;
        const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
        for (const entry of entries) {
            const resource = entry['resource'] as Record<string, unknown>;
            if (resource?.['resourceType'] === 'Patient') {
                const id = resource['id'] as string;
                patients[id] = resource;
            }
        }
        console.info(`Loaded patient bundle: ${file} (${Object.keys(patients).length} patients total)`);
    }
} catch (err) {
    console.warn('No Synthea patients found at', PATIENTS_DIR, err);
}

// Helper: send FHIR Bundle response
function sendBundle(resources: Record<string, unknown>[], total: number) {
    return {
        resourceType: 'Bundle',
        type: 'collection',
        total,
        entry: resources.map(r => ({ resource: r })),
    };
}

// ── Patient endpoints ─────────────────────────────────────────────────────────

// GET /fhir/Patient/:id
app.get('/fhir/Patient/:id', (req, res) => {
    const patient = patients[req.params['id']];
    if (!patient) {
        res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', diagnostics: `Patient ${req.params['id']} not found` }] });
        return;
    }
    res.json(patient);
});

// GET /fhir/Patient (search)
app.get('/fhir/Patient', (req, res) => {
    const name = (req.query['name'] as string | undefined)?.toLowerCase();
    let results = Object.values(patients);
    if (name) {
        results = results.filter(p => {
            const fullName = ((p['name'] as Array<Record<string, unknown>>)?.[0] ?? {})['text'] as string ?? '';
            return fullName.toLowerCase().includes(name);
        });
    }
    res.json(sendBundle(results, results.length));
});

// ── Observation endpoints ─────────────────────────────────────────────────────

// GET /fhir/Observation?patient=:id&category=sdoh
app.get('/fhir/Observation', (req, res) => {
    const patientRef = req.query['patient'] as string | undefined;
    const category = req.query['category'] as string | undefined;
    const code = req.query['code'] as string | undefined;

    const patientId = patientRef?.replace('Patient/', '') ?? '';

    // Load all observations for this patient from all bundles
    const observations: Record<string, unknown>[] = [];
    try {
        const files = readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const bundle = JSON.parse(readFileSync(join(PATIENTS_DIR, file), 'utf-8')) as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
            for (const entry of entries) {
                const resource = entry['resource'] as Record<string, unknown>;
                if (resource?.['resourceType'] !== 'Observation') continue;
                const subject = resource['subject'] as Record<string, unknown> | undefined;
                const subjectId = (subject?.['reference'] as string | undefined)?.replace('Patient/', '') ?? '';
                if (patientId && subjectId !== patientId) continue;

                // Filter by category
                if (category) {
                    const cats = (resource['category'] as Array<Record<string, unknown>> | undefined) ?? [];
                    const catCodes = cats.flatMap(c => (c['coding'] as Array<Record<string, unknown>> | undefined) ?? []).map(c => c['code']);
                    if (!catCodes.includes(category)) continue;
                }

                // Filter by code (Z-code)
                if (code) {
                    const obsCode = (resource['code'] as Record<string, unknown>) ?? {};
                    const coding = ((obsCode['coding'] as Array<Record<string, unknown>> | undefined) ?? [])[0] ?? {};
                    const obsCodeStr = coding['code'] as string ?? '';
                    if (!obsCodeStr.includes(code)) continue;
                }

                observations.push(resource);
            }
        }
    } catch (err) {
        console.warn('Error loading observations:', err);
    }

    res.json(sendBundle(observations, observations.length));
});

// ── Condition endpoints ───────────────────────────────────────────────────────

// GET /fhir/Condition?patient=:id
app.get('/fhir/Condition', (req, res) => {
    const patientRef = req.query['patient'] as string | undefined;
    const patientId = patientRef?.replace('Patient/', '') ?? '';

    const conditions: Record<string, unknown>[] = [];
    try {
        const files = readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const bundle = JSON.parse(readFileSync(join(PATIENTS_DIR, file), 'utf-8')) as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
            for (const entry of entries) {
                const resource = entry['resource'] as Record<string, unknown>;
                if (resource?.['resourceType'] !== 'Condition') continue;
                const subject = resource['subject'] as Record<string, unknown> | undefined;
                const subjectId = (subject?.['reference'] as string | undefined)?.replace('Patient/', '') ?? '';
                if (patientId && subjectId !== patientId) continue;
                conditions.push(resource);
            }
        }
    } catch (err) {
        console.warn('Error loading conditions:', err);
    }

    res.json(sendBundle(conditions, conditions.length));
});

// ── CarePlan endpoints ───────────────────────────────────────────────────────

app.get('/fhir/CarePlan', (req, res) => {
    const patientRef = req.query['patient'] as string | undefined;
    const patientId = patientRef?.replace('Patient/', '') ?? '';

    const plans: Record<string, unknown>[] = [];
    try {
        const files = readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const bundle = JSON.parse(readFileSync(join(PATIENTS_DIR, file), 'utf-8')) as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
            for (const entry of entries) {
                const resource = entry['resource'] as Record<string, unknown>;
                if (resource?.['resourceType'] !== 'CarePlan') continue;
                const subject = resource['subject'] as Record<string, unknown> | undefined;
                const subjectId = (subject?.['reference'] as string | undefined)?.replace('Patient/', '') ?? '';
                if (patientId && subjectId !== patientId) continue;
                plans.push(resource);
            }
        }
    } catch (err) {
        console.warn('Error loading careplans:', err);
    }

    res.json(sendBundle(plans, plans.length));
});

// ── MedicationRequest endpoints ──────────────────────────────────────────────

app.get('/fhir/MedicationRequest', (req, res) => {
    const patientRef = req.query['patient'] as string | undefined;
    const patientId = patientRef?.replace('Patient/', '') ?? '';

    const meds: Record<string, unknown>[] = [];
    try {
        const files = readdirSync(PATIENTS_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const bundle = JSON.parse(readFileSync(join(PATIENTS_DIR, file), 'utf-8')) as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
            for (const entry of entries) {
                const resource = entry['resource'] as Record<string, unknown>;
                if (resource?.['resourceType'] !== 'MedicationRequest') continue;
                const subject = resource['subject'] as Record<string, unknown> | undefined;
                const subjectId = (subject?.['reference'] as string | undefined)?.replace('Patient/', '') ?? '';
                if (patientId && subjectId !== patientId) continue;
                meds.push(resource);
            }
        }
    } catch (err) {
        console.warn('Error loading medications:', err);
    }

    res.json(sendBundle(meds, meds.length));
});

// ── Metadata ─────────────────────────────────────────────────────────────────

app.get('/fhir/metadata', (req, res) => {
    res.json({
        resourceType: 'CapabilityStatement',
        status: 'active',
        kind: 'instance',
        fhirVersion: '4.0.1',
        format: ['application/fhir+json'],
        rest: [{
            mode: 'server',
            resource: [
                { type: 'Patient', interaction: [{ code: 'read' }, { code: 'search-type' }] },
                { type: 'Observation', interaction: [{ code: 'read' }, { code: 'search-type' }] },
                { type: 'Condition', interaction: [{ code: 'read' }, { code: 'search-type' }] },
                { type: 'CarePlan', interaction: [{ code: 'read' }, { code: 'search-type' }] },
                { type: 'MedicationRequest', interaction: [{ code: 'read' }, { code: 'search-type' }] },
            ],
        }],
    });
});

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
    res.json({ status: 'ok', patients: Object.keys(patients).length });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env['PORT'] ?? 8080);
app.listen(PORT, () => {
    console.info(`Mock FHIR Server running on port ${PORT}`);
    console.info(`Patients loaded: ${Object.keys(patients).join(', ')}`);
    console.info('');
    console.info('Endpoints:');
    console.info('  GET /fhir/Patient/:id');
    console.info('  GET /fhir/Patient?name=...');
    console.info('  GET /fhir/Observation?patient=:id&category=sdoh');
    console.info('  GET /fhir/Condition?patient=:id');
    console.info('  GET /fhir/CarePlan?patient=:id');
    console.info('  GET /fhir/metadata');
    console.info('  GET /health');
});
