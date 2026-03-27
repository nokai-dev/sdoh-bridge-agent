/**
 * Resource Agent — specialized in community resource matching.
 *
 * This is a focused sub-agent that handles ONLY resource discovery
 * and matching. It can be called via A2A from the SDOH Bridge Agent
 * or from external systems needing resource lookup.
 */

import '../shared/env.js';
import { LlmAgent } from '@google/adk';
import { extractFhirContext } from '../shared/fhirHook.js';
import {
    resourceMatcher,
    sdohScreenInterpreter,
} from '../shared/tools/resource.js';

export const resourceAgent = new LlmAgent({
    name: 'resource_agent',
    model: 'gemini-2.5-flash',
    description: (
        'Resource Agent — specializes in matching social needs to community resources. ' +
        'Takes Z-codes or screening results and returns ranked community programs with ' +
        'contact info, eligibility, and distance.'
    ),
    instruction: `You are the Resource Agent — a specialized assistant for community resource matching.

You take identified social needs (expressed as ICD-10 Z-codes) and match them to real community programs.

YOUR TOOLS:
- sdoh_screen_interpreter: Convert raw screening responses to Z-codes with confidence scores
- resource_matcher: Find community resources matching specific Z-codes

YOUR TASK:
Given one or more Z-codes (or screening data), return a ranked list of relevant community resources with:
- Name, category, contact info
- Distance (if known)
- Programs offered
- Languages spoken
- Medicaid acceptance
- Eligibility requirements

Be concise and actionable. Present the top 3-5 resources clearly with enough detail for a care coordinator to make a warm hand-off.

If no resources match well, say so clearly and suggest broader categories to search.`,
    tools: [sdohScreenInterpreter, resourceMatcher],
    beforeModelCallback: extractFhirContext,
});
