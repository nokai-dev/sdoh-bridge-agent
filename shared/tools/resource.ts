/**
 * SDOH Resource Tools — match social needs to community resources.
 *
 * These tools do NOT require FHIR credentials — they work with the
 * community resource database (mocked for demo, real via 211/Aunt Bertha API).
 */

import { FunctionTool, ToolContext } from '@google/adk';
import { z } from 'zod';

// ── Z-code → Resource category mapping ───────────────────────────────────────

const ZCODE_RESOURCE_MAP: Record<string, string[]> = {
    'Z582': ['food_bank', 'food_pantry', 'snap'],
    'Z585': ['food_bank', 'food_pantry', 'food_delivery'],
    'Z591': ['housing_shelter', 'housing_rental_assist', 'utility_assist'],
    'Z592': ['housing_shelter', 'home_health_aid'],
    'Z593': ['housing_shelter', 'housing_nursing_home'],
    'Z594': ['social_support', 'community_health_worker'],
    'Z595': ['financial_assist', 'snap', 'medicaid'],
    'Z596': ['financial_assist', 'snap', 'medicaid', 'medicare'],
    'Z597': ['financial_assist', 'medicaid', 'utility_assist'],
    'Z600': ['social_support', 'mental_health'],
    'Z602': ['social_support', 'senior_services'],
    'Z603': ['social_support', 'legal_aid', 'translation'],
    'Z604': ['social_support', 'mental_health', 'community_health_worker'],
    'Z605': ['social_support', 'legal_aid'],
    'Z610': ['mental_health', 'social_support', 'child_services'],
    'Z611': ['housing_shelter', 'child_services', 'financial_assist'],
    'Z612': ['mental_health', 'social_support', 'family_services'],
    'Z615': ['mental_health', 'social_support', 'legal_aid'],
    'Z616': ['mental_health', 'social_support', 'legal_aid'],
    'Z620': ['child_services', 'social_support', 'community_health_worker'],
    'Z621': ['child_services', 'social_support'],
    'Z623': ['mental_health', 'social_support', 'child_services'],
    'Z625': ['mental_health', 'social_support', 'child_services'],
    'Z635': ['social_support', 'legal_aid', 'family_services'],
    'Z636': ['home_health_aid', 'social_support', 'senior_services'],
    'Z638': ['social_support', 'community_health_worker'],
    'Z640': ['wic', 'prenatal_care', 'medicaid'],
    'Z641': ['wic', 'prenatal_care', 'medicaid'],
    'Z644': ['social_support', 'mental_health', 'community_health_worker'],
    'Z650': ['legal_aid'],
    'Z651': ['legal_aid', 'social_support', 'housing_shelter'],
    'Z658': ['social_support', 'mental_health', 'community_health_worker'],
};

// ── Mock community resource database ──────────────────────────────────────────

interface CommunityResource {
    id: string;
    name: string;
    category: string;
    address: string;
    phone: string;
    website?: string;
    programs: string[];
    languages: string[];
    acceptsMedicaid: boolean;
    distance?: string;
    eligibility: string;
}

