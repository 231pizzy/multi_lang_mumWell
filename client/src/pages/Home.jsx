import { useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpenCheck,
  CalendarHeart,
  Check,
  ClipboardCheck,
  Clock,
  Globe,
  HandHeart,
  HeartHandshake,
  LifeBuoy,
  Lock,
  MessageCircleHeart,
  Phone,
  Plus,
  Scale,
  ShieldCheck,
  ShieldHalf,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/Photo";
import { LogoMark } from "@/components/brand/Logo";
import { MoodGlyph } from "@/components/brand/MoodGlyph";
import { MOOD_ICONS } from "@/lib/moodScales";
import { photos } from "@/data/photos";
import { FeatureShowcase, FinalCta, Section, SectionHeading } from "@/components/marketing";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/i18n";

const WHO_SOURCE =
  "https://www.who.int/teams/mental-health-and-substance-use/promotion-prevention/maternal-mental-health";

const GREETINGS = { en: "Hello", sv: "Hej", de: "Hallo", fr: "Bonjour", es: "Hola" };

const stagger = (i, step = 0.08) => ({ ...fadeUp, transition: { ...fadeUp.transition, delay: i * step } });

/* ------------------------------------------------------------------ Hero */

function Hero() {
  const { t } = useTranslation("home");
  const trust = [
    { icon: Globe, label: t("hero.trust.languages") },
    { icon: ShieldCheck, label: t("hero.trust.gdpr") },
    { icon: Clock, label: t("hero.trust.available") },
    { icon: BookOpenCheck, label: t("hero.trust.evidence") },
  ];

  return (
    <section className="relative isolate overflow-hidden">
      <div className="bg-hero-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(80%_70%_at_30%_20%,#000,transparent)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-28 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">{t("hero.eyebrow")}</span>
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">{t("hero.badge")}</span>
          </div>
          <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[4.1rem]">
            <Trans t={t} i18nKey="hero.title" components={{ accent: <span className="text-gradient" /> }} />
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="coral" className="rounded-full px-8 shadow-[var(--shadow-lift)]">
              <Link to="/signup">
                {t("hero.primaryCta")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link to="/test">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {t("hero.secondaryCta")}
              </Link>
            </Button>
          </div>

          <ul className="mt-12 grid grid-cols-2 overflow-hidden rounded-2xl border bg-card/70 backdrop-blur sm:grid-cols-4">
            {trust.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={cn(
                  "flex flex-col gap-2 p-4 text-sm font-semibold leading-snug",
                  i % 2 === 1 && "border-l",
                  i >= 2 && "border-t sm:border-t-0",
                  i === 2 && "sm:border-l",
                )}
              >
                <Icon className="h-5 w-5 text-sage" />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const { t } = useTranslation("home");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="relative mx-auto w-full max-w-[560px] lg:pl-6"
    >
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-brand-gradient opacity-[0.14] blur-2xl" />
      <div className="relative overflow-hidden rounded-[2.25rem] border-[6px] border-card shadow-[var(--shadow-glow)]">
        <Photo photo={photos.hero} eager className="aspect-[4/5] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d1650]/55 via-transparent to-transparent" />
        <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-center gap-1.5">
          {LANGUAGES.map((l) => (
            <span
              key={l.code}
              className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#2a2170] backdrop-blur"
            >
              {l.flag}
            </span>
          ))}
          <span className="ml-1 text-sm font-semibold text-white drop-shadow">{t("hero.cardLanguageValue")}</span>
        </div>
      </div>

      {/* EPDS progress card */}
      <div className="absolute -left-4 top-8 hidden w-60 animate-float rounded-2xl border bg-card/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur sm:block lg:-left-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-soft text-primary">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            {t("hero.cardScreeningTitle")}
          </span>
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{t("hero.cardScreeningStep")}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[40%] rounded-full bg-brand-gradient" />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("h-6 rounded-md border", i === 1 ? "border-primary/40 bg-sky-soft" : "bg-background")}
            />
          ))}
        </div>
      </div>

      {/* Safety pill */}
      <div
        className="absolute -right-3 top-1/3 hidden animate-float items-center gap-3 rounded-2xl border bg-card/95 p-3 pr-4 shadow-[var(--shadow-lift)] backdrop-blur sm:flex lg:-right-8"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-soft text-sage">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold">{t("hero.cardSafetyTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("hero.cardSafetyBody")}</p>
        </div>
      </div>

      {/* Chat exchange */}
      <div
        className="absolute -left-4 bottom-20 hidden w-72 animate-float space-y-2 rounded-2xl border bg-card/95 p-3.5 shadow-[var(--shadow-lift)] backdrop-blur md:block lg:-left-14"
        style={{ animationDelay: "2.4s" }}
      >
        <p className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-xs leading-relaxed text-primary-foreground">
          {t("hero.cardChatUser")}
        </p>
        <div className="flex items-end gap-2">
          <LogoMark className="h-7 w-7 shrink-0" />
          <p className="max-w-[88%] rounded-2xl rounded-bl-md bg-secondary px-3 py-2 text-xs leading-relaxed">
            {t("hero.cardChatAi")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------- Standards */

function Standards() {
  const { t } = useTranslation("home");
  const items = t("standards.items", { returnObjects: true });
  const icons = [Globe, ClipboardCheck, ShieldHalf, Scale, Accessibility];
  return (
    <section className="border-y bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8">
        <p className="kicker shrink-0">{t("standards.title")}</p>
        <ul className="flex flex-wrap gap-x-7 gap-y-3">
          {items.map((item, i) => {
            const Icon = icons[i] ?? Check;
            return (
              <li key={item} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <Icon className="h-4 w-4 text-primary" />
                {item}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Stats */

function Challenge() {
  const { t } = useTranslation("home");
  const items = t("stats.items", { returnObjects: true });
  return (
    <section className="relative isolate overflow-hidden bg-[#17123f] text-white dark:bg-card dark:text-foreground">
      <div className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-60 [--grid-dot:rgb(255_255_255/0.06)]" />
      <div className="pointer-events-none absolute -left-40 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-[#43238f]/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-[360px] w-[360px] rounded-full bg-[#b24ea3]/30 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-28">
        <motion.div {...fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffb3c9] dark:border-border dark:text-accent-foreground">
            {t("stats.eyebrow")}
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.1] sm:text-[2.6rem]">{t("stats.title")}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70 dark:text-muted-foreground">{t("stats.body")}</p>
          <a
            href={WHO_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline dark:text-muted-foreground"
          >
            {t("stats.source")}
            <span className="sr-only">({t("stats.sourceLink")})</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.value}
              {...stagger(i)}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur dark:border-border dark:bg-background/40"
            >
              <p className="font-display text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#c9bcff] to-[#ffa3bd] sm:text-[3.4rem]">
                {item.value}
              </p>
              <p className="mt-4 leading-relaxed text-white/75 dark:text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Pathway */

function Pathway() {
  const { t } = useTranslation("home");
  const steps = t("how.steps", { returnObjects: true });
  const icons = [ClipboardCheck, MessageCircleHeart, CalendarHeart, AudioLines, HandHeart];
  return (
    <Section>
      <SectionHeading eyebrow={t("how.eyebrow")} title={t("how.title")} body={t("how.body")} />

      <ol className="relative mt-16 grid gap-8 lg:grid-cols-5 lg:gap-5">
        <div
          aria-hidden="true"
          className="absolute left-7 top-7 bottom-7 w-px bg-gradient-to-b from-[var(--logo-from)] via-[var(--logo-mid)] to-[var(--logo-to)] opacity-40 lg:inset-x-[10%] lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r"
        />
        {steps.map((step, i) => {
          const Icon = icons[i];
          const last = i === steps.length - 1;
          return (
            <motion.li key={step.title} {...stagger(i)} className="relative flex gap-5 lg:flex-col lg:gap-0">
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center lg:mx-auto">
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-background shadow-[var(--shadow-soft)]",
                    last ? "bg-sage text-sage-foreground" : "bg-brand-gradient text-white",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <div className="surface-interactive flex-1 p-6 lg:mt-6 lg:text-center">
                <p className="kicker">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                <span className="mt-4 inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  {step.tag}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------- Features */

function Features() {
  const { t } = useTranslation("home");
  return (
    <Section className="bg-card">
      <SectionHeading eyebrow={t("features.eyebrow")} title={t("features.title")} />
      <div className="mt-16 lg:mt-20">
        <FeatureShowcase />
      </div>
      <div className="mt-16 text-center">
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link to="/features">
            {t("features.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- Safety */

function Safety() {
  const { t } = useTranslation("home");
  const flow = t("safety.flow", { returnObjects: true });
  const does = t("safety.does", { returnObjects: true });
  const doesnt = t("safety.doesnt", { returnObjects: true });
  const flowIcons = [MessageCircleHeart, ShieldHalf, HeartHandshake, Phone];

  return (
    <Section>
      <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="lg:sticky lg:top-32">
          <SectionHeading center={false} eyebrow={t("safety.eyebrow")} title={t("safety.title")} body={t("safety.body")} />
          <motion.p
            {...fadeUp}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-[var(--shadow-soft)]"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            {t("safety.aiNotice")}
          </motion.p>
        </div>

        <div>
          <ol className="relative space-y-4">
            <div aria-hidden="true" className="absolute left-[27px] top-8 bottom-8 w-px bg-border" />
            {flow.map((step, i) => {
              const Icon = flowIcons[i];
              const last = i === flow.length - 1;
              return (
                <motion.li key={step.title} {...stagger(i)} className="relative flex gap-5">
                  <span
                    className={cn(
                      "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-background",
                      last ? "bg-sage text-sage-foreground" : "bg-secondary text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className={cn("surface flex-1 p-5", last && "border-sage/40 bg-sage-soft/60")}>
                    <p className="font-bold">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <motion.div {...fadeUp} className="rounded-3xl border border-sage/30 bg-sage-soft/50 p-6">
              <p className="font-bold">{t("safety.doesTitle")}</p>
              <ul className="mt-4 space-y-3">
                {does.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...stagger(1)} className="rounded-3xl border border-coral/25 bg-coral-soft/60 p-6">
              <p className="font-bold">{t("safety.doesntTitle")}</p>
              <ul className="mt-4 space-y-3">
                {doesnt.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-coral" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------- Mood */


function MoodCheck() {
  const { t } = useTranslation("home");
  const [index, setIndex] = useState(null);
  const labels = t("mood.labels", { returnObjects: true });
  const responses = t("mood.responses", { returnObjects: true });

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:pb-28">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-[2rem] border bg-card p-8 shadow-[var(--shadow-lift)] sm:p-12"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-coral-soft blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="kicker">{t("mood.kicker")}</p>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{t("mood.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("mood.subtitle")}</p>
          </div>
          <div>
            <div role="radiogroup" aria-label={t("mood.title")} className="grid grid-cols-5 gap-2 sm:gap-3">
              {MOOD_ICONS.map((Icon, i) => {
                const selected = index === i;
                return (
                  <button
                    key={labels[i]}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setIndex(i)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-2 pb-3 transition-all sm:p-3",
                      selected
                        ? "border-primary/40 shadow-[var(--shadow-soft)] ring-2 ring-primary/20"
                        : "border-transparent hover:border-border",
                    )}
                  >
                    <MoodGlyph
                      index={i}
                      className={cn("h-12 w-12 sm:h-14 sm:w-14", selected && "scale-110")}
                      iconClassName="h-6 w-6 sm:h-7 sm:w-7"
                    />
                    <span className="text-center text-[0.7rem] font-semibold leading-tight sm:text-xs">{labels[i]}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-6 min-h-12 text-center text-muted-foreground lg:text-left" aria-live="polite">
              {index === null ? t("mood.hint") : responses[index]}
            </p>
            {index !== null && (
              <div className="mt-2 text-center lg:text-left">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/signup">
                    {t("mood.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* --------------------------------------------------------------- Global */

function GlobalPrivacy() {
  const { t } = useTranslation("home");
  const points = t("global.points", { returnObjects: true });
  const icons = [Globe, ShieldCheck, Lock, HeartHandshake];
  return (
    <Section className="bg-card">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading center={false} eyebrow={t("global.eyebrow")} title={t("global.title")} body={t("global.body")} />
          <motion.div {...fadeUp} className="mt-10">
            <p className="kicker">{t("global.languagesTitle")}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LANGUAGES.map((l) => (
                <li key={l.code} className="surface-interactive flex items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-xs font-extrabold text-primary">
                    {l.flag}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{l.label}</span>
                    <span className="block text-xs text-muted-foreground">{GREETINGS[l.code]}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <LifeBuoy className="h-4 w-4 text-sage" />
              {t("global.helplines")}
            </p>
          </motion.div>
        </div>

        <motion.ul {...fadeUp} className="relative space-y-4">
          <div className="pointer-events-none absolute -inset-6 -z-0 rounded-[2.5rem] bg-sky-soft/70" />
          {points.map((point, i) => {
            const Icon = icons[i] ?? Check;
            return (
              <li key={point} className="surface relative flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-2.5 font-medium leading-snug">{point}</span>
              </li>
            );
          })}
        </motion.ul>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------- Principles */

function Principles() {
  const { t } = useTranslation("home");
  const items = t("principles.items", { returnObjects: true });
  const icons = [ShieldCheck, BookOpenCheck, Lock, HeartHandshake];
  return (
    <Section>
      <SectionHeading eyebrow={t("principles.eyebrow")} title={t("principles.title")} />
      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[i];
          return (
            <motion.div key={item.title} {...stagger(i)} className="surface-interactive relative overflow-hidden p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-soft text-coral">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-display text-sm font-bold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ FAQ */

function Faq() {
  const { t } = useTranslation("home");
  const { t: tp } = useTranslation("pages");
  const faqs = tp("contact.faqs", { returnObjects: true });
  return (
    <Section className="bg-card">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading center={false} eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
          <motion.div {...fadeUp} className="mt-8">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("faq.more")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
        <motion.div {...fadeUp} className="divide-y rounded-3xl border bg-background">
          {Array.isArray(faqs) &&
            faqs.map((faq) => (
              <details key={faq.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-semibold">
                  {faq.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-transform group-open:rotate-45">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-3 pr-12 leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
        </motion.div>
      </div>
    </Section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Standards />
      <Challenge />
      <Pathway />
      <Features />
      <Safety />
      <MoodCheck />
      <GlobalPrivacy />
      <Principles />
      <Faq />
      <FinalCta />
    </>
  );
}
