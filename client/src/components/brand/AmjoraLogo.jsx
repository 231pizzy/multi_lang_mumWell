import { cn } from "@/lib/utils";

/** Amjora mark: the company that owns and operates MumWell. */
export function AmjoraMark({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-7 w-7 rounded-md dark:ring-1 dark:ring-white/20", className)} aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#0A0545" />
      <path d="M24 8L6 40H14.5L24 23L33.5 40H42L24 8Z" fill="#ffffff" />
      <path d="M27.5 29L22 40H30.5L33 35L27.5 29Z" fill="#2DD4FF" />
    </svg>
  );
}