const MOCK_RESOURCES: CommunityResource[] = [
    {
        id: 'cr-001',
        name: 'Community Food Bank',
        category: 'food_bank',
        address: '123 Main St, Springfield',
        phone: '(555) 123-4567',
        website: 'https://communityfoodbank.org',
        programs: ['Emergency Food Box', 'Food Pantry', 'SNAP Enrollment'],
        languages: ['English', 'Spanish', 'Vietnamese'],
        acceptsMedicaid: true,
        distance: '0.3 miles',
        eligibility: 'Income-based, no documentation required',
    },
    {
        id: 'cr-002',
        name: 'Hope Housing Assistance',
        category: 'housing_rental_assist',
        address: '456 Oak Ave, Springfield',
        phone: '(555) 234-5678',
        website: 'https://hopehousing.org',
        programs: ['Rental Assistance', 'Emergency Shelter', 'Move-in Assistance'],
        languages: ['English', 'Spanish'],
        acceptsMedicaid: true,
        distance: '1.2 miles',
        eligibility: 'Must be currently homeless or at risk of homelessness',
    },
    {
        id: 'cr-003',
        name: 'Medication Assistance Program',
        category: 'medication_assist',
        address: '789 Pine Rd, Springfield',
        phone: '(555) 345-6789',
        website: 'https://medassist.org',
        programs: ['Insulin Assistance', 'Chronic Disease Medication Support', 'Mail-order Pharmacy'],
        languages: ['English', 'Spanish', 'Mandarin'],
        acceptsMedicaid: true,
        distance: '2.1 miles',
        eligibility: 'Uninsured or underinsured, income-based',
    },
    {
        id: 'cr-004',
        name: '211 United Way Helpline',
        category: 'information_referral',
        address: 'Statewide (phone/video)',
        phone: '2-1-1',
        website: 'https://211.org',
        programs: ['24/7 Information & Referral', 'Crisis Counseling', 'Transport Assistance'],
        languages: ['English', 'Spanish', '170+ languages via interpreter'],
        acceptsMedicaid: true,
        distance: 'Phone/video only',
        eligibility: 'Anyone, regardless of income',
    },
    {
        id: 'cr-005',
        name: 'Community Health Center',
        category: 'healthcare',
        address: '321 Elm Blvd, Springfield',
        phone: '(555) 456-7890',
        website: 'https://chc.org',
        programs: ['Primary Care', 'Dental', 'Behavioral Health', 'WIC'],
        languages: ['English', 'Spanish', 'Arabic', 'Somali'],
        acceptsMedicaid: true,
        distance: '0.7 miles',
        eligibility: 'Sliding scale fees, open to all',
    },
    {
        id: 'cr-006',
        name: 'Transportation Assistance Program',
        category: 'transport',
        address: '654 Maple Dr, Springfield',
        phone: '(555) 567-8901',
        website: 'https://transportassist.org',
        programs: ['Medical Appointment Transport', 'Bus Passes', 'Rideshare Vouchers'],
        languages: ['English', 'Spanish'],
        acceptsMedicaid: true,
        distance: '1.8 miles',
        eligibility: 'Must have medical appointment, income-based',
    },
    {
        id: 'cr-007',
        name: 'Legal Aid Society',
        category: 'legal_aid',
        address: '987 Cedar Ln, Springfield',
        phone: '(555) 678-9012',
        website: 'https://legalaid.org',
        programs: ['Housing Disputes', 'Benefits Appeals', 'Immigration', 'Family Law'],
        languages: ['English', 'Spanish', 'Mandarin'],
        acceptsMedicaid: true,
        distance: '2.5 miles',
        eligibility: 'Income-based, civil matters only',
    },
    {
        id: 'cr-008',
        name: 'Senior & Disabled Services',
        category: 'senior_services',
        address: '147 Birch St, Springfield',
        phone: '(555) 789-0123',
        website: 'https://seniorservices.org',
        programs: ['Home Delivered Meals', 'Personal Care Aides', 'Home Repair', 'Utility Assistance'],
        languages: ['English', 'Spanish'],
        acceptsMedicaid: true,
        distance: '3.2 miles',
        eligibility: 'Age 60+ or disabled, income-based',
    },
];

// ── Tool: sdoh_screen_interpreter ────────────────────────────────────────────

const ScreeningInputSchema = z.object({
    // PRAPARE-style screening responses
    problems: z.array(z.object({
        domain: z.string().describe('SDOH domain: food, housing, transportation, utilities, employment, childcare, education, relationships, mental_health, safety'),
        response: z.string().describe('Patient response in their own words'),
        severity: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
    })).describe('Array of SDOH screening responses'),
});

export const sdohScreenInterpreter = new FunctionTool({
    name: 'sdoh_screen_interpreter',
    description: 'Interprets SDOH screening results (PRAPARE or AHC format) and maps them to ICD-10 Z-codes. Returns prioritized Z-codes with confidence scores. Use this when a patient has completed an SDOH screening.',
    parameters: ScreeningInputSchema,
    execute: async (input: unknown, _toolContext?: ToolContext) => {
        const { problems } = ScreeningInputSchema.parse(input);

        console.info(`tool_sdoh_screen_interpreter domains=${problems.map(p => p.domain).join(',')}`);

        const ZCODE_KEYWORDS: Record<string, string[]> = {
            food: ['Z582', 'Z585', 'Z596'],
            housing: ['Z591', 'Z592', 'Z593', 'Z594'],
            transportation: ['Z596', 'Z597'],
            utilities: ['Z597'],
            employment: ['Z595', 'Z596', 'Z597'],
            childcare: ['Z620', 'Z621', 'Z623', 'Z625'],
            education: ['Z550'],
            relationships: ['Z610', 'Z611', 'Z612', 'Z635', 'Z636', 'Z638'],
            mental_health: ['Z615', 'Z616', 'Z620', 'Z621', 'Z623', 'Z625', 'Z644', 'Z658'],
            safety: ['Z615', 'Z616', 'Z650', 'Z651', 'Z654'],
        };

        const severityMultiplier: Record<string, number> = {
            severe: 0.98,
            moderate: 0.85,
            mild: 0.65,
            none: 0.1,
        };

        const zcodeScores: Record<string, { score: number; evidence: string[] }> = {};

        for (const problem of problems) {
            const candidateCodes = ZCODE_KEYWORDS[problem.domain] ?? [];
            const mult = severityMultiplier[problem.severity ?? 'moderate'];

            for (const code of candidateCodes) {
                if (!zcodeScores[code]) zcodeScores[code] = { score: 0, evidence: [] };
                zcodeScores[code].score += mult;
                zcodeScores[code].evidence.push(`"${problem.response}" (${problem.domain}, ${problem.severity ?? 'moderate'})`);
            }
        }

        // Sort by score, normalize to 0-1, attach Z-code metadata
        const ranked = Object.entries(zcodeScores)
            .sort(([, a], [, b]) => b.score - a.score)
            .slice(0, 8)
            .map(([code, data]) => {
                const maxPossible = problems.length * 0.98;
                const normalizedScore = Math.round((data.score / maxPossible) * 100) / 100;
                const zcodeInfo = MOCK_RESOURCES.length > 0 ? { code, display: code, category: 'SDOH' } : null;
                return {
                    code,
                    confidence: normalizedScore,
                    evidence: data.evidence,
                    category: getZCodeCategory(code),
                };
            });

        return {
            status: 'success',
            zcodes: ranked,
            summary: `Identified ${ranked.length} SDOH factors, ranked by confidence. Top: ${ranked[0]?.code} (${ranked[0]?.confidence} confidence)`,
        };
    },
});

