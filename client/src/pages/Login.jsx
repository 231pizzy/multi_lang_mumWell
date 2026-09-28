import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthField, FormError } from "@/components/AuthCard";
import { useSession } from "@/context/SessionContext";
import { getErrorMessage } from "@/lib/api";

export default function Login() {
  const { t } = useTranslation("auth");
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("login.failed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t("login.title")} subtitle={t("login.subtitle")}>
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
        <AuthField
          id="password"
          label={t("password")}
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            {t("login.forgot")}
          </Link>
        </div>
        <FormError>{error}</FormError>
        <Button className="w-full" size="lg" type="submit" disabled={loading}>
          {loading ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          {t("login.createAccount")}
        </Link>
      </p>
    </AuthCard>
  );
}
