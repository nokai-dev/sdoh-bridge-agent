/**
 * SDOH Tools — FHIR R4 queries for Social Determinants of Health.
 *
 * These tools supplement the standard FHIR tools in fhir.ts with
 * SDOH-specific queries: Social History, Observations with SDOH codes,
 * and CarePlan for SDOH interventions.
 *
 * All tools read FHIR credentials from toolContext.state (injected by fhirHook).
 */

import { FunctionTool, ToolContext } from '@google/adk';
import { z } from 'zod';

// Reuse helpers from fhir.ts
import { getFhirCredentials } from './fhir.js';

// ── Z-code taxonomy (ICD-10 Z55-Z65) ───────────────────────────────────────

export const ZCODE_TAXONOMY: Record<string, { code: string; display: string; category: string }> = {
    Z550: { code: 'Z55.0', display: 'Illiteracy and language barriers', category: 'Education' },
    Z580: { code: 'Z58.0', display: 'Exposure to air pollution', category: 'Physical environment' },
    Z581: { code: 'Z58.1', display: 'Inadequate drinking water', category: 'Physical environment' },
    Z582: { code: 'Z58.2', display: 'Inadequate food insecurity', category: 'Food' },
    Z583: { code: 'Z58.3', display: 'Inadequate housing', category: 'Housing' },
    Z584: { code: 'Z58.4', display: 'Lack of adequate clothing', category: 'Material security' },
    Z585: { code: 'Z58.6', display: 'Inadequate food access', category: 'Food' },
    Z591: { code: 'Z59.1', display: 'Inadequate housing — inadequate housing', category: 'Housing' },
    Z592: { code: 'Z59.2', display: 'Inadequate dependent person situation', category: 'Social environment' },
    Z593: { code: 'Z59.3', display: 'Problems related to living in a residential institution', category: 'Housing' },
    Z594: { code: 'Z59.4', display: 'Inadequate social environment', category: 'Social environment' },
    Z595: { code: 'Z59.5', display: 'Extreme poverty', category: 'Economic' },
    Z596: { code: 'Z59.6', display: 'Low income', category: 'Economic' },
    Z597: { code: 'Z59.7', display: 'Insufficient social insurance and welfare support', category: 'Economic' },
    Z600: { code: 'Z60.0', display: 'Problems of adjustment to life-cycle transitions', category: 'Social environment' },
    Z601: { code: 'Z60.2', display: 'Problems related to living alone', category: 'Social environment' },
    Z603: { code: 'Z60.3', display: 'Acculturation difficulty', category: 'Social environment' },
    Z604: { code: 'Z60.4', display: 'Social exclusion and rejection', category: 'Social environment' },
    Z605: { code: 'Z60.5', display: 'Target of adverse discrimination and persecution', category: 'Social environment' },
    Z610: { code: 'Z61.0', display: 'Loss of relationship with child', category: 'Psychosocial' },
    Z611: { code: 'Z61.1', display: 'Removal from home', category: 'Psychosocial' },
    Z612: { code: 'Z61.2', display: 'Dysfunctional family patterns', category: 'Psychosocial' },
    Z615: { code: 'Z61.5', display: 'Sexual abuse', category: 'Psychosocial' },
    Z616: { code: 'Z61.6', display: 'Physical abuse', category: 'Psychosocial' },
    Z620: { code: 'Z62.0', display: 'Inadequate parental supervision', category: 'Childhood adversity' },
    Z621: { code: 'Z62.1', display: 'Parental overprotection', category: 'Childhood adversity' },
    Z623: { code: 'Z62.3', display: 'Hostility toward child', category: 'Childhood adversity' },
    Z625: { code: 'Z62.5', display: 'Inadequate family upbringing', category: 'Childhood adversity' },
    Z635: { code: 'Z63.5', display: 'Disruption of family by separation and divorce', category: 'Psychosocial' },
    Z636: { code: 'Z63.6', display: 'Dependent relative needing care at home', category: 'Psychosocial' },
    Z638: { code: 'Z63.8', display: 'Other specified problems related to primary support group', category: 'Psychosocial' },
    Z640: { code: 'Z64.0', display: 'Problems related to unwanted pregnancy', category: 'Pregnancy' },
    Z641: { code: 'Z64.1', display: 'Multiparity', category: 'Pregnancy' },
    Z642: { code: 'Z64.2', display: 'Seeking and undergoing organ transplant', category: 'Health care' },
    Z643: { code: 'Z64.3', display: 'Seeking and undergoing bariatric surgery', category: 'Health care' },
    Z644: { code: 'Z64.4', display: 'Discord with counselors', category: 'Health care' },
    Z650: { code: 'Z65.0', display: 'Inadequate legal system access', category: 'Legal' },
    Z651: { code: 'Z65.1', display: 'Inadequate imprisonment', category: 'Legal' },
    Z652: { code: 'Z65.2', display: 'Problems after war and civil unrest', category: 'Legal' },
    Z653: { code: 'Z65.3', display: 'Problems after genocide', category: 'Legal' },
    Z654: { code: 'Z65.4', display: 'Inadequate victims of crime and abuse', category: 'Legal' },
    Z655: { code: 'Z65.5', display: 'Inadequate exposure to disaster war and other hostilities', category: 'Legal' },
    Z658: { code: 'Z65.8', display: 'Other specified problems related to psychosocial circumstances', category: 'Psychosocial' },
};

