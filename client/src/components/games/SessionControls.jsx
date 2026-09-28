import { useTranslation } from "react-i18next";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "./useAmbientSession";

export function SessionControls({ session, totalSeconds }) {
  const { t } = useTranslation("dashboard");
  const { volume, setVolume, progress, timeLeft, isPlaying, toggle } = session;
  return (
    <div className="w-64 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t("games.volume")}</span>
          <span>{volume}%</span>
        </div>
        <div className="flex items-center gap-2">
          {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            aria-label={t("games.volume")}
          />
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{formatTime(timeLeft)}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          className="rounded-full"
          aria-label={isPlaying ? t("games.pause") : t("games.play")}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="text-sm text-muted-foreground">{formatTime(totalSeconds)}</span>
      </div>
    </div>
  );
}
