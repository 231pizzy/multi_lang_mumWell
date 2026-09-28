import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import { LANGUAGES } from "@/i18n";
import { useSession } from "@/context/SessionContext";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, updateProfile } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = async (code) => {
    setOpen(false);
    await i18n.changeLanguage(code);
    // Remember the choice on the account so AI replies, voice and emails follow it.
    if (isAuthenticated) updateProfile({ preferredLanguage: code }).catch(() => {});
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("language.choose")}: ${current.label}`}
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span>{current.flag}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("language.label")}
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border bg-popover py-1 text-popover-foreground shadow-[var(--shadow-lift)]"
        >
          {LANGUAGES.map((lang) => {
            const selected = lang.code === current.code;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  lang={lang.code}
                  onClick={() => choose(lang.code)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-secondary",
                    selected && "font-semibold text-primary",
                  )}
                >
                  {lang.label}
                  {selected && <Check className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
