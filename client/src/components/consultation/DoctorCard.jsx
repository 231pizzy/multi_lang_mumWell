import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { consultationApi, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/** A specialist card that starts a voice consultation with that specialist. */
export default function DoctorCard({ doctorAgent, notes = "Quick consultation", compact = false }) {
  const { t } = useTranslation("consult");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startConsultation = async () => {
    setLoading(true);
    try {
      const session = await consultationApi.create(notes, doctorAgent);
      navigate(`/consultation/medical-agent/${session.sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, t("startFailed")));
      setLoading(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="overflow-hidden bg-secondary">
        <img
          src={doctorAgent.image}
          alt=""
          loading="lazy"
          className={cn(
            "w-full object-cover transition-transform duration-500 group-hover:scale-105",
            compact ? "h-40" : "aspect-[4/5]",
          )}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold">{doctorAgent.specialist}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{doctorAgent.description}</p>
        <Button className="mt-4 w-full" onClick={startConsultation} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
          {loading ? t("starting") : t("start")}
        </Button>
      </div>
    </article>
  );
}
