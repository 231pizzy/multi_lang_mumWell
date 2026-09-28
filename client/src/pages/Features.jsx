import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Activity, BellRing, FileText, LifeBuoy, ShieldCheck, Wind } from "lucide-react";
import { FeatureShowcase, FinalCta, PageIntro, Section, SectionHeading } from "@/components/marketing";
import { fadeUp } from "@/lib/motion";

const ICONS = [Activity, Wind, BellRing, FileText, LifeBuoy, ShieldCheck];

export default function Features() {
  const { t } = useTranslation("pages");
  const details = t("features.details", { returnObjects: true });

  return (
    <>
      <PageIntro eyebrow={t("features.eyebrow")} title={t("features.title")} intro={t("features.intro")} />

      <Section>
        <FeatureShowcase />
      </Section>

      <Section className="bg-card">
        <SectionHeading title={t("features.detailTitle")} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((detail, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={detail.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
                className="surface-interactive p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-soft text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{detail.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
