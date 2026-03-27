/**
 * Synthea SDOH Mock Data Generator
 *
 * Generates realistic FHIR R4 patient records with SDOH factors for demo purposes.
 * These are SYNTHETIC patients — no real data.
 *
 * Run: npx tsx synthea/generate.ts
 * Output: synthea/patients/ directory with FHIR JSON bundles
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(import.meta.dirname, 'patients');
mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Patient 1: Maria Santos — Food Insecurity + Transportation ────────────────

const mariaSantos = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
        {
            resource: {
                resourceType: 'Patient',
                id: 'patient-maria-santos',
                name: [{ family: 'Santos', given: ['Maria', 'Elena'], use: 'official' }],
                birthDate: '1978-03-15',
                gender: 'female',
                address: [{ line: ['842 Prospect Ave'], city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' }],
                telecom: [
                    { system: 'phone', value: '(555) 234-5678', use: 'mobile' },
                    { system: 'email', value: 'maria.santos@email.com' },
                ],
                maritalStatus: { text: 'Single' },
                communication: [{ language: { text: 'Spanish', coding: [{ code: 'es', display: 'Spanish' }] }, preferredLanguage: 'Spanish' }],
            },
        },
        {
            resource: {
                resourceType: 'Condition',
                id: 'cond-maria-hypertension',
                clinicalStatus: { text: 'Active' },
                code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }] },
                recordedDate: '2023-06-12',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'Condition',
                id: 'cond-maria-diabetes-2',
                clinicalStatus: { text: 'Active' },
                code: { coding: [{ system: 'http://snomed.info/sct', code: '44054006', display: 'Type 2 Diabetes Mellitus' }] },
                recordedDate: '2023-06-12',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'MedicationRequest',
                id: 'med-maria-metformin',
                status: 'active',
                medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: 'Metformin 500mg' }] },
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'MedicationRequest',
                id: 'med-maria-lisinopril',
                status: 'active',
                medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '314076', display: 'Lisinopril 10mg' }] },
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-maria-food-insecurity',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '88191-7', display: 'Food insecurity [HHS]' }] },
                valueString: 'Food insecurity present — limited access to nutritious food due to cost',
                effectiveDateTime: '2024-11-03',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-maria-transport-barrier',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '93039-8', display: 'Transportation barrier [HHS]' }] },
                valueString: 'Transportation barrier — no personal vehicle, limited public transit access',
                effectiveDateTime: '2024-11-03',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-maria-housing',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '89205003', display: 'Housing instability [HHS]' }] },
                valueString: 'Housing unstable — moved 3 times in past year due to rent increases',
                effectiveDateTime: '2024-11-03',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-maria-social-history',
                status: 'final',
                category: [{ coding: [{ code: 'social-history', display: 'Social History' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '46499-0', display: 'Tobacco use' }] },
                valueString: 'Never smoker',
                effectiveDateTime: '2024-01-15',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-maria-employment',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '74164-5', display: 'Employment status [HHS]' }] },
                valueString: 'Part-time retail worker — hours reduced, income insufficient for food + medications',
                effectiveDateTime: '2024-11-03',
                subject: { reference: 'Patient/patient-maria-santos' },
            },
        },
        {
            resource: {
                resourceType: 'CarePlan',
                id: 'careplan-maria-sdoh',
                status: 'active',
                intent: 'plan',
                title: 'SDOH Care Plan — Maria Santos',
                description: 'Address food insecurity, transportation, and housing instability',
                subject: { reference: 'Patient/patient-maria-santos' },
                note: [{ text: 'Patient referred to Community Food Bank, Hope Housing, Transportation Assistance' }],
            },
        },
    ],
};

// ── Patient 2: James Washington — Elder Care + Isolation ─────────────────────

const jamesWashington = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
        {
            resource: {
                resourceType: 'Patient',
                id: 'patient-james-washington',
                name: [{ family: 'Washington', given: ['James', 'Harold'], use: 'official' }],
                birthDate: '1945-08-22',
                gender: 'male',
                address: [{ line: ['1290 Oak Lane Apt 4B'], city: 'Springfield', state: 'IL', postalCode: '62702', country: 'USA' }],
                telecom: [
                    { system: 'phone', value: '(555) 891-2345', use: 'home' },
                ],
                maritalStatus: { text: 'Widowed' },
                communication: [{ language: { text: 'English', coding: [{ code: 'en', display: 'English' }] }, preferredLanguage: 'English' }],
            },
        },
        {
            resource: {
                resourceType: 'Condition',
                id: 'cond-james-chf',
                clinicalStatus: { text: 'Active' },
                code: { coding: [{ system: 'http://snomed.info/sct', code: '42343007', display: 'Congestive Heart Failure' }] },
                recordedDate: '2022-03-15',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'Condition',
                id: 'cond-james-copd',
                clinicalStatus: { text: 'Active' },
                code: { coding: [{ system: 'http://snomed.info/sct', code: '13645005', display: 'COPD' }] },
                recordedDate: '2021-09-01',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'MedicationRequest',
                id: 'med-james-furosemide',
                status: 'active',
                medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '197361', display: 'Furosemide 40mg' }] },
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-james-living-alone',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '88281-5', display: 'Lives alone [HHS]' }] },
                valueString: 'Lives alone — wife passed 2 years ago, adult children live out of state',
                effectiveDateTime: '2024-10-01',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-james-fall-risk',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '64345-0', display: 'Fall risk [HHS]' }] },
                valueString: 'High fall risk — history of falls, no grab bars in home, stairs to enter',
                effectiveDateTime: '2024-10-01',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-james-meal-access',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '88191-7', display: 'Food insecurity [HHS]' }] },
                valueString: 'Limited meal access — difficulty preparing meals due to fatigue, relies on frozen meals',
                effectiveDateTime: '2024-10-01',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-james-no-caregiver',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '88485-2', display: 'Caregiver availability [HHS]' }] },
                valueString: 'No regular caregiver — needs home health aide, adult day care, or meal delivery',
                effectiveDateTime: '2024-10-01',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
        {
            resource: {
                resourceType: 'CarePlan',
                id: 'careplan-james-sdoh',
                status: 'active',
                intent: 'plan',
                title: 'SDOH Care Plan — James Washington',
                description: 'Address isolation, meal access, fall risk, caregiver support',
                subject: { reference: 'Patient/patient-james-washington' },
            },
        },
    ],
};

// ── Patient 3: Amara Okafor — New Mother + Mental Health ─────────────────────

const amaraOkafor = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
        {
            resource: {
                resourceType: 'Patient',
                id: 'patient-amara-okafor',
                name: [{ family: 'Okafor', given: ['Amara', 'Chioma'], use: 'official' }],
                birthDate: '1996-07-08',
                gender: 'female',
                address: [{ line: ['567 Pine Street Apt 2'], city: 'Springfield', state: 'IL', postalCode: '62703', country: 'USA' }],
                telecom: [
                    { system: 'phone', value: '(555) 345-6789', use: 'mobile' },
                ],
                maritalStatus: { text: 'Married' },
                communication: [{ language: { text: 'English', coding: [{ code: 'en', display: 'English' }] }, preferredLanguage: 'English' }],
            },
        },
        {
            resource: {
                resourceType: 'Condition',
                id: 'cond-amara-postpartum',
                clinicalStatus: { text: 'Active' },
                code: { coding: [{ system: 'http://snomed.info/sct', code: '102292001', display: 'Postpartum period' }] },
                recordedDate: '2024-12-15',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
        {
            resource: {
                resourceType: 'Condition',
                id: 'cond-amara-depression',
                clinicalStatus: { text: 'Active' },
                code: { coding: [{ system: 'http://snomed.info/sct', code: '36923009', display: 'Major depression, postpartum' }] },
                recordedDate: '2025-01-10',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-amara-baby-wellness',
                status: 'final',
                code: { coding: [{ system: 'http://snomed.info/sct', code: '170265001', display: 'Baby wellness check' }] },
                valueString: 'Baby healthy, developing normally, next appointment in 2 months',
                effectiveDateTime: '2025-02-01',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-amara-isolation',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '88485-2', display: 'Social isolation [HHS]' }] },
                valueString: 'Socially isolated — new to area, no family nearby, husband works long hours',
                effectiveDateTime: '2025-01-15',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-amara-internet',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '93580-8', display: 'Internet access [HHS]' }] },
                valueString: 'No reliable internet — difficulty accessing telehealth, online WIC enrollment',
                effectiveDateTime: '2025-01-15',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-amara-wic',
                status: 'final',
                category: [{ coding: [{ code: 'sdoh', display: 'Social Determinants of Health' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '74396-9', display: 'WIC status [HHS]' }] },
                valueString: 'Enrolled in WIC — receiving benefits for herself and baby',
                effectiveDateTime: '2025-01-15',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'obs-amara-phq9',
                status: 'final',
                category: [{ coding: [{ code: 'survey', display: 'Survey' }] }],
                code: { coding: [{ system: 'http://phqinfo.org', code: 'PHQ-9', display: 'PHQ-9 Depression Screen' }] },
                valueString: 'PHQ-9 Score: 14 — moderately severe depression',
                effectiveDateTime: '2025-01-15',
                subject: { reference: 'Patient/patient-amara-okafor' },
            },
        },
    ],
};

// ── Generate ─────────────────────────────────────────────────────────────────

const patients = [
    { name: 'maria-santos', bundle: mariaSantos },
    { name: 'james-washington', bundle: jamesWashington },
    { name: 'amara-okafor', bundle: amaraOkafor },
];

for (const { name, bundle } of patients) {
    const filePath = join(OUTPUT_DIR, `${name}.json`);
    writeFileSync(filePath, JSON.stringify(bundle, null, 2));
    console.info(`Generated: ${filePath}`);
}

console.info(`\nGenerated ${patients.length} synthetic SDOH patient records.`);
console.info('FHIR server should serve these at:');
console.info('  GET /fhir/Patient/patient-<name>');
console.info('  GET /fhir/Observation?patient=patient-<name>&category=sdoh');
console.info('  GET /fhir/Condition?patient=patient-<name>');
