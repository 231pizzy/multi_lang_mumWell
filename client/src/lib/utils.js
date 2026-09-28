import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Today's date as "YYYY-MM-DD" in UTC — matches the server's wellness entry keys. */
export const utcDateKey = (date = new Date()) => date.toISOString().slice(0, 10);
