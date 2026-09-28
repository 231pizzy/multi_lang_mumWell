import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getErrorMessage, programApi } from "@/lib/api";
import { MoodGlyph } from "@/components/brand/MoodGlyph";
import { SCALE_ICONS } from "@/lib/moodScales";

const METRICS = [
  { key: "mood" },
  { key: "stress", reverseTone: true },
  { key: "sleep" },
  { key: "energy" },
];

export function WellnessTracking({ onComplete }) {
  const { t } = useTranslation(["program", "common"]);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({ mood: 50, stress: 50, sleep: 50, energy: 50 });
  const [submitting, setSubmitting] = useState(false);

  const metric = METRICS[stepIndex];
  const value = values[metric.key];
  const labels = t(`wellness.metrics.${metric.key}.labels`, { returnObjects: true });
  const index = Math.min(4, Math.round(value / 25));
  const setValue = (v) => setValues((prev) => ({ ...prev, [metric.key]: v }));
  const isLast = stepIndex === METRICS.length - 1;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { entry } = await programApi.saveWellness(values);
      toast.success(t("wellness.saved"), { description: t("wellness.savedBody") });
      onComplete(entry);
    } catch (error) {
      toast.error(getErrorMessage(error, t("wellness.failed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="surface mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-center text-2xl font-bold">{t("wellness.title")}</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">{t("wellness.intro")}</p>

      <div className="mt-6 flex gap-2" aria-hidden="true">
        {METRICS.map((m, i) => (
          <span key={m.key} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-brand-gradient" : "bg-border"}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t("wellness.step", { step: stepIndex + 1, total: METRICS.length })}
      </p>

      <div key={metric.key} className="animate-fadeIn space-y-6 py-6 text-center">
        <div>
          <h2 className="text-xl font-bold">{t(`wellness.metrics.${metric.key}.title`)}</h2>
          <p className="text-sm text-muted-foreground">{t(`wellness.metrics.${metric.key}.question`)}</p>
        </div>
        <MoodGlyph
          index={index}
          icons={SCALE_ICONS[metric.key]}
          reverseTone={metric.reverseTone}
          className="mx-auto h-20 w-20 rounded-3xl"
          iconClassName="h-10 w-10"
        />
        <p className="font-semibold">{labels[index]}</p>
        <Slider
          value={[value]}
          onValueChange={(v) => setValue(v[0])}
          min={0}
          max={100}
          step={1}
          aria-label={t(`wellness.metrics.${metric.key}.title`)}
        />
      </div>

      <div className="flex justify-between">
        {stepIndex > 0 ? (
          <Button variant="outline" onClick={() => setStepIndex(stepIndex - 1)}>
            {t("common:actions.back")}
          </Button>
        ) : (
          <span />
        )}
        {isLast ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("wellness.finish")}
          </Button>
        ) : (
          <Button onClick={() => setStepIndex(stepIndex + 1)}>{t("common:actions.next")}</Button>
        )}
      </div>
    </div>
  );
}
