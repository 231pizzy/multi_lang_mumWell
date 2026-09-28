import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarHeart,
  Check,
  ClipboardCheck,
  MessageCircleHeart,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/Photo";
import { LogoMark } from "@/components/brand/Logo";
import { photos } from "@/data/photos";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Shared building blocks for the public marketing pages.

export function SectionHeading({ eyebrow, title, body, center = true, className }) {
  return (
    <motion.div
      {...fadeUp}
      className={cn(center ? "mx-auto max-w-3xl text-center" : "max-w-xl", className)}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-5 text-3xl font-extrabold leading-[1.1] sm:text-[2.6rem]">{title}</h2>
      {body && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{body}</p>}
    </motion.div>
  );
}

/** Wraps a section with consistent width and vertical rhythm. */
export function Section({ className, innerClassName, children, id }) {
  return (
    <section id={id} className={cn("overflow-x-clip", className)}>
      <div className={cn("mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

const SHOWCASE = [
  { key: "screening", photo: photos.screening, icon: ClipboardCheck, to: "/test" },
  { key: "companion", photo: photos.companion, icon: MessageCircleHeart, to: "/signup" },
  { key: "specialists", photo: photos.specialists, icon: Stethoscope, to: "/signup" },
  { key: "programme", photo: photos.programme, icon: CalendarHeart, to: "/signup" },
];

/** Alternating image/text rows describing the four core services. */
export function FeatureShowcase() {
  const { t } = useTranslation("home");
  return (
    <div className="space-y-20 lg:space-y-28">
      {SHOWCASE.map(({ key, photo, icon: Icon }, i) => {
        const points = t(`features.items.${key}.points`, { returnObjects: true });
        const flipped = i % 2 === 1;
        return (
          <motion.article
            key={key}
            {...fadeUp}
            className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <div className={cn("relative", flipped && "lg:order-2")}>
              <div
                className={cn(
                  "pointer-events-none absolute -inset-4 rounded-[2.5rem] opacity-60 blur-2xl",
                  flipped ? "bg-coral-soft" : "bg-sky-soft",
                )}
              />
              <div className="relative overflow-hidden rounded-[1.75rem] border bg-card p-2 shadow-[var(--shadow-lift)]">
                <Photo photo={photo} className="aspect-[3/2] w-full rounded-[1.35rem]" />
              </div>
            </div>

            <div className={cn(flipped && "lg:order-1")}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[var(--shadow-soft)]">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {t(`features.items.${key}.tag`)}
                </span>
              </div>
              <h3 className="mt-6 text-2xl font-extrabold sm:text-3xl">
                {t(`features.items.${key}.title`)}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {t(`features.items.${key}.body`)}
              </p>
              <ul className="mt-7 space-y-3.5">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-[0.95rem] leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export function FinalCta() {
  const { t } = useTranslation("home");
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        {...fadeUp}
        className="relative isolate overflow-hidden rounded-[2.25rem] bg-[#1d1650] px-6 py-16 text-center text-white sm:px-16 lg:py-20 dark:bg-card dark:text-foreground"
      >
        <div className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [--grid-dot:rgb(255_255_255/0.08)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[#b24ea3]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-[#43238f]/60 blur-3xl" />
        <LogoMark className="pointer-events-none absolute -bottom-10 -right-6 -z-10 h-64 w-64 opacity-[0.12] [--logo-from:#fff] [--logo-mid:#fff] [--logo-to:#fff]" />

        <LogoMark className="mx-auto h-14 w-14 [--logo-from:#b9a8ff] [--logo-mid:#e58ad6] [--logo-to:#ffa3bd]" />
        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold sm:text-5xl">{t("cta.title")}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/75 dark:text-muted-foreground">
          {t("cta.body")}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="coral" className="rounded-full">
            <Link to="/signup">
              {t("cta.button")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white dark:border-border dark:text-foreground"
          >
            <Link to="/test">{t("cta.secondary")}</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm font-medium text-white/60 dark:text-muted-foreground">{t("cta.note")}</p>
      </motion.div>
    </section>
  );
}

/** Standard header for public content pages. */
export function PageIntro({ eyebrow, title, intro, children }) {
  return (
    <section className="relative isolate overflow-hidden border-b bg-card">
      <div className="bg-hero-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_70%_at_50%_0%,#000,transparent)]" />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-[3.4rem]">{title}</h1>
        {intro && <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
