// Vapi assistant configuration per language.
// English keeps the Vapi voices the specialists were designed with; other languages use
// native Azure neural voices so pronunciation and intonation sound natural.
const AZURE_VOICES = {
  sv: { female: "sv-SE-SofieNeural", male: "sv-SE-MattiasNeural" },
  de: { female: "de-DE-KatjaNeural", male: "de-DE-ConradNeural" },
  fr: { female: "fr-FR-DeniseNeural", male: "fr-FR-HenriNeural" },
  es: { female: "es-ES-ElviraNeural", male: "es-ES-AlvaroNeural" },
};

export function voiceFor(doctor) {
  const language = doctor.language ?? "en";
  const azure = AZURE_VOICES[language];
  if (!azure) return { provider: "vapi", voiceId: doctor.voiceId || "Paige" };
  return { provider: "azure", voiceId: azure[doctor.voiceGender === "male" ? "male" : "female"] };
}

export function assistantConfig(doctor) {
  const language = doctor.language ?? "en";
  return {
    name: "MumWell AI Specialist",
    firstMessage: doctor.firstMessage,
    transcriber: { provider: "deepgram", model: "nova-2", language },
    voice: voiceFor(doctor),
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "system", content: doctor.agentPrompt }],
    },
  };
}
