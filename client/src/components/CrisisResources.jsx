import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LifeBuoy, Phone } from "lucide-react";
import { COUNTRY_CODES, defaultCountry, HELPLINES } from "@/data/helplines";
import { useSession } from "@/context/SessionContext";
import { cn } from "@/lib/utils";
import { countryOptions } from "@/lib/countries";

const STORAGE_KEY = "helplineCountry";

function readStoredCountry() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function CallLink({ tel, children, className }) {
  return (
    <a
      href={`tel:${tel}`}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline",
        className,
      )}
    >
      <Phone className="h-3.5 w-3.5" />
      {children}
    </a>
  );
}

/** A whole card that dials the number when tapped: a big target matters most in a crisis. */
function CallCard({ tel, label, number, note, callLabel, emphasis = false }) {
  return (
    <a
      href={`tel:${tel}`}
      className="group flex h-full items-center justify-between gap-4 rounded-xl bg-card p-4 transition-shadow hover:shadow-[var(--shadow-soft)] focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span
          className={cn(
            "mt-1 block font-display font-bold tabular-nums",
            emphasis ? "text-2xl text-destructive" : "text-xl text-foreground",
          )}
        >
          {number}
        </span>
        {note && <span className="mt-1 block text-xs text-muted-foreground">{note}</span>}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-transform group-hover:scale-105",
          emphasis ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <Phone className="h-4 w-4" />
        {callLabel}
      </span>
    </a>
  );
}

/**
 * Crisis support. `compact` renders a short banner (chat, screening results);
 * the full version lists the emergency number and helplines for the selected country.
 */
export function CrisisResources({ compact = false, className }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  // A user's own country wins even when we have no helplines for it: showing another
  // country's numbers would be worse than being honest that we don't have hers.
  const [country, setCountry] = useState(
    () =>
      readStoredCountry() ??
      (user?.country && !HELPLINES[user.country]
        ? user.country
        : defaultCountry(i18n.resolvedLanguage, user?.country)),
  );
  const info = HELPLINES[country];
  const options = info ? COUNTRY_CODES : [country, ...COUNTRY_CODES];
  const countryName = (code) =>
    HELPLINES[code]
      ? t(`crisis.countries.${code}`)
      : (countryOptions(i18n.resolvedLanguage).find((c) => c.code === code)
          ?.name ?? code);

  if (compact) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-2xl border border-coral/40 bg-coral-soft p-4 text-accent-foreground",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold">{t("crisis.compactTitle")}</p>
            <p>{t("crisis.compactBody")}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {info && (
                <CallLink tel={info.emergency}>{info.emergency}</CallLink>
              )}
              <Link
                to="/contact#crisis"
                className="font-medium underline underline-offset-2"
              >
                {t("crisis.seeHelplines")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chooseCountry = (code) => {
    setCountry(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Preference just won't persist.
    }
  };

  return (
    <section
      id="crisis"
      aria-labelledby="crisis-heading"
      className={cn(
        "scroll-mt-24 rounded-2xl border border-coral/40 bg-coral-soft p-6 sm:p-8",
        className,
      )}
    >
      <h2
        id="crisis-heading"
        className="flex items-center gap-2 text-xl font-bold text-accent-foreground"
      >
        <LifeBuoy className="h-5 w-5" />
        {t("crisis.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-foreground/80">
        {t("crisis.intro")}
      </p>

      <div className="mt-5">
        <label htmlFor="helpline-country" className="text-sm font-medium">
          {t("crisis.countryLabel")}
        </label>
        <select
          id="helpline-country"
          value={country}
          onChange={(e) => chooseCountry(e.target.value)}
          className="ml-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm"
        >
          {options.map((code) => (
            <option key={code} value={code}>
              {countryName(code)}
            </option>
          ))}
        </select>
      </div>

      {!info && (
        <p className="mt-4 rounded-xl bg-card p-4 text-sm font-medium">
          {t("crisis.noLocalHelplines")}
        </p>
      )}

      {info && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li>
            <CallCard
              tel={info.emergency}
              label={t("crisis.emergencyLabel")}
              number={info.emergency}
              callLabel={t("crisis.call")}
              emphasis
            />
          </li>
          {info.eu && (
            <li>
              <CallCard
                tel="116123"
                label={t("crisis.supportLabel")}
                number="116 123"
                note={t("crisis.supportNote")}
                callLabel={t("crisis.call")}
              />
            </li>
          )}
          {info.lines.map((line) => (
            <li key={line.number}>
              <CallCard
                tel={line.tel}
                label={line.name}
                number={line.number}
                note={line.note && t(`crisis.notes.${line.note}`)}
                callLabel={t("crisis.call")}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {t("crisis.elsewhere")}{" "}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          findahelpline.com
        </a>
      </p>
    </section>
  );
}
