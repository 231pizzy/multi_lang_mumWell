import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { PageIntro } from "@/components/marketing";

// Bump when the policy text changes materially.
const LAST_UPDATED = new Date("2026-09-27");

/** Privacy policy or terms of use (`doc` is "privacy" or "terms"). */
export default function Legal({ doc }) {
  const { t, i18n } = useTranslation("legal");
  const sections = t(`${doc}.sections`, { returnObjects: true });
  const date = LAST_UPDATED.toLocaleDateString(i18n.resolvedLanguage, { dateStyle: "long" });

  return (
    <>
      <PageIntro eyebrow={t(`${doc}.eyebrow`)} title={t(`${doc}.title`)} intro={t(`${doc}.intro`)}>
        <p className="mt-6 text-sm text-muted-foreground">{t("lastUpdated", { date })}</p>
      </PageIntro>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p role="note" className="mb-10 flex gap-3 rounded-xl border border-coral/40 bg-coral-soft p-4 text-sm text-accent-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("draftNotice")}
        </p>

        <nav aria-label={t("contents")} className="mb-12 rounded-2xl border bg-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("contents")}</p>
          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#section-${i}`} className="text-sm text-primary hover:underline">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`section-${i}`} className="scroll-mt-24">
              <h2 className="text-xl font-bold">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-foreground/85">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground/85 marker:text-coral">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
