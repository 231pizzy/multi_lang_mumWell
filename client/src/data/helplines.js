// Emergency numbers and crisis/mental-health helplines by country.
// `note` is a key under crisis.notes in common.json. `eu` marks countries where the European
// emotional-support number 116 123 may be available. Verify periodically — numbers change.
// Last reviewed: 2026-09.
export const HELPLINES = {
  SE: {
    emergency: "112",
    eu: true,
    lines: [
      { name: "Självmordslinjen (Mind)", number: "90101", tel: "90101", note: "mindChat" },
      { name: "1177 Vårdguiden", number: "1177", tel: "1177", note: "healthAdvice" },
    ],
  },
  DE: {
    emergency: "112",
    eu: true,
    lines: [
      { name: "TelefonSeelsorge", number: "0800 111 0 111", tel: "08001110111", note: "free247" },
      { name: "TelefonSeelsorge", number: "0800 111 0 222", tel: "08001110222", note: "free247" },
    ],
  },
  AT: { emergency: "112", eu: true, lines: [{ name: "TelefonSeelsorge", number: "142", tel: "142", note: "free247" }] },
  CH: {
    emergency: "112",
    eu: true,
    lines: [{ name: "Die Dargebotene Hand / La Main Tendue", number: "143", tel: "143", note: "always" }],
  },
  FR: {
    emergency: "112",
    eu: true,
    lines: [
      { name: "Numéro national de prévention du suicide", number: "3114", tel: "3114", note: "free247" },
      { name: "SAMU", number: "15", tel: "15", note: "medicalEmergency" },
    ],
  },
  BE: {
    emergency: "112",
    eu: true,
    lines: [
      { name: "Zelfmoordlijn", number: "1813", tel: "1813", note: "dutch247" },
      { name: "Centre de Prévention du Suicide", number: "0800 32 123", tel: "080032123", note: "french247" },
    ],
  },
  ES: {
    emergency: "112",
    eu: true,
    lines: [{ name: "Línea de atención a la conducta suicida", number: "024", tel: "024", note: "free247" }],
  },
  NL: { emergency: "112", eu: true, lines: [{ name: "113 Zelfmoordpreventie", number: "0800 0113", tel: "08000113", note: "free247" }] },
  IE: { emergency: "112", eu: true, lines: [{ name: "Samaritans", number: "116 123", tel: "116123", note: "free247" }] },
  GB: {
    emergency: "999",
    eu: false,
    lines: [
      { name: "Samaritans", number: "116 123", tel: "116123", note: "free247" },
      { name: "NHS 111", number: "111", tel: "111", note: "urgentEngland" },
    ],
  },
  US: {
    emergency: "911",
    eu: false,
    lines: [
      { name: "National Maternal Mental Health Hotline", number: "1-833-852-6262", tel: "18338526262", note: "callOrText247" },
      { name: "988 Suicide & Crisis Lifeline", number: "988", tel: "988", note: "callOrText247" },
    ],
  },
  CA: {
    emergency: "911",
    eu: false,
    lines: [{ name: "9-8-8 Suicide Crisis Helpline", number: "988", tel: "988", note: "callOrText247" }],
  },
  AU: {
    emergency: "000",
    eu: false,
    lines: [
      { name: "PANDA", number: "1300 726 306", tel: "1300726306", note: "perinatal" },
      { name: "Lifeline", number: "13 11 14", tel: "131114", note: "free247" },
    ],
  },
  NZ: { emergency: "111", eu: false, lines: [{ name: "Need to talk?", number: "1737", tel: "1737", note: "callOrText247" }] },
  NG: { emergency: "112", eu: false, lines: [] },
};

export const COUNTRY_CODES = Object.keys(HELPLINES);

// Emergency numbers for the directory on the contact page. 112 is free and works in every
// EU member state from any phone. `note` is a key under crisis.notes in common.json.
export const EMERGENCY_NUMBERS = [
  { region: "EU", number: "112", note: "allEu" },
  { region: "GB", number: "999", note: "also112" },
  { region: "US", number: "911" },
  { region: "AU", number: "000", note: "also112Mobile" },
  { region: "NZ", number: "111" },
];

const LANGUAGE_DEFAULT_COUNTRY = { sv: "SE", de: "DE", fr: "FR", es: "ES", en: "GB" };

/** Best guess of the user's country: saved preference → browser region → language. */
export function defaultCountry(language, userCountry) {
  if (userCountry && HELPLINES[userCountry]) return userCountry;
  try {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const region = new Intl.Locale(tag).maximize().region;
      if (region && HELPLINES[region]) return region;
    }
  } catch {
    // Fall through to the language default.
  }
  return LANGUAGE_DEFAULT_COUNTRY[language] ?? "GB";
}
