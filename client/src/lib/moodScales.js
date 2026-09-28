import {
  Annoyed,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Frown,
  Laugh,
  Meh,
  Smile,
  Zap,
} from "lucide-react";

// Five-step scales drawn as icons instead of emoji, so they render the same on every
// platform and follow the brand palette. Index 0 is the lowest value on the slider.
export const MOOD_ICONS = [Frown, Annoyed, Meh, Smile, Laugh];
export const SCALE_ICONS = {
  mood: MOOD_ICONS,
  stress: [Laugh, Smile, Meh, Annoyed, Frown], // low stress is the good end
  sleep: MOOD_ICONS,
  energy: [BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, Zap],
};