// ── Tool: getSocialHistory ─────────────────────────────────────────────────────

export const getSocialHistory = new FunctionTool({
    name: 'getSocialHistory',
    description: 'Fetches the social history observations for the current patient from FHIR. Includes tobacco use, alcohol use, occupation, and living situation. No arguments required.',
    parameters: z.object({}),
    execute: async (_input: unknown, toolContext?: ToolContext) => {
        if (!toolContext) return { status: 'error', error_message: 'Tool context missing' };
        const creds = getFhirCredentials(toolContext);
        if (!creds) return { status: 'error', error_message: 'FHIR context not available' };

        console.info(`tool_get_social_history patientId=${creds.patientId}`);

        try {
            const url = new URL(`${creds.fhirUrl}/Observation`);
            url.searchParams.set('patient', creds.patientId);
            url.searchParams.set('category', 'social-history');
            url.searchParams.set('_count', '20');

            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${creds.fhirToken}`, Accept: 'application/fhir+json' },
            });

            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`FHIR HTTP ${response.status}: ${body.slice(0, 200)}`);
            }

            const bundle = await response.json() as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];

            const history = entries.map((entry: Record<string, unknown>) => {
                const resource = entry['resource'] as Record<string, unknown>;
                const code = (resource['code'] as Record<string, unknown>) ?? {};
                const coding = ((code['coding'] as Array<Record<string, unknown>>) ?? [])[0] ?? {};
                const value = resource['valueString'] ?? resource['valueQuantity'] ?? 'Not recorded';
                return {
                    code: coding['code'] ?? 'unknown',
                    display: coding['display'] ?? 'Unknown',
                    value: typeof value === 'object' ? (value as Record<string, unknown>)['display'] ?? value : value,
                    date: resource['effectiveDateTime'] ?? null,
                };
            });

            return { status: 'success', socialHistory: history };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`tool_get_social_history error=${msg}`);
            return { status: 'error', error_message: msg };
        }
    },
});

// ── Tool: getSDOHObservations ────────────────────────────────────────────────

export const getSDOHObservations = new FunctionTool({
    name: 'getSDOHObservations',
    description: 'Fetches SDOH (Social Determinants of Health) observations for the current patient. Includes food insecurity, housing instability, transportation barriers, and financial strain. No arguments required.',
    parameters: z.object({}),
    execute: async (_input: unknown, toolContext?: ToolContext) => {
        if (!toolContext) return { status: 'error', error_message: 'Tool context missing' };
        const creds = getFhirCredentials(toolContext);
        if (!creds) return { status: 'error', error_message: 'FHIR context not available' };

        console.info(`tool_get_sdoh_observations patientId=${creds.patientId}`);

        try {
            const url = new URL(`${creds.fhirUrl}/Observation`);
            url.searchParams.set('patient', creds.patientId);
            url.searchParams.set('category', 'sdoh');
            url.searchParams.set('_count', '50');

            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${creds.fhirToken}`, Accept: 'application/fhir+json' },
            });

            if (!response.ok) {
                // Try without sdoh category — some servers use different categorization
                const fallbackUrl = new URL(`${creds.fhirUrl}/Observation`);
                fallbackUrl.searchParams.set('patient', creds.patientId);
                fallbackUrl.searchParams.set('code', 'Z58,Z59,Z60,Z61,Z62,Z63,Z64,Z65');
                fallbackUrl.searchParams.set('_count', '50');

                const fallback = await fetch(fallbackUrl.toString(), {
                    headers: { Authorization: `Bearer ${creds.fhirToken}`, Accept: 'application/fhir+json' },
                });

                if (!fallback.ok) {
                    throw new Error(`FHIR HTTP ${response.status} and fallback ${fallback.status}`);
                }
                const bundle = await fallback.json() as Record<string, unknown>;
                const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
                return { status: 'success', sdohObservations: entries.map(extractObservation), noSdohCategory: true };
            }

            const bundle = await response.json() as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
            return { status: 'success', sdohObservations: entries.map(extractObservation) };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`tool_get_sdoh_observations error=${msg}`);
            return { status: 'error', error_message: msg };
        }
    },
});

