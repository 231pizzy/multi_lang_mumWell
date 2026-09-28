import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Download, KeyRound, Loader2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/context/SessionContext";
import { LANGUAGES } from "@/i18n";
import { accountApi, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { CountrySelect, PhoneField } from "@/components/forms/ContactFields";
import { phoneProblem } from "@/lib/countries";

const MIN_PASSWORD_LENGTH = 8;
const selectClass = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";

function Card({ icon: Icon, title, children, tone = "bg-sky-soft text-primary" }) {
  return (
    <section className="surface p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-lg font-bold">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children}
    </label>
  );
}

function ProfileCard() {
  const { t, i18n } = useTranslation(["account", "common"]);
  const { user, updateProfile } = useSession();
  const [form, setForm] = useState({
    name: user.name,
    preferredLanguage: user.preferredLanguage || i18n.resolvedLanguage,
    country: user.country || "",
    phone: user.phone || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const problem = form.phone.trim() ? phoneProblem(form.phone, form.country) : null;
      if (problem) {
        toast.error(t(problem === "mismatch" ? "auth:phoneCountryMismatch" : "auth:invalidPhone"));
        return;
      }
      await updateProfile({
        name: form.name.trim(),
        preferredLanguage: form.preferredLanguage,
        ...(form.country ? { country: form.country } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      if (form.preferredLanguage !== i18n.resolvedLanguage) await i18n.changeLanguage(form.preferredLanguage);
      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card icon={UserRound} title={t("profile.title")}>
      <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">{t("profile.name")}</Label>
          <Input id="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="email">{t("profile.email")}</Label>
          <Input id="email" value={user.email} disabled readOnly />
        </div>
        <div>
          <Label htmlFor="language">{t("profile.language")}</Label>
          <select
            id="language"
            className={selectClass}
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("profile.languageHint")}</p>
        </div>
        <CountrySelect
          label={t("profile.country")}
          value={form.country}
          onChange={(country) => setForm({ ...form, country })}
          required={false}
        />
        <PhoneField
          value={form.phone}
          country={form.country}
          onChange={(phone) => setForm({ ...form, phone })}
          required={false}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("profile.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation(["account", "auth"]);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.next.length < MIN_PASSWORD_LENGTH) {
      toast.error(t("auth:passwordTooShort", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (form.next !== form.confirm) {
      toast.error(t("password.mismatch"));
      return;
    }
    setSaving(true);
    try {
      const { message } = await accountApi.changePassword(form.current, form.next);
      toast.success(message);
      setForm({ current: "", next: "", confirm: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card icon={KeyRound} title={t("password.title")}>
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-3">
        {[
          ["current", "current-password", t("password.current")],
          ["next", "new-password", t("password.new")],
          ["confirm", "new-password", t("password.confirm")],
        ].map(([key, autoComplete, label]) => (
          <div key={key}>
            <Label htmlFor={`pw-${key}`}>{label}</Label>
            <Input
              id={`pw-${key}`}
              type="password"
              required
              autoComplete={autoComplete}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("password.submit")}
          </Button>
          <span className="text-xs text-muted-foreground">{t("password.otherSessions")}</span>
        </div>
      </form>
    </Card>
  );
}

function ConsentsCard() {
  const { t, i18n } = useTranslation("account");
  const { user } = useSession();
  const rows = [
    [t("consents.terms"), user.consents?.terms?.acceptedAt],
    [t("consents.health"), user.consents?.healthData?.acceptedAt],
    [t("consents.age"), user.consents?.ageConfirmedAt],
  ];
  return (
    <Card icon={ShieldCheck} title={t("consents.title")} tone="bg-sage-soft text-sage">
      <ul className="space-y-3">
        {rows.map(([label, date]) => (
          <li key={label} className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4 text-sm">
            <span className="flex items-start gap-2 font-medium">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
              {label}
            </span>
            {date && (
              <span className="shrink-0 text-muted-foreground">
                {t("consents.given", { date: formatDate(date, i18n.resolvedLanguage) })}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">{t("consents.withdraw")}</p>
    </Card>
  );
}

function DataCard() {
  const { t } = useTranslation("account");
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const data = await accountApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mumwell-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("data.downloaded"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card icon={Download} title={t("data.title")}>
      <p className="text-sm text-muted-foreground">{t("data.body")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("data.retention")}</p>
      <Button variant="outline" className="mt-5" onClick={download} disabled={downloading}>
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {downloading ? t("data.downloading") : t("data.download")}
      </Button>
    </Card>
  );
}

function DeleteCard() {
  const { t } = useTranslation(["account", "common"]);
  const { clearSession } = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async (event) => {
    event.preventDefault();
    setDeleting(true);
    try {
      const { message } = await accountApi.deleteAccount(password);
      clearSession();
      toast.success(message || t("delete.done"));
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDeleting(false);
    }
  };

  return (
    <Card icon={Trash2} title={t("delete.title")} tone="bg-destructive/10 text-destructive">
      <p className="text-sm text-muted-foreground">{t("delete.body")}</p>
      <Dialog onOpenChange={(open) => !open && setPassword("")}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="mt-5">
            <Trash2 className="h-4 w-4" />
            {t("delete.button")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={confirmDelete} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{t("delete.confirmTitle")}</DialogTitle>
              <DialogDescription>{t("delete.confirmBody")}</DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="delete-password">{t("delete.password")}</Label>
              <Input
                id="delete-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("common:actions.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={!password || deleting}>
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? t("delete.deleting") : t("delete.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function Account() {
  const { t } = useTranslation("account");
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("intro")}</p>
      </div>
      <ProfileCard />
      <PasswordCard />
      <ConsentsCard />
      <DataCard />
      <DeleteCard />
    </div>
  );
}
