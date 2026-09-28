import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";
import { AlertTriangle, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogoMark } from "@/components/brand/Logo";
import { formatDateTime } from "@/lib/dates";

function Section({ title, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className="mt-1 leading-relaxed">{value}</p>
    </div>
  );
}

function ListSection({ title, list }) {
  if (!list?.length) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-coral">
        {list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ViewReportDialog({ record }) {
  const { t, i18n } = useTranslation("consult");
  const reportRef = useRef(null);
  const report = record?.report || {};

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `MumWell-summary-${record.sessionId}`,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0">
          <FileText className="h-4 w-4" />
          {t("history.viewReport")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{t("report.title")}</DialogTitle>
        </DialogHeader>

        <div ref={reportRef} className="space-y-4 bg-background p-1 print:p-8">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-10" />
              <div>
                <p className="font-display text-xl font-bold">{t("report.title")}</p>
                <p className="text-sm text-muted-foreground">MumWell</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p>
              <span className="block text-muted-foreground">{t("report.specialist")}</span>
              <span className="font-semibold">{record?.selectedDoctor?.specialist || t("common:notAvailable")}</span>
            </p>
            <p>
              <span className="block text-muted-foreground">{t("report.date")}</span>
              <span className="font-semibold">{formatDateTime(record.createdOn, i18n.resolvedLanguage)}</span>
            </p>
            <p>
              <span className="block text-muted-foreground">{t("report.patient")}</span>
              <span className="font-semibold">{report.user || t("report.anonymous")}</span>
            </p>
          </div>

          <Section title={t("report.chiefComplaint")} value={report.chiefComplaint} />
          <Section title={t("report.summary")} value={report.summary} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title={t("report.duration")} value={report.duration} />
            <Section title={t("report.severity")} value={report.severity} />
          </div>
          <ListSection title={t("report.symptoms")} list={report.symptoms} />
          <ListSection title={t("report.medications")} list={report.medicationsMentioned} />
          <ListSection title={t("report.recommendations")} list={report.recommendations} />

          <div className="flex gap-3 rounded-xl border border-coral/40 bg-coral-soft p-4 text-sm text-accent-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>{t("report.disclaimerTitle")}: </strong>
              {t("report.disclaimer")}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            {t("report.print")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
