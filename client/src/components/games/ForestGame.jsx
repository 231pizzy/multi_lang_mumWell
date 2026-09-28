import { motion } from "framer-motion";
import { TreePine } from "lucide-react";
import { useAmbientSession } from "./useAmbientSession";
import { SessionControls } from "./SessionControls";

const DURATION = 5 * 60;
const SOUNDS = ["/sounds/birds.mp3", "/sounds/wind.mp3", "/sounds/leaves.mp3"];

export function ForestGame() {
  const session = useAmbientSession(SOUNDS, DURATION);

  return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-8">
      <div className="relative w-48 h-48">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-transparent rounded-full blur-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <TreePine className="w-24 h-24 text-green-600" />
          </div>
        </motion.div>
      </div>
      <SessionControls session={session} totalSeconds={DURATION} />
    </div>
  );
}
