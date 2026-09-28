import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DoctorCard from "@/components/consultation/DoctorCard";
import consultantAgents from "@/data/consultants";
import { LANGUAGES } from "@/i18n";
import { getErrorMessage, programApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// Extend a consultant's base prompt with today's programme context and language.
function buildConsultantPrompt(basePrompt, day, wellness = {}, thoughts, languageName) {
  const list = (items) => (items?.length ? items.map((item, i) => `${i + 1}. ${item}`).join("\n") : "None");
  return `
${basePrompt}

--- CONTEXT FOR TODAY'S SESSION ---
Mother's wellness check-in today (0–100):
- Mood: ${wellness?.mood ?? "Not provided"}
- Stress: ${wellness?.stress ?? "Not provided"}
- Sleep quality: ${wellness?.sleep ?? "Not provided"}
- Energy: ${wellness?.energy ?? "Not provided"}

Today's objectives:
${list(day.objectives)}

Today's tasks:
${list(day.tasks)}

Mother's reflection:
${thoughts || "No reflection provided"}
-------------------------------------

LANGUAGE: Speak only ${languageName}, warmly and naturally, unless she explicitly asks to switch language.`;
}

export function DailyProgram({ day, totalDays, wellnessToday, onCompleted }) {
  const { t, i18n } = useTranslation(["program", "common"]);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [thoughts, setThoughts] = useState(day.thoughts || "");
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const language = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

  const submit = async () => {
    setSubmitting(true);
    try {
      const { programPlan } = await programApi.completeDay(day.day, thoughts);
      onCompleted?.(programPlan);
      setShowCelebration(true);
    } catch (error) {
      toast.error(getErrorMessage(error, t("day.failed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>{t("day.progress", { day: day.day, total: totalDays, step })}</span>
          <span>{Math.round((day.day / totalDays) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-coral" style={{ width: `${(day.day / totalDays) * 100}%` }} />
        </div>
      </div>

      <div className="surface animate-fadeIn p-6 sm:p-10" key={step}>
        {step === 1 && (
          <div className="text-center">
            <span className="eyebrow">{t("day.welcome")}</span>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">{day.welcomeMessage}</p>
            <div className="mt-8 rounded-2xl bg-sky-soft p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("day.theme")}</p>
              <h1 className="mt-1 text-2xl font-bold text-primary">{day.theme}</h1>
            </div>
            {day.objectives?.length > 0 && (
              <div className="mt-8 text-left">
                <h2 className="font-bold">{t("day.objectives")}</h2>
                <ul className="mt-3 space-y-2">
                  {day.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {day.encouragementMessage && (
              <p className="mt-8 border-t pt-6 italic text-muted-foreground">{day.encouragementMessage}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-center text-2xl font-bold">{t("day.tasks")}</h1>
            <ol className="mt-6 space-y-3">
              {day.tasks?.map((task, index) => (
                <li key={task} className="flex items-start gap-4 rounded-2xl border bg-background p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="pt-1.5 leading-relaxed">{task}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-sm italic text-muted-foreground">{t("day.tasksNote")}</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-bold">{t("day.reflection")}</h1>
            <p className="text-center text-lg">{day.reflectionPrompt}</p>
            <p className="text-center text-sm text-muted-foreground">{t("day.reflectionNote")}</p>
            <textarea
              placeholder={t("day.reflectionPlaceholder")}
              aria-label={t("day.reflectionLabel")}
              rows={5}
              maxLength={5000}
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              className="w-full resize-none rounded-2xl border border-input bg-background p-4 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              {t("common:actions.back")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant={step < 3 ? "default" : "coral"}
            onClick={() => (step < 3 ? setStep(step + 1) : submit())}
            disabled={submitting}
          >
            {step < 3 ? t("common:actions.next") : submitting ? t("day.submitting") : t("day.done")}
          </Button>
        </div>
      </div>

      <Dialog open={showCelebration} onOpenChange={(open) => !open && navigate("/dashboard")}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-soft text-coral">
              <PartyPopper className="h-7 w-7" />
            </span>
            <DialogTitle className="text-2xl">{t("day.celebrateTitle")}</DialogTitle>
            <DialogDescription className="text-base">{t("day.celebrateBody")}</DialogDescription>
          </DialogHeader>

          <div className="text-center">
            <h3 className="font-bold">{t("day.talkTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("day.talkBody")}</p>
          </div>

          <div className={cn("grid gap-4", consultantAgents.length > 1 && "sm:grid-cols-2")}>
            {consultantAgents.map((consultant) => (
              <DoctorCard
                key={consultant.id}
                compact
                notes={`Day ${day.day} programme check-in`}
                doctorAgent={{
                  ...consultant,
                  specialist: t(`consultants.${consultant.id}.specialist`),
                  description: t(`consultants.${consultant.id}.description`),
                  firstMessage: t(`consultants.${consultant.id}.firstMessage`),
                  language: language.code,
                  agentPrompt: buildConsultantPrompt(
                    consultant.agentPrompt,
                    day,
                    wellnessToday,
                    thoughts,
                    language.englishName,
                  ),
                }}
              />
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
            {t("common:actions.backToDashboard")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
