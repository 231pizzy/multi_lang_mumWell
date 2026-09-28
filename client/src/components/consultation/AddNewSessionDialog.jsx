import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { consultationApi, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

function SuggestedDoctorCard({ doctor, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doctor)}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-colors",
        selected ? "border-primary bg-secondary" : "border-border hover:border-primary/40",
      )}
    >
      <img src={doctor.image} alt="" className="h-24 w-24 rounded-2xl object-cover" />
      <h3 className="mt-3 text-sm font-bold">{doctor.specialist}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doctor.description}</p>
    </button>
  );
}

export default function AddNewSessionDialog({ variant = "coral" }) {
  const { t } = useTranslation(["consult", "common"]);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedDoctors, setSuggestedDoctors] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const reset = () => {
    setNote("");
    setSuggestedDoctors(null);
    setSelectedDoctor(null);
    setLoading(false);
  };

  const findDoctors = async () => {
    setLoading(true);
    try {
      const doctors = await consultationApi.suggest(note.trim());
      setSuggestedDoctors(doctors);
      setSelectedDoctor(doctors[0] ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("newDialog.suggestFailed")));
    } finally {
      setLoading(false);
    }
  };

  const startConsultation = async () => {
    setLoading(true);
    try {
      const session = await consultationApi.create(note.trim(), selectedDoctor);
      navigate(`/consultation/medical-agent/${session.sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, t("startFailed")));
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} size="lg">
          <Plus className="h-5 w-5" />
          {t("newDialog.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{suggestedDoctors ? t("newDialog.chooseTitle") : t("newDialog.detailsTitle")}</DialogTitle>
          <DialogDescription>
            {suggestedDoctors ? t("newDialog.chooseBody") : t("newDialog.detailsBody")}
          </DialogDescription>
        </DialogHeader>

        {!suggestedDoctors ? (
          <Textarea
            placeholder={t("newDialog.detailsPlaceholder")}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[160px]"
            aria-label={t("newDialog.detailsLabel")}
          />
        ) : (
          <div className="grid max-h-[360px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {suggestedDoctors.map((doctor) => (
              <SuggestedDoctorCard
                key={doctor.id}
                doctor={doctor}
                selected={selectedDoctor?.id === doctor.id}
                onSelect={setSelectedDoctor}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("common:actions.cancel")}</Button>
          </DialogClose>
          {!suggestedDoctors ? (
            <Button disabled={!note.trim() || loading} onClick={findDoctors}>
              {loading ? t("newDialog.processing") : t("newDialog.next")}
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          ) : (
            <Button onClick={startConsultation} disabled={loading || !selectedDoctor}>
              {loading ? t("starting") : t("start")}
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
