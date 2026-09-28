import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import HistoryList from "@/components/consultation/HistoryList";

export default function ConsultationHistory() {
  const { t } = useTranslation("consult");
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4" />
        {t("history.back")}
      </Button>
      <h1 className="text-3xl font-extrabold">{t("history.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("history.intro")}</p>
      <div className="surface mt-8 p-2 sm:p-4">
        <HistoryList />
      </div>
    </div>
  );
}
