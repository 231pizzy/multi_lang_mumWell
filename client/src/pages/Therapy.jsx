import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { Info, Loader2, MessageSquare, PanelLeft, Plus, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/Logo";
import { CrisisResources } from "@/components/CrisisResources";
import { useSession } from "@/context/SessionContext";
import { chatApi, getErrorMessage } from "@/lib/api";
import { dateLocale } from "@/lib/dates";
import { cn } from "@/lib/utils";

const toMessage = (m) => ({ ...m, timestamp: new Date(m.timestamp) });

function SessionList({ sessions, activeId, onSelect, onNew, creating }) {
  const { t, i18n } = useTranslation("chat");
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-bold">{t("sessions")}</h2>
        <Button size="sm" onClick={onNew} disabled={creating} className="rounded-full">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("newSession")}
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sessions.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("noSessions")}</p>}
        {sessions.map((session) => {
          const first = session.messages[0]?.content;
          const last = session.messages[session.messages.length - 1]?.content;
          const date = new Date(session.updatedAt || session.startTime);
          const active = session.sessionId === activeId;
          return (
            <button
              type="button"
              key={session.sessionId}
              aria-current={active ? "true" : undefined}
              className={cn(
                "w-full rounded-xl p-3 text-left text-sm transition-colors",
                active ? "bg-secondary ring-1 ring-primary/20" : "hover:bg-secondary/60",
              )}
              onClick={() => onSelect(session.sessionId)}
            >
              <p className="flex items-center gap-2 font-semibold">
                <MessageSquare className="h-4 w-4 shrink-0 text-coral" />
                <span className="truncate">{first ? first.slice(0, 40) : t("newChat")}</span>
              </p>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{last || t("noMessages")}</p>
              <p className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{t("messageCount", { count: session.messages.length })}</span>
                <span>
                  {Number.isNaN(date.getTime())
                    ? t("justNow")
                    : formatDistanceToNow(date, { addSuffix: true, locale: dateLocale(i18n.resolvedLanguage) })}
                </span>
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ msg, userInitial }) {
  const { t } = useTranslation("chat");
  const mine = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", mine && "flex-row-reverse")}
    >
      {mine ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-semibold text-coral-foreground">
          {userInitial}
        </span>
      ) : (
        <LogoMark className="h-8 w-8 shrink-0" />
      )}
      <div className={cn("max-w-[85%] sm:max-w-[75%]", mine && "text-right")}>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{mine ? t("you") : t("assistant")}</p>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-3 text-left",
            mine ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-card",
          )}
        >
          <div className={cn("prose prose-sm max-w-none leading-relaxed", mine ? "prose-invert" : "dark:prose-invert")}>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Therapy() {
  const { t } = useTranslation(["chat", "common"]);
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  // Which session `messages` belongs to, and whether that session turned out not to exist.
  const [loaded, setLoaded] = useState({ id: null, missing: false });
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef(null);
  const creatingRef = useRef(false);
  const currentIdRef = useRef(sessionId);

  const loadingHistory = sessionId !== "new" && loaded.id !== sessionId;
  const sessionMissing = !loadingHistory && loaded.missing;
  const hasCrisis = messages.some((m) => m.metadata?.crisis);
  const starters = t("starters", { returnObjects: true });
  const userInitial = user?.name?.[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    currentIdRef.current = sessionId;
  }, [sessionId]);

  const createSession = useCallback(async () => {
    const newId = await chatApi.createSession();
    setSessions((prev) => [{ sessionId: newId, messages: [], startTime: new Date(), updatedAt: new Date() }, ...prev]);
    return newId;
  }, []);

  // "New conversation" button.
  const startNewSession = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const newId = await createSession();
      setShowSidebar(false);
      navigate(`/therapy/${newId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, t("errors.create")));
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  // Load the conversation list once.
  useEffect(() => {
    chatApi
      .listSessions()
      .then(setSessions)
      .catch(() => toast.error(t("errors.list")));
  }, [t]);

  // /therapy/new → create a session and replace the URL with it.
  useEffect(() => {
    if (sessionId !== "new" || creatingRef.current) return;
    creatingRef.current = true;
    createSession()
      .then((newId) => {
        if (currentIdRef.current === "new") navigate(`/therapy/${newId}`, { replace: true });
      })
      .catch((error) => toast.error(getErrorMessage(error, t("errors.create"))))
      .finally(() => {
        creatingRef.current = false;
      });
  }, [sessionId, createSession, navigate, t]);

  // Load history for the session in the URL.
  useEffect(() => {
    if (!sessionId || sessionId === "new") return;
    let cancelled = false;
    chatApi
      .getHistory(sessionId)
      .then((history) => {
        if (cancelled) return;
        setMessages(history.map(toMessage));
        setLoaded({ id: sessionId, missing: false });
      })
      .catch((error) => {
        if (cancelled) return;
        setMessages([]);
        setLoaded({ id: sessionId, missing: error.response?.status === 404 });
        if (error.response?.status !== 404) toast.error(getErrorMessage(error, t("errors.load")));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, t]);

  // Scroll only the message list (scrollIntoView would also scroll the page).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || isTyping || !sessionId || sessionId === "new" || sessionMissing) return;

    const userMessage = { role: "user", content, timestamp: new Date() };
    setMessage("");
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await chatApi.sendMessage(sessionId, content);
      const assistantMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        metadata: { analysis: response.analysis, crisis: response.crisis },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId
            ? { ...s, messages: [...s.messages, userMessage, assistantMessage], updatedAt: new Date() }
            : s,
        ),
      );
    } catch (error) {
      // Put the text back so nothing the user wrote is lost.
      setMessages((prev) => prev.filter((m) => m !== userMessage));
      setMessage(content);
      toast.error(getErrorMessage(error, t("errors.send")));
    } finally {
      setIsTyping(false);
    }
  };

  const selectSession = (id) => {
    setShowSidebar(false);
    if (id !== sessionId) navigate(`/therapy/${id}`);
  };

  if (sessionId === "new") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setShowSidebar(true)}>
          <PanelLeft className="h-4 w-4" />
          {t("showSessions")}
        </Button>
        <Button size="sm" onClick={startNewSession} disabled={creating}>
          <Plus className="h-4 w-4" />
          {t("newSession")}
        </Button>
      </div>

      <div className="flex h-[calc(100dvh-8.5rem)] gap-6 lg:h-[calc(100dvh-7.5rem)]">
        {showSidebar && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setShowSidebar(false)} aria-hidden="true" />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r bg-card transition-transform duration-300",
            "lg:static lg:z-auto lg:translate-x-0 lg:rounded-2xl lg:border",
            showSidebar ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 lg:hidden"
            onClick={() => setShowSidebar(false)}
            aria-label={t("closeSessions")}
          >
            <X className="h-4 w-4" />
          </Button>
          <SessionList
            sessions={sessions}
            activeId={sessionId}
            onSelect={selectSession}
            onNew={startNewSession}
            creating={creating}
          />
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
          <header className="flex items-center gap-3 border-b px-5 py-3">
            <LogoMark className="h-9 w-9" />
            <div className="min-w-0">
              <h1 className="font-bold">{t("title")}</h1>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Info className="h-3 w-3 shrink-0" />
                {t("common:ai.disclosure")}
              </p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background/60 px-4 py-6 sm:px-6">
            {loadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sessionMissing ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="max-w-sm text-muted-foreground">{t("missing")}</p>
                <Button onClick={startNewSession} disabled={creating}>
                  {t("startNew")}
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center text-center">
                <LogoMark className="h-14 w-14" />
                <h2 className="mt-5 text-2xl font-bold">{t("welcomeTitle")}</h2>
                <p className="mt-2 text-muted-foreground">{t("welcomeBody")}</p>
                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {starters.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => send(starter)}
                      disabled={isTyping}
                      className="rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => (
                    <MessageBubble key={`${msg.timestamp.getTime()}-${msg.role}-${index}`} msg={msg} userInitial={userInitial} />
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <LogoMark className="h-8 w-8" />
                    <span className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("typing")}
                    </span>
                  </div>
                )}
                {hasCrisis && <CrisisResources compact />}
              </div>
            )}
          </div>

          <div className="border-t bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(message);
              }}
              className="relative mx-auto max-w-3xl"
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("message")}
                maxLength={4000}
                rows={1}
                disabled={isTyping || sessionMissing || loadingHistory}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(message);
                  }
                }}
                className="max-h-[200px] min-h-[52px] w-full resize-none rounded-2xl border border-input bg-background py-3.5 pl-4 pr-14 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
              />
              <Button
                type="submit"
                size="icon"
                aria-label={t("send")}
                disabled={isTyping || sessionMissing || !message.trim()}
                className="absolute bottom-2 right-2 h-9 w-9 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{t("hint")}</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-sage" />
                {t("privacy")}
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
