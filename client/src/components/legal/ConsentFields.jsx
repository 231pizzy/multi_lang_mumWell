import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({ id, checked, onChange, children }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </label>
  );
}

/** The three separate, un-ticked consents GDPR requires (Art. 7 and Art. 9(2)(a)). */
export function ConsentFields({ value, onChange }) {
  const { t } = useTranslation();
  const set = (key) => (checked) => onChange({ ...value, [key]: checked });
  const linkClass = "font-medium text-primary underline underline-offset-2";

  return (
    <fieldset className="space-y-3 rounded-xl border bg-secondary/40 p-4">
      <Checkbox id="consent-terms" checked={value.terms} onChange={set("terms")}>
        <Trans
          i18nKey="consent.terms"
          components={{
            terms: <Link to="/terms" target="_blank" className={linkClass} />,
            privacy: <Link to="/privacy" target="_blank" className={linkClass} />,
          }}
        />
      </Checkbox>
      <Checkbox id="consent-health" checked={value.health} onChange={set("health")}>
        {t("consent.health")}
      </Checkbox>
      <Checkbox id="consent-age" checked={value.age} onChange={set("age")}>
        {t("consent.age")}
      </Checkbox>
    </fieldset>
  );
}