// ── Tool: getActiveConditions ──────────────────────────────────────────────────

export const getActiveConditions = new FunctionTool({
    name: 'getActiveConditions',
    description: 'Fetches active medical conditions for the current patient. Used to understand clinical context alongside SDOH. No arguments required.',
    parameters: z.object({}),
    execute: async (_input: unknown, toolContext?: ToolContext) => {
        if (!toolContext) return { status: 'error', error_message: 'Tool context missing' };
        const creds = getFhirCredentials(toolContext);
        if (!creds) return { status: 'error', error_message: 'FHIR context not available' };

        console.info(`tool_get_active_conditions patientId=${creds.patientId}`);

        try {
            const url = new URL(`${creds.fhirUrl}/Condition`);
            url.searchParams.set('patient', creds.patientId);
            url.searchParams.set('clinical-status', 'active');
            url.searchParams.set('_count', '30');

            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${creds.fhirToken}`, Accept: 'application/fhir+json' },
            });

            if (!response.ok) throw new Error(`FHIR HTTP ${response.status}`);

            const bundle = await response.json() as Record<string, unknown>;
            const entries = (bundle['entry'] as Array<Record<string, unknown>> | undefined) ?? [];

            const conditions = entries.map((entry: Record<string, unknown>) => {
                const resource = entry['resource'] as Record<string, unknown>;
                const code = (resource['code'] as Record<string, unknown>) ?? {};
                const coding = ((code['coding'] as Array<Record<string, unknown>>) ?? [])[0] ?? {};
                return {
                    code: coding['code'] ?? 'unknown',
                    display: coding['display'] ?? 'Unknown condition',
                    clinicalStatus: resource['clinicalStatus'] ?? 'unknown',
                    recordedDate: resource['recordedDate'] ?? null,
                };
            });

            return { status: 'success', activeConditions: conditions };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`tool_get_active_conditions error=${msg}`);
            return { status: 'error', error_message: msg };
        }
    },
});

// ── Helper ───────────────────────────────────────────────────────────────────

function extractObservation(entry: Record<string, unknown>): Record<string, unknown> {
    const resource = entry['resource'] as Record<string, unknown>;
    const code = (resource['code'] as Record<string, unknown>) ?? {};
    const coding = ((code['coding'] as Array<Record<string, unknown>>) ?? [])[0] ?? {};
    const value = resource['valueString'] ?? resource['valueQuantity'] ?? resource['valueCodeableConcept'] ?? 'Not recorded';
    return {
        code: coding['code'] ?? 'unknown',
        display: coding['display'] ?? 'Unknown SDOH factor',
        value: typeof value === 'object' ? (value as Record<string, unknown>)['display'] ?? JSON.stringify(value) : value,
        date: resource['effectiveDateTime'] ?? null,
        id: resource['id'] ?? null,
    };
}
