import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, Flower2, TreePine, Waves, Wind } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BreathingGame } from "./BreathingGame";
import { ZenGarden } from "./ZenGarden";
import { ForestGame } from "./ForestGame";
import { OceanWaves } from "./OceanWaves";

const GAMES = [
  { id: "breathing", icon: Wind, tone: "bg-sky-soft text-primary", Component: BreathingGame },
  { id: "garden", icon: Flower2, tone: "bg-coral-soft text-coral", Component: ZenGarden },
  { id: "forest", icon: TreePine, tone: "bg-sage-soft text-sage", Component: ForestGame },
  { id: "waves", icon: Waves, tone: "bg-sky-soft text-primary", Component: OceanWaves },
];

export const AnxietyGames = ({ onGamePlayed }) => {
  const { t } = useTranslation("dashboard");
  const [selected, setSelected] = useState(null);
  const game = GAMES.find((g) => g.id === selected);

  const start = async (id) => {
    setSelected(id);
    try {
      await onGamePlayed?.(t(`games.items.${id}.title`), t(`games.items.${id}.description`));
    } catch (error) {
      console.error("Error logging game activity:", error);
    }
  };

  return (
    <section className="surface p-6" aria-labelledby="games-title">
      <h2 id="games-title" className="text-xl font-bold">
        {t("games.title")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("games.subtitle")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GAMES.map(({ id, icon: Icon, tone }) => (
          <motion.button
            key={id}
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => start(id)}
            className="rounded-2xl border bg-background p-5 text-left transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-bold">{t(`games.items.${id}.title`)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(`games.items.${id}.description`)}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t(`games.items.${id}.duration`)}
            </p>
          </motion.button>
        ))}
      </div>

      <Dialog open={Boolean(game)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{game && t(`games.items.${game.id}.title`)}</DialogTitle>
          </DialogHeader>
          {game && <game.Component />}
        </DialogContent>
      </Dialog>
    </section>
  );
};