// ── Tool: resource_matcher ────────────────────────────────────────────────────

const ResourceMatcherInputSchema = z.object({
    zcodes: z.array(z.object({
        code: z.string().describe('ICD-10 Z-code'),
        confidence: z.number().describe('Confidence score 0-1'),
    })).describe('Array of Z-codes with confidence scores'),
    patientCity: z.string().optional().describe('Patient city for distance sorting'),
    acceptsMedicaid: z.boolean().optional().default(true).describe('Filter for Medicaid-accepting resources'),
});

export const resourceMatcher = new FunctionTool({
    name: 'resource_matcher',
    description: 'Matches identified Z-codes to community resources. Returns ranked list of relevant programs with contact info, eligibility, and languages. Filters by Medicaid acceptance and distance.',
    parameters: ResourceMatcherInputSchema,
    execute: async (input: unknown, _toolContext?: ToolContext) => {
        const { zcodes, acceptsMedicaid = true } = ResourceMatcherInputSchema.parse(input);

        console.info(`tool_resource_matcher zcodes=${zcodes.map(z => z.code).join(',')} medicaid=${acceptsMedicaid}`);

        // Collect all relevant resource categories
        const relevantCategories = new Set<string>();
        for (const zcode of zcodes) {
            const cats = ZCODE_RESOURCE_MAP[zcode.code] ?? [];
            cats.forEach(c => relevantCategories.add(c));
        }

        // Find matching resources
        const matched: Array<CommunityResource & { matchedZcodes: string[]; matchScore: number }> = [];

        for (const resource of MOCK_RESOURCES) {
            if (!relevantCategories.has(resource.category)) continue;
            if (acceptsMedicaid && !resource.acceptsMedicaid) continue;

            const matchedZcodes = zcodes.filter(z => {
                const cats = ZCODE_RESOURCE_MAP[z.code] ?? [];
                return cats.includes(resource.category);
            });

            const matchScore = matchedZcodes.reduce((sum, z) => sum + z.confidence, 0) / Math.max(matchedZcodes.length, 1);

            matched.push({ ...resource, matchedZcodes: matchedZcodes.map(z => z.code), matchScore });
        }

        // Sort by match score
        matched.sort((a, b) => b.matchScore - a.matchScore);

        const top = matched.slice(0, 5).map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            distance: r.distance ?? 'Unknown',
            phone: r.phone,
            website: r.website,
            programs: r.programs,
            languages: r.languages,
            eligibility: r.eligibility,
            matchedZcodes: r.matchedZcodes,
            matchScore: Math.round(r.matchScore * 100) / 100,
        }));

        return {
            status: 'success',
            resources: top,
            totalMatched: matched.length,
            summary: `Found ${matched.length} resources matching the patient's SDOH needs. Top ${Math.min(5, top.length)} shown.`,
        };
    },
});

// ── Helper ───────────────────────────────────────────────────────────────────

function getZCodeCategory(code: string): string {
    const mapping: Record<string, string> = {
        Z55: 'Education/Literacy', Z58: 'Physical Environment', Z59: 'Housing/Economic',
        Z60: 'Social Environment', Z61: 'Childhood Adversity', Z62: 'Childhood Adversity',
        Z63: 'Psychosocial/Support', Z64: 'Pregnancy/Healthcare', Z65: 'Legal/Social',
    };
    const prefix = code.slice(0, 3);
    return mapping[prefix] ?? 'Social Determinants';
}
