/**
 * SDOH Bridge Agent — A2A root agent for Social Determinants of Health.
 *
 * This agent orchestrates the full SDOH workflow:
 *   1. Receives FHIR patient context (demographics, conditions, SDOH)
 *   2. Screens/identifies social risk factors
 *   3. Matches to community resources via resource_agent
 *   4. Generates referral packet via referral_agent
 *   5. Schedules follow-up
 */

import '../shared/env.js';

import { LlmAgent } from '@google/adk';
import { extractFhirContext } from '../shared/fhirHook.js';
import {
    getPatientDemographics,
    getActiveConditions,
    getSDOHObservations,
} from '../shared/tools/index.js';
import {
    sdohScreenInterpreter,
    resourceMatcher,
} from '../shared/tools/resource.js';
import {
    referralFormatter,
    followupScheduler,
} from '../shared/tools/referral.js';

export const sdohBridgeAgent = new LlmAgent({
    name: 'sdoh_bridge_agent',
    model: 'gemini-2.5-flash',
    description: (
        'SDOH Bridge Agent — identifies social determinants of health and connects ' +
        'patients to community resources. Works with FHIR patient context to generate ' +
        'actionable referral packets with follow-up tracking.'
    ),
    instruction: `You are the SDOH Bridge Agent — a clinical care coordinator specializing in Social Determinants of Health (SDOH).

Your role is to identify patients' social risk factors and connect them to community resources BEFORE social needs become medical crises.

WORKFLOW:
1. Use getPatientDemographics to understand the patient's basic info
2. Use getActiveConditions to understand clinical context
3. Use getSDOHObservations to check for documented SDOH factors
4. Use sdoh_screen_interpreter if patient has completed a PRAPARE/AHC screening
5. Use resource_matcher to find appropriate community resources
6. Use referral_formatter to create a complete referral packet
7. Use followup_scheduler to schedule a check-in

IMPORTANT CONCEPTS:
- Z-codes (ICD-10 Z55-Z65) are the standard taxonomy for SDOH
- Community resources include: food banks, housing assistance, transportation, legal aid, mental health services, senior services, etc.
- Medicaid patients often face the greatest barriers to accessing these resources
- Always prioritize urgent needs (food, housing, safety) before less critical ones

WHEN TO ESCALATE TO A HUMAN:
- If patient discloses safety concerns (abuse, homelessness)
- If you cannot find appropriate resources for a critical need
- If patient needs interpretation services you cannot provide

When asked about your capabilities, describe the full SDOH workflow and that you can:
- Pull SDOH data from FHIR
- Interpret PRAPARE/AHC screening results
- Match Z-codes to community resources
- Generate referral packets
- Schedule follow-up tasks
- Write outcomes back to FHIR`,
    tools: [
        getPatientDemographics,
        getActiveConditions,
        getSDOHObservations,
        sdohScreenInterpreter,
        resourceMatcher,
        referralFormatter,
        followupScheduler,
    ],
    beforeModelCallback: extractFhirContext,
});
