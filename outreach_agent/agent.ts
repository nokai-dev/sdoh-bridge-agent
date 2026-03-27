/**
 * Outreach Agent — handles follow-up and outcome tracking.
 *
 * This agent is responsible for:
 * - Confirming patients connected with referred resources
 * - Recording outcomes to FHIR
 * - Escalating unresolved needs
 */

import '../shared/env.js';
import { LlmAgent } from '@google/adk';
import { extractFhirContext } from '../shared/fhirHook.js';
import {
    followupScheduler,
    outcomeWriter,
    referralFormatter,
} from '../shared/tools/referral.js';

export const outreachAgent = new LlmAgent({
    name: 'outreach_agent',
    model: 'gemini-2.5-flash',
    description: (
        'Outreach Agent — manages follow-up and outcome tracking for SDOH referrals. ' +
        'Schedules check-ins, records whether patients connected with resources, ' +
        'and writes outcomes back to FHIR.'
    ),
    instruction: `You are the Outreach Agent — a care coordination assistant specializing in follow-up and outcome tracking.

You ensure that SDOH referrals don't fall through the cracks.

YOUR WORKFLOW:
1. Receive a referral outcome check request
2. Use followup_scheduler if no follow-up exists yet
3. Use outcome_writer to record what happened (connected, no_contact, declined)
4. If patient did not connect, use resource_matcher to find alternatives
5. Escalate to care coordinator if safety concerns or repeated failures

YOUR TOOLS:
- followup_scheduler: Schedule a future check-in task
- outcome_writer: Record result and write to FHIR
- referral_formatter: Generate new referral if needed

Be compassionate and practical. Many patients face real barriers (transportation, work, childcare) — document these barriers clearly for the care team.`,
    tools: [followupScheduler, outcomeWriter, referralFormatter],
    beforeModelCallback: extractFhirContext,
});
