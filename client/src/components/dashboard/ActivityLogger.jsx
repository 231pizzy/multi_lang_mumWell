import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage, trackingApi } from "@/lib/api";

const ACTIVITY_TYPES = ["meditation", "exercise", "walking", "reading", "journaling", "therapy"];

const emptyForm = { type: "", name: "", duration: "", description: "" };

export function ActivityLogger({ open, onOpenChange, onActivityLogged }) {
  const { t } = useTranslation(["dashboard", "common"]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const update = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.type || !form.name.trim()) {
      toast.error(t("activity.required"));
      return;
    }
    setSaving(true);
    try {
      await trackingApi.logActivity({
        type: form.type,
        name: form.name.trim(),
        duration: form.duration === "" ? undefined : Number(form.duration),
        description: form.description.trim() || undefined,
      });
      toast.success(t("activity.saved"));
      setForm(emptyForm);
      onOpenChange(false);
      await onActivityLogged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, t("activity.failed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("activity.title")}</DialogTitle>
          <DialogDescription>{t("activity.subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-type">{t("activity.type")}</Label>
            <Select value={form.type} onValueChange={update("type")}>
              <SelectTrigger id="activity-type" className="w-full">
                <SelectValue placeholder={t("activity.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`activity.types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-name">{t("activity.name")}</Label>
            <Input
              id="activity-name"
              value={form.name}
              maxLength={200}
              onChange={(e) => update("name")(e.target.value)}
              placeholder={t("activity.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-duration">{t("activity.duration")}</Label>
            <Input
              id="activity-duration"
              type="number"
              min={0}
              max={1440}
              value={form.duration}
              onChange={(e) => update("duration")(e.target.value)}
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-description">{t("activity.description")}</Label>
            <Input
              id="activity-description"
              value={form.description}
              maxLength={1000}
              onChange={(e) => update("description")(e.target.value)}
              placeholder={t("activity.descriptionPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("activity.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
