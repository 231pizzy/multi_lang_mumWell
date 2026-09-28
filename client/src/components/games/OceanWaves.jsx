import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Waves } from "lucide-react";
import { useAmbientSession } from "./useAmbientSession";
import { SessionControls } from "./SessionControls";

const BREATH_DURATION = 8; // seconds per breath cycle
const DURATION = 5 * 60;
const SOUNDS = ["/sounds/waves.mp3"];

export function OceanWaves() {
  const { t } = useTranslation("dashboard");
  const session = useAmbientSession(SOUNDS, DURATION);

  return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-8">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-xl" />
        <motion.div
          animate={session.isPlaying ? { y: [0, -20, 0] } : { y: 0 }}
          transition={
            session.isPlaying
              ? { duration: BREATH_DURATION, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.5 }
          }
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <Waves className="w-24 h-24 text-primary" />
            <motion.div
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: BREATH_DURATION, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-blue-400/10 blur-xl rounded-full"
            />
          </div>
        </motion.div>
      </div>
      {session.isPlaying && (
        <p className="text-sm text-muted-foreground -mt-4">{t("games.wavesHint")}</p>
      )}
      <SessionControls session={session} totalSeconds={DURATION} />
    </div>
  );
}
