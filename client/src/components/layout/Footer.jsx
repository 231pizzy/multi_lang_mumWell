import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, LifeBuoy, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AmjoraMark } from "@/components/brand/AmjoraLogo";
import { LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import photoCredits from "@/data/photoCredits.json";

const photographers = [...new Set(Object.values(photoCredits).map((c) => c.photographer))];

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, updateProfile } = useSession();

  const chooseLanguage = async (code) => {
    await i18n.changeLanguage(code);
    // Same as the header switcher: keep AI replies, voice and emails in step.
    if (isAuthenticated) updateProfile({ preferredLanguage: code }).catch(() => {});
  };

  const columns = [
    {
      title: t("footer.product"),
      links: [
        { to: "/features", label: t("nav.features") },
        { to: "/test", label: t("nav.test") },
        { to: "/postpartum-depression", label: t("nav.article") },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { to: "/about", label: t("nav.about") },
        { to: "/contact", label: t("nav.contact") },
        { to: "/contact#crisis", label: t("footer.getHelp") },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { to: "/privacy", label: t("footer.privacy") },
        { to: "/terms", label: t("footer.terms") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-sage/30 bg-sage-soft/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-sage-foreground">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">{t("footer.crisisTitle")}</p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("footer.crisisBody")}</p>
            </div>
          </div>
          <Link
            to="/contact#crisis"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("footer.getHelp")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:px-8">
        <div className="space-y-5">
          <Logo tagline={t("brand.tagline")} />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("footer.tagline")}</p>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
            {t("footer.noTracking")}
          </p>
          <a
            href="https://amjora.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full border bg-background py-1.5 pl-1.5 pr-4 transition-colors hover:border-primary/30"
          >
            <AmjoraMark />
            <span className="text-xs text-muted-foreground">
              {t("footer.poweredBy")} <span className="font-display text-sm font-bold text-foreground">Amjora</span>
            </span>
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="kicker">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="kicker">{t("footer.languagesTitle")}</p>
            <ul className="mt-4 space-y-2.5">
              {LANGUAGES.map((l) => (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => chooseLanguage(l.code)}
                    className={cn(
                      "text-sm transition-colors hover:text-foreground",
                      i18n.resolvedLanguage === l.code ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                    lang={l.code}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            {t("footer.rights", { year: new Date().getFullYear() })}
            {photographers.length > 0 && (
              <span className="block sm:ml-2 sm:inline">
                {t("footer.photos", { names: photographers.join(", ") })}{" "}
                <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Pexels
                </a>
              </span>
            )}
          </p>
          <p className="max-w-xl sm:text-right">{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
