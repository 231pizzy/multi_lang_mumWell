import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader2, PartyPopper, TicketCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingModal } from "@/components/LoadingModal";
import { WellnessTracking } from "@/components/program/WellnessTracking";
import { ProgramSetupForm } from "@/components/program/ProgramSetupForm";
import { DailyProgram } from "@/components/program/DailyProgram";
import { useSession } from "@/context/SessionContext";
import { getErrorMessage, programApi } from "@/lib/api";
import { utcDateKey } from "@/lib/utils";

const isSameUtcDay = (iso, dayKey) => Boolean(iso) && iso.slice(0, 10) === dayKey;

// Today's entry: the day already completed today, else the first unfinished day.
function pickTodaysDay(plan, todayKey) {
  return (
    plan.find((d) => isSameUtcDay(d.executedDate, todayKey)) ??
    plan.find((d) => !d.executedDate) ??
    null
  );
}

function CenteredCard({ icon: Icon, title, children, spin }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="surface flex w-full max-w-sm animate-fadeIn flex-col items-center p-8 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-soft text-primary">
          <Icon className={`h-7 w-7 ${spin ? "animate-spin" : ""}`} />
        </span>
        <h1 className="text-xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default function Program() {
  const { t } = useTranslation(["program", "common"]);
  const { user } = useSession();
  const [profile, setProfile] = useState(null);
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [checkInAcknowledged, setCheckInAcknowledged] = useState(false);
  const [startingOver, setStartingOver] = useState(false);

  useEffect(() => {
    Promise.all([programApi.get(), programApi.wellness()])
      .then(([program, wellness]) => {
        setProfile(program);
        setWellnessHistory(wellness);
      })
      .catch((error) => setLoadError(getErrorMessage(error, t("loadFailed"))))
      .finally(() => setLoading(false));
  }, [t]);

  const todayKey = utcDateKey();
  const plan = useMemo(() => profile?.programPlan ?? [], [profile]);
  const today = useMemo(() => pickTodaysDay(plan, todayKey), [plan, todayKey]);
  const wellnessToday = wellnessHistory.find((entry) => entry.date === todayKey);
  const hasProgram = Boolean(profile?.hasActiveProgram && plan.length);

  const createProgram = async (formData) => {
    setCreating(true);
    try {
      const created = await programApi.create(formData);
      setProfile(created);
      setWellnessHistory(created.wellnessHistory ?? []);
      setStartingOver(false);
      toast.success(t("ready"), { description: t("readyTip") });
    } catch (error) {
      toast.error(getErrorMessage(error, t("createFailed")));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <CenteredCard icon={Loader2} spin title={t("loadingTitle")}>
        <p className="mt-2 text-sm text-muted-foreground">{t("loadingBody")}</p>
      </CenteredCard>
    );
  }

  if (loadError) {
    return (
      <CenteredCard icon={TicketCheck} title={t("errorTitle")}>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <Button className="mt-6 w-full" onClick={() => window.location.reload()}>
          {t("common:actions.tryAgain")}
        </Button>
      </CenteredCard>
    );
  }

  if (!hasProgram || startingOver) {
    return (
      <div className="px-4 py-12">
        <ProgramSetupForm defaultName={profile?.name || user?.name || ""} submitting={creating} onSubmit={createProgram} />
        <LoadingModal isOpen={creating} />
      </div>
    );
  }

  if (!today) {
    return (
      <CenteredCard icon={PartyPopper} title={t("complete.title")}>
        <p className="mt-2 text-sm text-muted-foreground">{t("complete.body")}</p>
        <Button className="mt-6 w-full" onClick={() => setStartingOver(true)}>
          {t("complete.restart")}
        </Button>
        <Button asChild variant="outline" className="mt-3 w-full">
          <Link to="/dashboard">{t("common:actions.backToDashboard")}</Link>
        </Button>
      </CenteredCard>
    );
  }

  if (!wellnessToday) {
    return (
      <div className="px-4 py-12">
        <WellnessTracking
          onComplete={(entry) => {
            setWellnessHistory((history) => [...history.filter((e) => e.date !== entry.date), entry]);
            setCheckInAcknowledged(true);
          }}
        />
      </div>
    );
  }

  if (!checkInAcknowledged) {
    return (
      <CenteredCard icon={TicketCheck} title={t("checkinDone.title")}>
        <p className="mt-2 text-sm text-muted-foreground">{t("checkinDone.body")}</p>
        <Button className="mt-6 w-full" onClick={() => setCheckInAcknowledged(true)}>
          {t("checkinDone.continue")}
        </Button>
      </CenteredCard>
    );
  }

  return (
    <DailyProgram
      key={today.day}
      day={today}
      totalDays={plan.length}
      wellnessToday={wellnessToday}
      onCompleted={(programPlan) => setProfile((p) => ({ ...p, programPlan }))}
    />
  );
}
