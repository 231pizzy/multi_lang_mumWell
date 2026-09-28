import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getErrorMessage, notificationApi } from "@/lib/api";

const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Brussels";
  } catch {
    return "Europe/Brussels";
  }
};

// European zones first, then everything else the browser knows.
function timezoneOptions(current) {
  let zones;
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = ["UTC"];
  }
  const all = [...new Set([current, browserTimezone(), ...zones])].filter(Boolean).sort();
  return [...all.filter((z) => z.startsWith("Europe/")), ...all.filter((z) => !z.startsWith("Europe/"))];
}

const fieldClass = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm disabled:opacity-50";

export default function Notifications() {
  const { t } = useTranslation("reminders");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    notificationTime: "08:00",
    timezone: browserTimezone(),
  });

  useEffect(() => {
    notificationApi
      .get()
      .then((data) => {
        setHasProfile(data.hasProfile);
        setSettings({
          notificationsEnabled: data.notificationsEnabled,
          notificationTime: data.notificationTime,
          // New users get their own time zone rather than the server default.
          timezone: data.hasProfile ? data.timezone : browserTimezone(),
        });
      })
      .catch((error) => toast.error(getErrorMessage(error, t("loadFailed"))))
      .finally(() => setLoading(false));
  }, [t]);

  const timezones = useMemo(() => timezoneOptions(settings.timezone), [settings.timezone]);
  const update = (field) => (value) => setSettings((s) => ({ ...s, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await notificationApi.update(settings);
      toast.success(t("saved"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-soft text-coral">
        <BellRing className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-center text-3xl font-extrabold">{t("title")}</h1>
      <p className="mt-2 text-center text-muted-foreground">{t("intro")}</p>

      {!loading && !hasProfile && (
        <p className="mt-6 rounded-xl border border-primary/20 bg-sky-soft p-4 text-sm">
          <Trans t={t} i18nKey="needsProgram" components={{ link: <Link to="/program" className="font-semibold text-primary underline" /> }} />
        </p>
      )}

      <div className="relative mt-8">
        <div className={`surface space-y-6 p-6 sm:p-8 ${loading ? "pointer-events-none opacity-50 blur-[1px]" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">{t("enable")}</h2>
              <p className="text-sm text-muted-foreground">{t("enableHint")}</p>
            </div>
            <Switch checked={settings.notificationsEnabled} onCheckedChange={update("notificationsEnabled")} aria-label={t("enable")} />
          </div>

          <div>
            <label htmlFor="notification-time" className="mb-1.5 block text-sm font-semibold">
              {t("time")}
            </label>
            <input
              id="notification-time"
              type="time"
              value={settings.notificationTime}
              onChange={(e) => update("notificationTime")(e.target.value.slice(0, 5))}
              className={fieldClass}
              disabled={!settings.notificationsEnabled}
            />
          </div>

          <div>
            <label htmlFor="timezone" className="mb-1.5 block text-sm font-semibold">
              {t("timezone")}
            </label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => update("timezone")(e.target.value)}
              className={fieldClass}
              disabled={!settings.notificationsEnabled}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={save} disabled={saving || !hasProfile} className="w-full" size="lg">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : t("save")}
          </Button>
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
