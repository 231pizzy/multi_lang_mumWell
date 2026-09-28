import { useTranslation } from "react-i18next";
import { Phone, Siren } from "lucide-react";
import { EMERGENCY_NUMBERS } from "@/data/helplines";
import { countryName } from "@/lib/countries";

/** One country, one number, one tap to call. */
function EmergencyNumber({ region, number, note, language }) {
  const { t } = useTranslation();
  const name = region === "EU" ? t("crisis.euTitle") : countryName(region, language);
  return (
    <li>
      <a
        href={`tel:${number}`}
        aria-label={t("crisis.callNumber", { number, country: name })}
        className="group flex h-full min-h-14 flex-col items-start justify-between gap-2 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-destructive/40 hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-tight">{name}</span>
          {note && <span className="block text-xs text-muted-foreground">{t(`crisis.notes.${note}`)}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-display text-xl font-bold tabular-nums text-destructive">
          <Phone className="h-4 w-4 transition-transform group-hover:scale-110" />
          {number}
        </span>
      </a>
    </li>
  );
}

/** Emergency numbers for the EU, the UK, the US, Australia and New Zealand. */
export function EmergencyDirectory() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  return (
    <section id="emergency-numbers" aria-labelledby="emergency-heading" className="scroll-mt-28 surface p-6 sm:p-8">
      <h2 id="emergency-heading" className="flex items-center gap-2 text-xl font-bold">
        <Siren className="h-5 w-5 text-destructive" />
        {t("crisis.directoryTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("crisis.directoryIntro")}</p>

      <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {EMERGENCY_NUMBERS.map((entry) => (
          <EmergencyNumber key={entry.region} {...entry} language={language} />
        ))}
      </ul>
    </section>
  );
}
