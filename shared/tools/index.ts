/**
 * Shared tools barrel — re-exports all shared tools so agents can import
 * from a single location.
 */

export {
    getPatientDemographics,
    getActiveMedications,
    getActiveConditions,
    getRecentObservations,
    getCarePlans,
    getCareTeam,
    getGoals,
} from './fhir.js';

export {
    getSocialHistory,
    getSDOHObservations,
    ZCODE_TAXONOMY,
} from './sdoh_index.js';

export {
    sdohScreenInterpreter,
    resourceMatcher,
} from './resource.js';

export {
    referralFormatter,
    followupScheduler,
    outcomeWriter,
} from './referral.js';
