// Consent state helpers shared by signup and the consent gate.
export const emptyConsents = { terms: false, health: false, age: false };
export const allConsentsGiven = (c) => c.terms && c.health && c.age;

// Must match CONSENT_VERSION in server/src/controllers/authController.js. Users who accepted
// an older wording are shown the consent gate again.
export const CONSENT_VERSION = "2026-09-27";

const current = (consent) => Boolean(consent?.acceptedAt) && consent?.version === CONSENT_VERSION;

export const hasRequiredConsents = (user) =>
  current(user?.consents?.terms) && current(user?.consents?.healthData);

// Accounts created before phone and country were collected at sign-up.
export const hasContactDetails = (user) => Boolean(user?.phone && user?.country);
