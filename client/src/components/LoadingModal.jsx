import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function LoadingModal({ isOpen }) {
  const { t } = useTranslation("program");
  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="flex flex-col items-center p-10 sm:max-w-lg"
      >
        <DialogHeader className="items-center text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-coral" />
          <DialogTitle className="text-2xl">{t("pleaseWait")}</DialogTitle>
          <DialogDescription className="text-base">{t("generating")}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
