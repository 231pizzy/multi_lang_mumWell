import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { getErrorMessage } from "@/lib/api";
import { ConsentFields } from "./ConsentFields";
import { allConsentsGiven, emptyConsents, hasContactDetails, hasRequiredConsents } from "@/lib/consents";
import { CountrySelect, PhoneField } from "@/components/forms/ContactFields";
import { browserCountry, isValidPhone } from "@/lib/countries";

/**
 * Shown to signed-in users who haven't given the current consents or have no phone number and
 * country on file (accounts created before these were collected at sign-up).
 */
export function ConsentGate() {
  const { t } = useTranslation(["common", "auth"]);
  const { user, acceptConsents, updateProfile, logout } = useSession();
  const needsConsent = !hasRequiredConsents(user);
  const needsContact = !hasContactDetails(user);
  const [consents, setConsents] = useState(emptyConsents);
  const [country, setCountry] = useState(() => user?.country || browserCountry());
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const contactReady = !needsContact || (country && isValidPhone(phone, country));
  const ready = (!needsConsent || allConsentsGiven(consents)) && contactReady;

  const submit = async () => {
    setSaving(true);
    try {
      if (needsContact) await updateProfile({ country, phone: phone.trim() });
      if (needsConsent) await acceptConsents({ acceptTerms: true, healthDataConsent: true, ageConfirmed: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
      <div className="surface w-full space-y-6 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-soft text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("consentGate.title")}</h1>
          <p className="text-muted-foreground">{t("consentGate.body")}</p>
        </div>
        {needsContact && (
          <div className="space-y-4 rounded-2xl border bg-background p-4">
            <CountrySelect id="gate-country" value={country} onChange={setCountry} />
            <PhoneField id="gate-phone" value={phone} onChange={setPhone} country={country} />
          </div>
        )}
        {needsConsent && <ConsentFields value={consents} onChange={setConsents} />}
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button onClick={submit} disabled={!ready || saving} className="sm:flex-1">
            {saving ? t("actions.saving") : t("consentGate.confirm")}
          </Button>
          <Button variant="ghost" onClick={logout}>
            {t("consentGate.signOutInstead")}
          </Button>
        </div>
      </div>
    </div>
  );
}
