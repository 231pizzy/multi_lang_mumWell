import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const WEEK_OPTIONS = Array.from({ length: 52 }, (_, i) => i + 1);
const SUPPORT_OPTIONS = ["partner", "family", "friends"];
const selectClass = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";

function Choice({ selected, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors",
        selected ? "border-primary bg-secondary text-primary" : "border-border bg-card hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function YesNo({ value, onChange, label }) {
  const { t } = useTranslation("program");
  return (
    <div className="flex gap-3" role="radiogroup" aria-label={label}>
      <Choice selected={value === true} onClick={() => onChange(true)}>
        {t("setup.yes")}
      </Choice>
      <Choice selected={value === false} onClick={() => onChange(false)}>
        {t("setup.no")}
      </Choice>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
          {label}
        </label>
      ) : (
        <p className="mb-1.5 text-sm font-semibold">{label}</p>
      )}
      {children}
    </div>
  );
}

export function ProgramSetupForm({ defaultName = "", submitting, onSubmit }) {
  const { t } = useTranslation(["program", "common"]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: defaultName,
    age: "",
    isPregnant: false,
    numberOfChildren: "1",
    supportSystem: { partner: false, family: false, friends: false, other: "" },
    hasMentalHealthHistory: false,
    mentalHealthNotes: "",
    deliveryType: "",
    postpartumWeeks: "",
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setSupport = (field, value) => setForm((f) => ({ ...f, supportSystem: { ...f.supportSystem, [field]: value } }));
  const ageValid = Number(form.age) >= 18 && Number(form.age) <= 70;

  const submit = () =>
    onSubmit({
      ...form,
      name: form.name.trim(),
      age: Number(form.age),
      numberOfChildren: Number(form.numberOfChildren) || 0,
      postpartumWeeks: form.postpartumWeeks === "" ? null : Number(form.postpartumWeeks),
    });

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold">{t("setup.title")}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("setup.intro")}</p>
      </div>

      <div className="mb-6 flex items-center gap-2" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-1.5 flex-1 rounded-full", n <= step ? "bg-coral" : "bg-border")} />
        ))}
      </div>
      <p className="mb-4 text-sm font-medium text-muted-foreground">{t("setup.step", { step })}</p>

      <div className="surface space-y-6 p-6 sm:p-8 animate-fadeIn" key={step}>
        {step === 1 && (
          <>
            <Field label={t("setup.name")} htmlFor="name">
              <Input id="name" value={form.name} maxLength={255} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label={t("setup.age")} htmlFor="age">
              <Input id="age" type="number" min={18} max={70} value={form.age} onChange={(e) => set("age", e.target.value)} />
              {form.age !== "" && !ageValid && <p className="mt-1.5 text-sm text-destructive">{t("setup.ageError")}</p>}
            </Field>
            <Button className="w-full" size="lg" disabled={!form.name.trim() || !ageValid} onClick={() => setStep(2)}>
              {t("common:actions.continue")}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Field label={t("setup.pregnant")}>
              <YesNo label={t("setup.pregnant")} value={form.isPregnant} onChange={(v) => set("isPregnant", v)} />
            </Field>
            <Field label={t("setup.children")} htmlFor="children">
              <Input
                id="children"
                type="number"
                min={0}
                max={20}
                value={form.numberOfChildren}
                onChange={(e) => set("numberOfChildren", e.target.value)}
              />
            </Field>
            <Field label={t("setup.support")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {SUPPORT_OPTIONS.map((key) => {
                  const checked = form.supportSystem[key];
                  return (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors",
                        checked ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setSupport(key, e.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                        )}
                      >
                        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      {t(`setup.supportOptions.${key}`)}
                    </label>
                  );
                })}
              </div>
              <Input
                aria-label={t("setup.supportOther")}
                placeholder={t("setup.supportOther")}
                maxLength={200}
                className="mt-3"
                value={form.supportSystem.other}
                onChange={(e) => setSupport("other", e.target.value)}
              />
            </Field>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t("common:actions.back")}
              </Button>
              <Button onClick={() => setStep(3)}>{t("common:actions.continue")}</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Field label={t("setup.history")}>
              <YesNo
                label={t("setup.history")}
                value={form.hasMentalHealthHistory}
                onChange={(v) => set("hasMentalHealthHistory", v)}
              />
            </Field>
            {form.hasMentalHealthHistory && (
              <Field label={t("setup.historyNotes")} htmlFor="notes">
                <textarea
                  id="notes"
                  maxLength={2000}
                  rows={3}
                  value={form.mentalHealthNotes}
                  onChange={(e) => set("mentalHealthNotes", e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-3 text-sm"
                />
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("setup.delivery")} htmlFor="delivery">
                <select id="delivery" value={form.deliveryType} onChange={(e) => set("deliveryType", e.target.value)} className={selectClass}>
                  <option value="">{t("setup.deliveryPlaceholder")}</option>
                  <option value="vaginal">{t("setup.deliveryOptions.vaginal")}</option>
                  <option value="c-section">{t("setup.deliveryOptions.c-section")}</option>
                </select>
              </Field>
              <Field label={t("setup.weeks")} htmlFor="weeks">
                <select id="weeks" value={form.postpartumWeeks} onChange={(e) => set("postpartumWeeks", e.target.value)} className={selectClass}>
                  <option value="">{t("setup.weeksPlaceholder")}</option>
                  {WEEK_OPTIONS.map((week) => (
                    <option key={week} value={week}>
                      {t("setup.week", { week })}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
              {t("setup.privacy")}
            </p>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                {t("common:actions.back")}
              </Button>
              <Button variant="coral" onClick={submit} disabled={submitting}>
                {submitting ? t("setup.creating") : t("setup.create")}
              </Button>
            </div>
          </>
        )}
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Heart className="h-4 w-4 text-coral" />
        {t("setup.footer")}
      </p>
    </div>
  );
}
