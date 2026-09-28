import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import HistoryList from "@/components/consultation/HistoryList";
import DoctorsAgentList from "@/components/consultation/DoctorsAgentList";
import AddNewSessionDialog from "@/components/consultation/AddNewSessionDialog";

export default function ConsultationDashboard() {
  const { t } = useTranslation("consult");
  const steps = t("dashboard.how", { returnObjects: true });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-sky-soft p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-coral/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">{t("dashboard.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{t("dashboard.title")}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t("dashboard.intro")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AddNewSessionDialog />
            <Button asChild variant="outline" size="lg">
              <Link to="/consultation/history">
                <Clock className="h-5 w-5" />
                {t("dashboard.history")}
              </Link>
            </Button>
          </div>
        </div>
        <ol className="relative mt-8 grid gap-3 sm:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-2xl bg-card/80 p-3 text-sm font-medium">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="surface p-2 sm:p-4">
        <HistoryList />
      </section>

      <DoctorsAgentList />
    </div>
  );
}
