import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, trackingApi } from "@/lib/api";
import { MoodGlyph } from "@/components/brand/MoodGlyph";
import { cn } from "@/lib/utils";

export function MoodForm({ onSuccess }) {
  const { t } = useTranslation("dashboard");
  const labels = t("moodDialog.labels", { returnObjects: true });
  const emotions = (Array.isArray(labels) ? labels : []).map((description, i) => ({ value: i * 25, index: i, description }));
  const [moodScore, setMoodScore] = useState(50);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const currentEmotion = emotions.find((em) => Math.abs(moodScore - em.value) < 15) || emotions[2];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await trackingApi.saveMood(moodScore, note.trim() || undefined);
      toast.success(t("moodDialog.saved"), { description: t("moodDialog.savedBody") });
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, t("moodDialog.failed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <MoodGlyph index={currentEmotion.index} className="h-16 w-16" iconClassName="h-8 w-8" />
        <div className="text-sm font-semibold">{currentEmotion.description}</div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between px-2">
          {emotions.map((em) => (
            <button
              type="button"
              key={em.value}
              aria-label={em.description}
              className={cn(
                "cursor-pointer rounded-2xl transition-opacity",
                Math.abs(moodScore - em.value) < 15 ? "opacity-100" : "opacity-45 hover:opacity-80",
              )}
              onClick={() => setMoodScore(em.value)}
            >
              <MoodGlyph index={em.index} className="h-11 w-11" iconClassName="h-5 w-5" />
            </button>
          ))}
        </div>

        <Slider
          value={[moodScore]}
          onValueChange={(value) => setMoodScore(value[0])}
          min={0}
          max={100}
          step={1}
          className="py-4"
          aria-label={t("moodDialog.title")}
        />
      </div>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder={t("moodDialog.note")}
        className="min-h-20"
      />

      <Button className="w-full" onClick={handleSubmit} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("common:actions.saving")}
          </>
        ) : (
          t("moodDialog.save")
        )}
      </Button>
    </div>
  );
}
