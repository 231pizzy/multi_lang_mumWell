// Keyword backstop for crisis detection. The model's risk assessment is the primary signal;
// this catches explicit statements even if the model under-rates them or the call fails.
// All languages are always checked, because people don't always write in their UI language.
// These lists should be reviewed periodically by native-speaking clinicians.
const CRISIS_PATTERNS = {
  en: [
    /\b(kill|hurt|harm)(ing)?\s+(myself|my\s*self|me)\b/i,
    /\bsuicid(e|al)\b/i,
    /\b(end|take)\s+my\s+(own\s+)?life\b/i,
    /\bwant\s+to\s+die\b/i,
    /\bbetter\s+off\s+(dead|without\s+me)\b/i,
    /\bno\s+reason\s+to\s+live\b/i,
    /\b(hurt|harm|kill)(ing)?\s+(my|the)\s+(baby|child|kids?|son|daughter)\b/i,
    /\bself[-\s]?harm\b/i,
  ],
  sv: [
    /självmord/i,
    /\bta\s+(mitt\s+liv|livet\s+av\s+mig)\b/i,
    /\bvill\s+(inte\s+leva|dö)\b/i,
    /\borkar\s+inte\s+leva\b/i,
    /\bskada\s+mig\s+själv\b/i,
    /självskad/i,
    /\bskada\s+(mitt|min)\s+(barn|bebis|bebe)\b/i,
    /\bbättre\s+(utan\s+mig|om\s+jag\s+var\s+död)\b/i,
  ],
  de: [
    /suizid|selbstmord/i,
    /\bmich\s+umbringen\b/i,
    /\bmir\s+das\s+leben\s+nehmen\b/i,
    /\b(will|möchte)\s+(nicht\s+mehr\s+leben|sterben)\b/i,
    /\bmich\s+(selbst\s+)?verletzen\b/i,
    /selbstverletz/i,
    /\b(meinem|mein)\s+(baby|kind)\s+(etwas\s+)?(antun|wehtun|weh\s+tun)\b/i,
    /\bohne\s+mich\s+besser\b/i,
  ],
  fr: [
    /suicid/i,
    /\bme\s+tuer\b/i,
    /\ben\s+finir\b/i,
    /\bmettre\s+fin\s+à\s+(mes\s+jours|ma\s+vie)\b/i,
    /\bveux\s+mourir\b/i,
    /\bplus\s+envie\s+de\s+vivre\b/i,
    /\bme\s+faire\s+du\s+mal\b/i,
    /automutil/i,
    /\bfaire\s+du\s+mal\s+à\s+(mon|ma)\s+(bébé|enfant|fils|fille)\b/i,
    /\bmieux\s+sans\s+moi\b/i,
  ],
  es: [
    /suicid/i,
    /\bmatarme\b/i,
    /\bquitarme\s+la\s+vida\b/i,
    /\bquiero\s+morir(me)?\b/i,
    /\bno\s+quiero\s+vivir\b/i,
    /\bacabar\s+con\s+(mi\s+vida|todo)\b/i,
    /\bhacerme\s+daño\b/i,
    /autolesi/i,
    /\bhacer(le)?\s+daño\s+a\s+mi\s+(bebé|hijo|hija|niño|niña)\b/i,
    /\bmejor\s+sin\s+mí\b/i,
  ],
};

const ALL_PATTERNS = Object.values(CRISIS_PATTERNS).flat();

export const CRISIS_RISK_THRESHOLD = 7; // on the 0–10 scale used by the therapist prompt

/** The crisis phrases found in `text` (lower-cased, de-duplicated), e.g. ["want to die"]. */
export function crisisMatches(text) {
  const value = String(text ?? "");
  const found = new Set();
  for (const pattern of ALL_PATTERNS) {
    const match = value.match(pattern);
    if (match) found.add(match[0].toLowerCase());
  }
  return [...found];
}

export function mentionsCrisis(text) {
  return crisisMatches(text).length > 0;
}

export const CRISIS_GUIDANCE = `SAFETY PROTOCOL (highest priority):
If the mother mentions suicide, self-harm, wanting to die, harming her baby, or seems to be in immediate danger:
- Respond with warmth and without judgement; thank her for telling you.
- Clearly encourage her to call her local emergency number (for example 112 in Europe, 911 in North America, 999 in the UK, 000 in Australia) or a crisis line right now, and to reach out to someone she trusts nearby.
- Mention that postpartum depression is treatable and that she deserves immediate support.
- Do not attempt to handle the crisis alone, and never minimise what she said.
If she describes confusion, hallucinations, paranoia or sudden severe changes in the weeks after birth, tell her this can be postpartum psychosis, a medical emergency, and that she should call her local emergency number now.`;

/**
 * How the AI may ask for contact details once a crisis is apparent. Gentle, asked once,
 * always optional: pressing a distressed person for personal details can push her away.
 * `askPhone` is true only when we have no phone number on file.
 */
export function contactRequestGuidance({ askPhone = false } = {}) {
  const what = askPhone
    ? "the address where she is right now and a phone number"
    : "the address where she is right now";
  return `CONTACT DETAILS DURING A CRISIS (only after the safety steps above):
- Once, softly, ask whether she would be willing to share ${what}, so that MumWell's support team can check on her. Say clearly that it is completely her choice.
- Do not claim that anyone will be sent to her or that emergency services have been called. Keep pointing her to her local emergency number.
- If she declines, hesitates, changes the subject or does not answer, accept that warmly, do not ask again, and keep supporting her.
- If she shares the details, thank her simply. Never ask her to repeat or confirm them.`;
}
