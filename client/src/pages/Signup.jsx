import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthField, FormError } from "@/components/AuthCard";
import { ConsentFields } from "@/components/legal/ConsentFields";
import { useSession } from "@/context/SessionContext";
import { getErrorMessage } from "@/lib/api";
import { allConsentsGiven, emptyConsents } from "@/lib/consents";
import { LANGUAGES } from "@/i18n";
import { CountrySelect, PhoneField } from "@/components/forms/ContactFields";
import { browserCountry, phoneProblem } from "@/lib/countries";

const MIN_PASSWORD_LENGTH = 8;

export default function Signup() {
  const { t, i18n } = useTranslation(["auth", "common"]);
  const { register } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [country, setCountry] = useState(browserCountry);
  const [phone, setPhone] = useState("");
  const [consents, setConsents] = useState(emptyConsents);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const language = i18n.resolvedLanguage;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordTooShort", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }
    if (!country) {
      setError(t("countryRequired"));
      return;
    }
    const problem = phoneProblem(phone, country);
    if (problem) {
      setError(t(problem === "mismatch" ? "phoneCountryMismatch" : "invalidPhone"));
      return;
    }
    if (!allConsentsGiven(consents)) {
      setError(t("common:consent.required"));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        country,
        phone: phone.trim(),
        preferredLanguage: language,
        acceptTerms: consents.terms,
        healthDataConsent: consents.health,
        ageConfirmed: consents.age,
      });
      toast.success(t("signup.welcome"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("signup.failed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t("signup.title")} subtitle={t("signup.subtitle")}>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate={false}>
        <AuthField
          id="name"
          label={t("name")}
          icon={User}
          autoComplete="name"
          maxLength={100}
          placeholder={t("namePlaceholder")}
          value={form.name}
          onChange={update("name")}
        />
        <AuthField
          id="email"
          label={t("email")}
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={form.email}
          onChange={update("email")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="password"
            label={t("password")}
            icon={Lock}
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={t("newPasswordPlaceholder", { min: MIN_PASSWORD_LENGTH })}
            value={form.password}
            onChange={update("password")}
          />
          <AuthField
            id="confirmPassword"
            label={t("confirmPassword")}
            icon={Lock}
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CountrySelect value={country} onChange={setCountry} />
          <PhoneField value={phone} onChange={setPhone} country={country} showHint={false} />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">{t("phoneHint")}</p>

        <div>
          <label htmlFor="language" className="mb-1.5 block text-sm font-semibold">
            {t("signup.language")}
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("signup.languageHint")}</p>
        </div>

        <ConsentFields value={consents} onChange={setConsents} />

        <FormError>{error}</FormError>
        <Button className="w-full" size="lg" type="submit" disabled={loading || !allConsentsGiven(consents)}>
          {loading ? t("signup.submitting") : t("signup.submit")}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("signup.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          {t("signup.signIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
