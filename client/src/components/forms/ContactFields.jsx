import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { callingCode, countryOptions, examplePhone, hasOwnCountryCode, phoneProblem } from "@/lib/countries";
import { cn } from "@/lib/utils";

const selectClass = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function CountrySelect({ id = "country", value, onChange, label, allowEmpty = false, required = true }) {
  const { t, i18n } = useTranslation("auth");
  const options = countryOptions(i18n.resolvedLanguage);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label ?? t("country")}
      </label>
      <select
        id={id}
        required={required}
        autoComplete="country"
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {(allowEmpty || !value) && (
          <option value="" disabled={!allowEmpty}>
            {t("countryPlaceholder")}
          </option>
        )}
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PhoneField({ id = "phone", value, onChange, country, required = true, showHint = true }) {
  const { t } = useTranslation("auth");
  // The country code is shown in front of the field; once she types her own "+…" it is hidden
  // so the number never looks like "+234 +234…".
  const dial = hasOwnCountryCode(value) ? "" : callingCode(country);
  const problem = value?.trim() ? phoneProblem(value, country) : null;
  const invalid = Boolean(problem);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {t("phone")}
      </label>
      <div className="relative">
        <Phone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        {dial && (
          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            {dial}
          </span>
        )}
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          maxLength={30}
          placeholder={examplePhone(country) || t("phonePlaceholder")}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          className={cn(dial ? "pl-[4.75rem]" : "pl-11", invalid && "border-destructive")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p id={`${id}-hint`} className={cn("mt-1.5 text-xs", invalid ? "text-destructive" : "text-muted-foreground")}>
        {problem === "mismatch" ? t("phoneCountryMismatch") : invalid ? t("invalidPhone") : showHint ? t("phoneHint") : null}
      </p>
    </div>
  );
}
