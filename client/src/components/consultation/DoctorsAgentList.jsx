import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import DoctorCard from "./DoctorCard";
import { consultationApi, getErrorMessage } from "@/lib/api";

export default function DoctorsAgentList() {
  const { t, i18n } = useTranslation("consult");
  const [state, setState] = useState({ doctors: [], loading: true, error: null, lang: null });
  const lang = i18n.resolvedLanguage;

  // Reload when the language changes so titles and voices match it.
  useEffect(() => {
    let active = true;
    consultationApi
      .doctors()
      .then((doctors) => active && setState({ doctors, loading: false, error: null, lang }))
      .catch((err) => active && setState({ doctors: [], loading: false, error: getErrorMessage(err, t("loadSpecialistsFailed")), lang }));
    return () => {
      active = false;
    };
  }, [lang, t]);

  const loading = state.loading || state.lang !== lang;

  return (
    <section aria-labelledby="specialists-title">
      <h2 id="specialists-title" className="text-2xl font-bold">
        {t("dashboard.specialists")}
      </h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : state.error ? (
        <p className="mt-4 text-muted-foreground">{state.error}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 lg:gap-6">
          {state.doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctorAgent={doctor} />
          ))}
        </div>
      )}
    </section>
  );
}
