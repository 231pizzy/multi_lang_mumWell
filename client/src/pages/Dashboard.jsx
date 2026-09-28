import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  AudioLines,
  Bell,
  BookCheck,
  Brain,
  CalendarCheck,
  CalendarHeart,
  Heart,
  MessageCircleHeart,
  NotebookPen,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoodForm } from "@/components/dashboard/MoodForm";
import { ActivityLogger } from "@/components/dashboard/ActivityLogger";
import { AnxietyGames } from "@/components/games/AnxietyGames";
import { useSession } from "@/context/SessionContext";
import { programApi, trackingApi } from "@/lib/api";
import { LogoMark } from "@/components/brand/Logo";
import { buildTimeline, dailyStats, generateInsights } from "@/lib/insights";
import { dateLocale, formatDate, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

const fetchAll = () =>
  Promise.allSettled([
    trackingApi.latestTest(),
    trackingApi.latestMood(),
    trackingApi.activities(28),
    trackingApi.moodHistory(28),
  ]);

const PROGRAM_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function programmeProgress(profile) {
  if (!profile?.hasActiveProgram || !profile.programStartDate) return null;
  const elapsed = Math.floor((Date.now() - new Date(profile.programStartDate).getTime()) / DAY_MS);
  const day = Math.min(PROGRAM_DAYS, Math.max(1, elapsed + 1));
  const done = (profile.programPlan ?? []).filter((entry) => entry.executedDate).length;
  return { day, done, percent: Math.round((day / PROGRAM_DAYS) * 100) };
}

/** Circular progress ring for the programme day. */
function ProgressRing({ percent, children }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#dash-ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
        <defs>
          <linearGradient id="dash-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c9bcff" />
            <stop offset="1" stopColor="#ffa3bd" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

const ACTION_TONES = {
  navy: "bg-primary text-primary-foreground",
  coral: "bg-coral text-coral-foreground",
  sage: "bg-sage-soft text-foreground",
  sky: "bg-sky-soft text-foreground",
};

function ActionCard({ onClick, icon: Icon, title, subtitle, tone, stacked = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full gap-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        stacked ? "flex-col items-start" : "items-center justify-between",
        ACTION_TONES[tone],
      )}
    >
      <span className={cn("flex gap-3", stacked ? "flex-col" : "items-center")}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-semibold leading-tight">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs opacity-80">{subtitle}</span>}
        </span>
      </span>
      {!stacked && (
        <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

export default function Dashboard() {
  const { t, i18n } = useTranslation(["dashboard", "test"]);
  const navigate = useNavigate();
  const { user } = useSession();
  const lang = i18n.resolvedLanguage;

  const [data, setData] = useState({ test: null, mood: null, activities: [], moods: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [programme, setProgramme] = useState(null);

  const applyResults = useCallback(([test, mood, activities, moods]) => {
    const value = (result, fallback) => (result.status === "fulfilled" ? result.value : fallback);
    setData({
      test: value(test, null),
      mood: value(mood, null),
      activities: value(activities, []),
      moods: value(moods, []),
    });
    setLoadError([test, mood, activities, moods].some((r) => r.status === "rejected"));
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    return fetchAll().then(applyResults);
  }, [applyResults]);

  useEffect(() => {
    fetchAll().then(applyResults);
  }, [applyResults]);

  useEffect(() => {
    programApi
      .get()
      .then((profile) => setProgramme(programmeProgress(profile)))
      .catch(() => {});
  }, []);

  const timeline = useMemo(() => buildTimeline(data.activities, data.moods), [data]);
  const stats = useMemo(() => dailyStats(timeline), [timeline]);
  const insights = useMemo(() => generateInsights(timeline), [timeline]);

  const handleGamePlayed = useCallback(
    async (name, description) => {
      await trackingApi.logActivity({ type: "game", name, description });
      loadData();
    },
    [loadData],
  );

  const firstName = user?.name?.split(" ")[0];
  const tiles = [
    {
      key: "mood",
      title: t("overview.moodTitle"),
      value: data.mood ? `${data.mood.score}` : t("common:notYet"),
      icon: Brain,
      tone: "bg-sky-soft text-primary",
      description: data.mood
        ? t("overview.moodChecked", {
            when: formatDistanceToNow(new Date(data.mood.timestamp), {
              addSuffix: true,
              locale: dateLocale(lang),
            }),
          })
        : t("overview.moodEmpty"),
    },
    {
      key: "active",
      title: t("overview.activeTitle"),
      value: `${stats.activeDaysThisWeek}/7`,
      icon: CalendarCheck,
      tone: "bg-sage-soft text-sage",
      description: t("overview.activeDesc"),
    },
    {
      key: "today",
      title: t("overview.todayTitle"),
      value: String(stats.activitiesToday),
      icon: Activity,
      tone: "bg-coral-soft text-coral",
      description: t("overview.todayDesc"),
    },
    {
      key: "epds",
      title: t("overview.epdsTitle"),
      value: data.test ? `${data.test.score}/30` : t("common:notYet"),
      icon: BookCheck,
      tone: "bg-secondary text-primary",
      description: data.test
        ? t(`test:levels.${data.test.level}`, { defaultValue: data.test.level })
        : t("overview.epdsEmpty"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-[2rem] bg-[#1d1650] p-7 text-white shadow-[var(--shadow-lift)] sm:p-9 dark:bg-card dark:text-foreground"
      >
        <div className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-50 [--grid-dot:rgb(255_255_255/0.07)]" />
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-[#b24ea3]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 -z-10 h-64 w-64 rounded-full bg-[#43238f]/70 blur-3xl" />
        <LogoMark className="pointer-events-none absolute -bottom-8 right-40 -z-10 hidden h-48 w-48 opacity-[0.08] lg:block [--logo-from:#fff] [--logo-mid:#fff] [--logo-to:#fff]" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium capitalize text-white/70 dark:text-muted-foreground">
                {formatDate(new Date(), lang, { dateStyle: "full" })}
              </p>
              <Link
                to="/notifications"
                aria-label={t("reminders")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 dark:bg-secondary"
              >
                <Bell className="h-4 w-4" />
              </Link>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              {firstName ? t("welcome", { name: firstName }) : t("welcomeFallback")}
            </h1>
            <p className="mt-2 text-white/75 dark:text-muted-foreground">{t("subtitle")}</p>
          </div>

          {programme ? (
            <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4 pr-6 backdrop-blur dark:border-border dark:bg-background/40">
              <ProgressRing percent={programme.percent}>
                <span className="font-display text-2xl font-extrabold leading-none">{programme.day}</span>
                <span className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/60 dark:text-muted-foreground">
                  / {PROGRAM_DAYS}
                </span>
              </ProgressRing>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60 dark:text-muted-foreground">
                  {t("hero.programmeLabel")}
                </p>
                <p className="mt-1 text-lg font-bold">{t("hero.programmeDay", { day: programme.day, total: PROGRAM_DAYS })}</p>
                <p className="text-sm text-white/70 dark:text-muted-foreground">
                  {t("hero.programmeDone", { count: programme.done })}
                </p>
                <Button asChild size="sm" variant="coral" className="mt-3 rounded-full">
                  <Link to="/program">
                    {t("hero.programmeCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur dark:border-border dark:bg-background/40">
              <p className="font-bold">{t("hero.noProgrammeTitle")}</p>
              <p className="mt-1 text-sm text-white/70 dark:text-muted-foreground">{t("hero.noProgrammeBody")}</p>
              <Button asChild size="sm" variant="coral" className="mt-4 rounded-full">
                <Link to="/program">
                  <CalendarHeart className="h-4 w-4" />
                  {t("hero.noProgrammeCta")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface space-y-4 p-6" aria-labelledby="quick-title">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-soft text-coral">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 id="quick-title" className="font-bold">
                {t("quick.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("quick.subtitle")}</p>
            </div>
          </div>
          <div className="space-y-3">
            <ActionCard
              onClick={() => navigate("/therapy/new")}
              icon={MessageCircleHeart}
              title={t("quick.chat")}
              subtitle={t("quick.chatSub")}
              tone="navy"
            />
            <ActionCard
              onClick={() => navigate("/consultation")}
              icon={AudioLines}
              title={t("quick.voice")}
              subtitle={t("quick.voiceSub")}
              tone="coral"
            />
            <div className="grid grid-cols-2 gap-3">
              <ActionCard onClick={() => navigate("/test")} icon={BookCheck} title={t("quick.test")} tone="sky" stacked />
              <ActionCard onClick={() => navigate("/program")} icon={CalendarHeart} title={t("quick.program")} tone="sky" stacked />
              <ActionCard
                onClick={() => setShowMoodModal(true)}
                icon={Heart}
                title={t("quick.mood")}
                subtitle={t("quick.moodSub")}
                tone="sage"
                stacked
              />
              <ActionCard
                onClick={() => setShowActivityLogger(true)}
                icon={NotebookPen}
                title={t("quick.activity")}
                subtitle={t("quick.activitySub")}
                tone="sage"
                stacked
              />
            </div>
          </div>
        </section>

        <section className="surface p-6" aria-labelledby="overview-title">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 id="overview-title" className="font-bold">
                {t("overview.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("overview.subtitle", { date: formatDate(new Date(), lang, { day: "numeric", month: "long" }) })}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={loading} aria-label={t("overview.refresh")}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {tiles.map((tile) => (
              <div key={tile.key} className="rounded-2xl border bg-background p-4">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tile.tone)}>
                  <tile.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-xs font-medium text-muted-foreground">{tile.title}</p>
                <p className="font-display text-2xl font-extrabold">{loading ? "…" : tile.value}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{tile.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-right text-xs text-muted-foreground">
            {loadError ? t("overview.loadError") : t("overview.updated", { time: formatTime(lastUpdated, lang) })}
          </p>
        </section>

        <section className="surface p-6" aria-labelledby="insights-title">
          <h2 id="insights-title" className="font-bold">
            {t("insights.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("insights.subtitle")}</p>
          <div className="mt-5 space-y-3">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <div
                  key={insight.key}
                  className={cn(
                    "rounded-2xl p-4",
                    insight.priority === "high"
                      ? "bg-coral-soft"
                      : insight.priority === "medium"
                        ? "bg-sky-soft"
                        : "bg-muted",
                  )}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <insight.icon className="h-4 w-4 text-coral" />
                    {t(`insights.${insight.key}.title`)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`insights.${insight.key}.body`)}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("insights.empty")}</p>
            )}
          </div>
        </section>
      </div>

      <AnxietyGames onGamePlayed={handleGamePlayed} />

      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("moodDialog.title")}</DialogTitle>
            <DialogDescription>{t("moodDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <MoodForm
            onSuccess={() => {
              setShowMoodModal(false);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      <ActivityLogger open={showActivityLogger} onOpenChange={setShowActivityLogger} onActivityLogged={loadData} />
    </div>
  );
}
