import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Wind } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const TOTAL_ROUNDS = 5;
const TICK_MS = 100;
// Durations in ticks: 5s in, ~2.75s hold, 5s out (same pacing as before).
const PHASES = [
  { key: "inhale", labelKey: "games.breatheIn", ticks: 50, scale: 1.5 },
  { key: "hold", labelKey: "games.hold", ticks: 28, scale: 1.2 },
  { key: "exhale", labelKey: "games.breatheOut", ticks: 50, scale: 1 },
];
const TICKS_PER_ROUND = PHASES.reduce((sum, p) => sum + p.ticks, 0);
const TOTAL_TICKS = TICKS_PER_ROUND * TOTAL_ROUNDS;

// Derive the current round/phase/progress from a single tick counter.
function positionFor(tick) {
  const round = Math.min(TOTAL_ROUNDS, Math.floor(tick / TICKS_PER_ROUND) + 1);
  let offset = tick % TICKS_PER_ROUND;
  for (const phase of PHASES) {
    if (offset < phase.ticks) return { round, phase, progress: (offset / phase.ticks) * 100 };
    offset -= phase.ticks;
  }
  return { round, phase: PHASES[2], progress: 100 };
}

export function BreathingGame() {
  const { t } = useTranslation("dashboard");
  const [tick, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isComplete = tick >= TOTAL_TICKS;

  useEffect(() => {
    if (isComplete || isPaused) return;
    const timer = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(timer);
  }, [isComplete, isPaused]);

  const reset = () => {
    setTick(0);
    setIsPaused(false);
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-green-500" />
        </motion.div>
        <h3 className="text-2xl font-semibold">{t("games.greatJob")}</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          {t("games.completed", { total: TOTAL_ROUNDS })}
        </p>
        <Button onClick={reset} className="mt-4">
          {t("games.again")}
        </Button>
      </div>
    );
  }

  const { round, phase, progress } = positionFor(tick);

  return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.key}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="text-center space-y-4"
        >
          <div className="relative w-32 h-32 mx-auto">
            <motion.div
              animate={{ scale: phase.scale }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary/10 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wind className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold" aria-live="polite">
            {t(phase.labelKey)}
          </h3>
        </motion.div>
      </AnimatePresence>

      <div className="w-64">
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-2 text-center">
        <div className="text-sm text-muted-foreground">
          {t("games.round", { round, total: TOTAL_ROUNDS })}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsPaused((p) => !p)}>
          {isPaused ? t("games.resume") : t("games.pause")}
        </Button>
      </div>
    </div>
  );
}
