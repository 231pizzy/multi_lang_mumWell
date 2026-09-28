import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthField, FormError } from "@/components/AuthCard";
import { authApi, getErrorMessage } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const { t } = useTranslation("auth");
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordTooShort", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsDontMatch"));
      return;
    }
    setLoading(true);
    try {
      const { message } = await authApi.resetPassword(token, password);
      toast.success(message);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title={t("reset.invalidTitle")} subtitle={t("reset.invalidBody")}>
        <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
          {t("reset.requestNew")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("reset.title")}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          id="password"
          label={t("reset.newPassword")}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          placeholder={t("newPasswordPlaceholder", { min: MIN_PASSWORD_LENGTH })}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          id="confirmPassword"
          label={t("reset.confirmNew")}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <FormError>{error}</FormError>
        <Button className="w-full" size="lg" type="submit" disabled={loading}>
          {loading ? t("reset.submitting") : t("reset.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
