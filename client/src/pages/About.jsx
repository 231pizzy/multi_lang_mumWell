import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FinalCta, PageIntro } from "@/components/marketing";
import { Photo } from "@/components/Photo";
import { photos } from "@/data/photos";
import { fadeUp } from "@/lib/motion";

export default function About() {
  const { t } = useTranslation("pages");
  const sections = t("about.sections", { returnObjects: true });
  const values = t("about.values", { returnObjects: true });

  return (
    <>
      <PageIntro eyebrow={t("about.eyebrow")} title={t("about.title")} intro={t("about.intro")} />

      <motion.div {...fadeUp} className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <Photo
          photo={photos.about}
          width={1774}
          height={887}
          eager
          className="h-auto w-full rounded-[2rem] shadow-[var(--shadow-lift)]"
        />
      </motion.div>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <motion.div {...fadeUp} className="lg:sticky lg:top-28 lg:self-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("about.valuesTitle")}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {values.map((value) => (
                <li key={value} className="rounded-full bg-sage-soft px-3 py-1 text-sm font-medium text-sage">
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div key={section.title} {...fadeUp} className="flex gap-5">
              <span className="font-display text-sm font-bold text-coral">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{section.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <FinalCta />
    </>
  );
}
