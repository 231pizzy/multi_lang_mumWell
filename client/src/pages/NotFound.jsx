import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-coral">404</p>
      <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFound.body")}</p>
      <Button asChild className="mt-2">
        <Link to="/">{t("actions.backHome")}</Link>
      </Button>
    </div>
  );
}
