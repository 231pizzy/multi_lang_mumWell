import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardCheck, Heart, MessageCircleHeart, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CrisisResources } from "@/components/CrisisResources";
import { getErrorMessage, trackingApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// Options are listed from least to most symptomatic, scored 0–3 (equivalent to the
// official EPDS scoring, where items 3 and 5–10 are reverse-ordered on the paper form).
const SCORES = [0, 1, 2, 3];
const SELF_HARM_QUESTION = 9; // question 10

// Levels are stored in English on the server (see trackingController.epdsLevel).
function scoreResult(answers) {
  const score = answers.reduce((a, b) => a + b, 0);
  const band = score <= 9 ? "low" : score <= 12 ? "mild" : "high";
  const level = { low: "Low Risk", mild: "Mild Risk", high: "High Risk" }[band];
  return { score, band, level, selfHarmFlag: answers[SELF_HARM_QUESTION] > 0 };
}

export default function Test() {
  const { t } = useTranslation("test");
  const navigate = useNavigate();
  const questions = t("questions", { returnObjects: true });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const saveResult = async (finalAnswers, computed) => {
    try {
      await trackingApi.saveTest({
        score: computed.score,
        level: computed.level,
        message: t(`results.${computed.band}.message`, { lng: "en" }),
        answers: finalAnswers,
      });
      toast.success(t("saved"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveFailed")));
    }
  };

  const handleAnswer = (score) => {
    const updated = [...answers];
    updated[current] = score;
    setAnswers(updated);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const computed = scoreResult(updated);
      setResult(computed);
      saveResult(updated, computed);
    }
  };

  const restart = () => {
    setAnswers([]);
    setCurrent(0);
    setResult(null);
  };

  const question = questions[current];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-soft text-primary">
          <ClipboardCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="surface p-6 sm:p-10">
        {result ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="font-display text-6xl font-extrabold text-primary">
              {result.score}
              <span className="text-2xl text-muted-foreground">/30</span>
            </p>
            <h2
              className={cn(
                "mt-3 text-2xl font-bold",
                result.band === "high" ? "text-destructive" : result.band === "mild" ? "text-coral" : "text-sage",
              )}
            >
              {t(`levels.${result.level}`)}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-foreground/85">{t(`results.${result.band}.message`)}</p>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{t("shareNote")}</p>

            {(result.selfHarmFlag || result.band === "high") && <CrisisResources compact className="mt-6 text-left" />}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/therapy/new")} className="h-auto py-3 whitespace-normal">
                <MessageCircleHeart className="h-4 w-4" />
                {t(`results.${result.band}.chat`)}
              </Button>
              <Button variant="outline" onClick={restart}>
                <RotateCcw className="h-4 w-4" />
                {t("retake")}
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
              <span>{t("question", { current: current + 1, total: questions.length })}</span>
              <span>{Math.round(((current + 1) / questions.length) * 100)}%</span>
            </div>
            <Progress value={((current + 1) / questions.length) * 100} className="mb-10 h-2" />
            <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral">{t("timeframe")}</p>
              <h2 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{question.q}</h2>
              <div className="mt-8 grid gap-3" role="radiogroup" aria-label={question.q}>
                {question.options.map((option, i) => {
                  const selected = answers[current] === SCORES[i];
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={option}
                      onClick={() => handleAnswer(SCORES[i])}
                      className={cn(
                        "rounded-xl border-2 px-5 py-4 text-left font-medium transition-colors hover:border-primary/50 hover:bg-secondary",
                        selected ? "border-primary bg-secondary" : "border-border bg-card",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {current > 0 && (
                <Button variant="ghost" className="mt-6" onClick={() => setCurrent(current - 1)}>
                  <ArrowLeft className="h-4 w-4" />
                  {t("previous")}
                </Button>
              )}
            </motion.div>
          </>
        )}
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Heart className="h-4 w-4 text-coral" />
        {t("footer")}
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground/70">{t("source")}</p>
    </div>
  );
}
