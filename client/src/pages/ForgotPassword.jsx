import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthField, FormError } from "@/components/AuthCard";
import { authApi, getErrorMessage } from "@/lib/api";

export default function ForgotPassword() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { message } = await authApi.forgotPassword(email.trim());
      setSentMessage(message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      {sentMessage ? (
        <div className="surface flex flex-col items-center gap-4 p-8 text-center">
          <MailCheck className="h-12 w-12 text-sage" />
          <p>{sentMessage}</p>
          <p className="text-sm text-muted-foreground">{t("forgot.checkSpam")}</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <AuthField
            id="email"
            label={t("email")}
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormError>{error}</FormError>
          <Button className="w-full" size="lg" type="submit" disabled={loading}>
            {loading ? t("forgot.submitting") : t("forgot.submit")}
          </Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          {t("forgot.backToSignIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
