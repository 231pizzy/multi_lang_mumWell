import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddNewSessionDialog from "./AddNewSessionDialog";
import ViewReportDialog from "./ViewReportDialog";
import { Photo } from "@/components/Photo";
import { photos } from "@/data/photos";
import { consultationApi, getErrorMessage } from "@/lib/api";
import { dateLocale } from "@/lib/dates";

export default function HistoryList() {
  const { t, i18n } = useTranslation("consult");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    consultationApi
      .list()
      .then(setHistory)
      .catch((err) => setError(getErrorMessage(err, t("history.loadFailed"))))
      .finally(() => setLoading(false));
  }, [t]);

  const relative = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? t("common:notAvailable")
      : formatDistanceToNow(date, { addSuffix: true, locale: dateLocale(i18n.resolvedLanguage) });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) return <p className="py-8 text-center text-muted-foreground">{error}</p>;

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <Photo photo={photos.empty} className="h-28 w-28 rounded-full" />
        <h3 className="text-xl font-bold">{t("history.emptyTitle")}</h3>
        <p className="max-w-sm text-muted-foreground">{t("history.emptyBody")}</p>
        <AddNewSessionDialog variant="default" />
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("history.specialist")}</TableHead>
            <TableHead>{t("history.notes")}</TableHead>
            <TableHead>{t("history.date")}</TableHead>
            <TableHead className="text-right">{t("history.report")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.sessionId}>
              <TableCell className="font-semibold">{record.selectedDoctor?.specialist}</TableCell>
              <TableCell className="max-w-[260px] truncate text-muted-foreground">{record.notes}</TableCell>
              <TableCell className="whitespace-nowrap">{relative(record.createdOn)}</TableCell>
              <TableCell className="text-right">
                {record.report ? (
                  <ViewReportDialog record={record} />
                ) : (
                  <span className="text-xs text-muted-foreground">{t("history.noReport")}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
