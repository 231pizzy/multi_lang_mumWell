import { useTranslation } from "react-i18next";
import { ChevronDown, Mail, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/marketing";
import { CrisisResources } from "@/components/CrisisResources";
import { EmergencyDirectory } from "@/components/EmergencyDirectory";

const SUPPORT_EMAIL = "support@mumwell.org";

export default function Contact() {
  const { t } = useTranslation("pages");
  const faqs = t("contact.faqs", { returnObjects: true });

  return (
    <>
      <PageIntro eyebrow={t("contact.eyebrow")} title={t("contact.title")} intro={t("contact.intro")} />

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-16 sm:px-6">
        <CrisisResources />
        <EmergencyDirectory />

        <div className="grid gap-4 sm:grid-cols-2">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="surface flex items-start gap-4 p-6 transition-colors hover:border-primary/40">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{t("contact.emailLabel")}</p>
              <p className="text-primary">{SUPPORT_EMAIL}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("contact.responseTime")}</p>
            </div>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Data%20protection`}
            className="surface flex items-start gap-4 p-6 transition-colors hover:border-primary/40"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{t("contact.privacyLabel")}</p>
              <p className="text-primary">{SUPPORT_EMAIL}</p>
            </div>
          </a>
        </div>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold">
            {t("contact.faqTitle")}
          </h2>
          <div className="mt-6 divide-y rounded-2xl border bg-card">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
