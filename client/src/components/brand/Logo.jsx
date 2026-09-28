import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * MumWell mark: a heart holding a parent cradling her child, crowned by a
 * smaller heart, drawn in one purple-to-pink gradient line.
 */
export function LogoMark({ className }) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-9 w-9", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="44" x2="58" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--logo-from)" />
          <stop offset="0.55" stopColor="var(--logo-mid)" />
          <stop offset="1" stopColor="var(--logo-to)" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradientId})`} strokeWidth="3.4">
        <path d="M26 19.8C23.8 16.8 20.6 14.8 17 14.8 10.4 14.8 5.5 20 5.5 26.8c0 9.7 10.5 18.2 26.5 31.7 16-13.5 26.5-22 26.5-31.7 0-6.8-4.9-12-11.5-12-3.6 0-6.8 2-9 5" />
        <path d="M32 23.5c-5-3.6-10.5-7.4-10.5-12.4 0-3.6 2.7-6.1 5.8-6.1 2.1 0 3.8 1.1 4.7 2.8.9-1.7 2.6-2.8 4.7-2.8 3.1 0 5.8 2.5 5.8 6.1 0 5-5.5 8.8-10.5 12.4" />
        <circle cx="31" cy="31.5" r="4" />
        <path d="M27.2 37.8c-3.8 1.9-6.1 6-6.9 11.4" />
        <path d="M35 37.4c4.3 1.1 7.2 5.2 8.3 10.9" />
        <path d="M25.4 41.8c3.2 4.1 8.2 4.4 11.4.6" />
      </g>
    </svg>
  );
}

export function Logo({ className, markClassName, tagline, taglineClassName }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("h-10 w-10", markClassName)} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.4rem] font-bold tracking-tight text-[var(--brand-ink)]">MumWell</span>
        {tagline && (
          <span className={cn("mt-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted-foreground", taglineClassName)}>
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
