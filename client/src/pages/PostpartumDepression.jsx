import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AlertTriangle, BookOpen } from "lucide-react";
import { FinalCta, PageIntro } from "@/components/marketing";
import { Photo } from "@/components/Photo";
import { photos } from "@/data/photos";
import { fadeUp } from "@/lib/motion";

// The emergency section (postpartum psychosis) is highlighted.
const EMERGENCY_SECTION = 2;

export default function PostpartumDepression() {
  const { t } = useTranslation(["pages", "article"]);
  const sections = t("article:sections", { returnObjects: true });

  return (
    <>
      <PageIntro eyebrow={t("article.eyebrow")} title={t("article.title")} intro={t("article.intro")}>
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          {t("article.readTime")}
        </p>
      </PageIntro>

      <div className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
        <Photo
          photo={photos.article}
          width={1774}
          height={887}
          eager
          className="h-auto w-full rounded-[2rem] shadow-[var(--shadow-lift)]"
        />
      </div>

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        <div className="space-y-12">
          {sections.map((section, i) => {
            const emergency = i === EMERGENCY_SECTION;
            return (
              <motion.section
                key={section.heading}
                {...fadeUp}
                className={emergency ? "rounded-2xl border border-coral/40 bg-coral-soft p-6" : undefined}
              >
                <h2 className={`flex items-center gap-2 text-2xl font-bold ${emergency ? "text-accent-foreground" : ""}`}>
                  {emergency && <AlertTriangle className="h-6 w-6" />}
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="mt-4 text-lg leading-relaxed text-foreground/85">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-foreground/85">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {i === 4 && (
                  <Photo
                    photo={photos.articleSupport}
                    className="mt-8 aspect-[16/9] w-full rounded-2xl"
                  />
                )}
              </motion.section>
            );
          })}
        </div>

        <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">{t("article.reviewNote")}</p>
      </article>

      <FinalCta />
    </>
  );
}
