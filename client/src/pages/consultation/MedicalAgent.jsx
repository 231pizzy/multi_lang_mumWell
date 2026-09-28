import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VapiModule from "@vapi-ai/web";
import { Info, Loader2, Mic, PhoneCall, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { consultationApi, getErrorMessage } from "@/lib/api";
import { assistantConfig } from "@/lib/voice";
import { cn } from "@/lib/utils";
import { CrisisResources } from "@/components/CrisisResources";

// Sent to the voice AI mid-call when MumWell's own check flags a crisis, so it follows its
// safety protocol even if the model missed the signs.
const CRISIS_SYSTEM_MESSAGE =
  "SAFETY ALERT from MumWell: the caller may be in crisis. Follow your safety protocol now: respond calmly and warmly, " +
  "encourage her to call her local emergency number or a crisis line and to reach someone she trusts nearby. " +
  "Then, once and without pressure, follow your guidance on contact details. If she declines, do not ask again.";

// @vapi-ai/web is CommonJS (`exports.default = Vapi`), so the default import can arrive wrapped.
const Vapi = VapiModule.default ?? VapiModule;
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;

const formatTimer = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

export default function MedicalAgent() {
  const { t } = useTranslation(["consult", "common"]);
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | connecting | active | ending
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState({ role: null, text: "" });
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [crisis, setCrisis] = useState(false);

  const vapiRef = useRef(null);
  const messagesRef = useRef([]);
  const reportStartedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const statusRef = useRef(status);
  const lastAssistantLineRef = useRef("");
  const crisisRef = useRef(false);

  useEffect(() => {
    consultationApi
      .get(sessionId)
      .then(setSession)
      .catch((error) => setLoadError(getErrorMessage(error, t("call.loadFailed"))));
  }, [sessionId, t]);

  // Scroll only the transcript box, not the page.
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, liveTranscript]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status !== "active") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Generate the summary once, however the call ended.
  const finishCall = useCallback(async () => {
    if (reportStartedRef.current) return;
    reportStartedRef.current = true;
    setStatus("ending");

    const transcript = messagesRef.current;
    if (transcript.length === 0) {
      toast.info(t("call.empty"));
      navigate("/consultation", { replace: true });
      return;
    }
    try {
      await consultationApi.report(sessionId, transcript);
      toast.success(t("call.reportReady"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("call.reportFailed")));
    }
    navigate("/consultation", { replace: true });
  }, [navigate, sessionId, t]);

  // Stop the call if the user leaves the page mid-call.
  useEffect(
    () => () => {
      vapiRef.current?.removeAllListeners?.();
      vapiRef.current?.stop();
      vapiRef.current = null;
    },
    [],
  );

  // Each finished sentence she speaks is checked on the server straight away, so the helpline
  // is alerted during the call rather than after it.
  const checkLine = (vapi, text) => {
    consultationApi
      .utterance(sessionId, text, lastAssistantLineRef.current || undefined)
      .then(({ newCrisis }) => {
        if (!newCrisis || crisisRef.current) return;
        crisisRef.current = true;
        setCrisis(true);
        try {
          vapi.send({ type: "add-message", message: { role: "system", content: CRISIS_SYSTEM_MESSAGE } });
        } catch (error) {
          console.error("Could not update the voice assistant", error);
        }
      })
      .catch(() => {}); // the end-of-call report re-checks the whole transcript
  };

  const startCall = () => {
    if (!session?.selectedDoctor) return;
    if (!VAPI_PUBLIC_KEY) {
      toast.error(t("call.notConfigured"));
      return;
    }

    setStatus("connecting");
    reportStartedRef.current = false;
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setStatus("active"));
    vapi.on("call-end", () => finishCall());
    vapi.on("speech-start", () => setAssistantSpeaking(true));
    vapi.on("speech-end", () => setAssistantSpeaking(false));
    vapi.on("message", (message) => {
      if (message.type !== "transcript") return;
      const { role, transcriptType, transcript } = message;
      if (transcriptType === "partial") {
        setLiveTranscript({ role, text: transcript });
      } else if (transcriptType === "final") {
        messagesRef.current = [...messagesRef.current, { role, text: transcript }];
        setMessages(messagesRef.current);
        setLiveTranscript({ role: null, text: "" });
        if (role === "user") checkLine(vapi, transcript);
        else lastAssistantLineRef.current = transcript;
      }
    });
    vapi.on("error", (error) => {
      console.error("Vapi error", error);
      if (statusRef.current === "connecting") {
        toast.error(t("call.connectError"));
        setStatus("idle");
      }
    });

    vapi.start(assistantConfig(session.selectedDoctor)).catch((error) => {
      console.error("Vapi start failed", error);
      toast.error(t("call.micError"));
      setStatus("idle");
    });
  };

  const endCall = () => {
    setStatus("ending");
    vapiRef.current?.stop(); // triggers "call-end" → finishCall
    setTimeout(finishCall, 3000); // fallback if the SDK doesn't emit call-end
  };

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">{loadError}</p>
        <Button asChild>
          <Link to="/consultation">{t("call.backToList")}</Link>
        </Button>
      </div>
    );
  }

  const doctor = session?.selectedDoctor;
  const connected = status === "active";
  const statusLabel =
    status === "connecting" ? t("call.connecting") : connected ? t("call.connected") : t("call.notConnected");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {crisis && <CrisisResources compact className="mb-6" />}
      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("h-2.5 w-2.5 rounded-full", connected ? "bg-sage animate-pulse" : "bg-muted-foreground/40")} />
            {statusLabel}
          </p>
          <p className="font-display text-lg font-bold tabular-nums">{formatTimer(seconds)}</p>
        </div>

        {!session ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col items-center bg-gradient-to-b from-sky-soft to-card px-6 pb-10 pt-12">
            <div className="relative">
              {assistantSpeaking && <span className="absolute inset-0 animate-ping rounded-full bg-coral/30" />}
              <img
                src={doctor.image}
                alt=""
                className={cn(
                  "relative h-32 w-32 rounded-full object-cover ring-4 transition-all",
                  assistantSpeaking ? "ring-coral" : "ring-card",
                )}
              />
            </div>
            <h1 className="mt-5 text-2xl font-bold">{doctor.specialist}</h1>
            <p className="text-sm text-muted-foreground">{t("call.agent")}</p>

            <div ref={messagesEndRef} className="mt-10 flex max-h-[320px] w-full max-w-2xl flex-col gap-3 overflow-y-auto">
              {messages.slice(-6).map((msg, index) => (
                <div
                  key={`${messages.length}-${index}`}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "self-end rounded-tr-md bg-primary text-primary-foreground"
                      : "self-start rounded-tl-md border bg-background",
                  )}
                >
                  <p className="mb-0.5 text-xs font-semibold opacity-75">
                    {msg.role === "user" ? t("call.you") : doctor.specialist}
                  </p>
                  {msg.text}
                </div>
              ))}
              {liveTranscript.text && (
                <div
                  className={cn(
                    "max-w-[85%] animate-pulse rounded-2xl border border-dashed px-4 py-3 text-sm",
                    liveTranscript.role === "user" ? "self-end" : "self-start",
                  )}
                >
                  {liveTranscript.text}
                </div>
              )}
            </div>

            {status === "idle" || status === "connecting" ? (
              <>
                <Button size="lg" className="mt-10 rounded-full px-10" onClick={startCall} disabled={status === "connecting"}>
                  {status === "connecting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneCall className="h-5 w-5" />}
                  {status === "connecting" ? t("call.calling") : t("call.startCall")}
                </Button>
                <p className="mt-4 flex max-w-md items-start gap-2 text-center text-xs text-muted-foreground">
                  <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("call.micHint")}
                </p>
              </>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                className="mt-10 rounded-full px-10"
                onClick={endCall}
                disabled={status === "ending"}
              >
                {status === "ending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
                {status === "ending" ? t("call.generating") : t("call.endCall")}
              </Button>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 border-t bg-secondary/50 px-6 py-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            {t("common:ai.disclosure")} {t("call.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
