import { cn } from "@/lib/utils";
import { MOOD_ICONS } from "@/lib/moodScales";

// From "needs care" (violet) through neutral (magenta) to "doing well" (teal).
const TONES = [
  "text-[#6a4fd0] bg-[#efeafd] dark:text-[#b8a8ff] dark:bg-[#2a2350]",
  "text-[#8c4fc0] bg-[#f4e9fb] dark:text-[#d0a6f0] dark:bg-[#33204a]",
  "text-[#a8409a] bg-[#fbe8f5] dark:text-[#f0a0dc] dark:bg-[#3a1d3c]",
  "text-[#1f7563] bg-[#e3f4ef] dark:text-[#7fd1bb] dark:bg-[#13302a]",
  "text-[#1a6656] bg-[#d5efe7] dark:text-[#8fe0c9] dark:bg-[#13302a]",
];

/** A tinted icon tile for position `index` (0–4) on a wellbeing scale. */
export function MoodGlyph({ index, icons = MOOD_ICONS, reverseTone = false, className, iconClassName }) {
  const Icon = icons[index];
  const tone = TONES[reverseTone ? 4 - index : index];
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform", tone, className)}
    >
      <Icon className={cn("h-7 w-7", iconClassName)} />
    </span>
  );
}
