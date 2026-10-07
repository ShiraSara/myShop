"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { Check, CheckCheck, Send, TriangleAlert } from "lucide-react";
import { sendMessageAction, type SentMessage } from "@/actions/messages";
import { cn, formatTime } from "@/lib/utils";

type ChatMessage = SentMessage & { pending?: boolean; failed?: boolean };

const POLL_MS = 4000;

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "היום";
  if (same(d, yesterday)) return "אתמול";
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" }).format(d);
}

/**
 * Chat thread with optimistic sending and lightweight polling.
 * The polling hook is isolated so it can be replaced with a realtime channel later.
 */
export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
  initialReadUpTo,
  disabled,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: SentMessage[];
  initialReadUpTo: string | null;
  disabled?: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [readUpTo, setReadUpTo] = useState<string | null>(initialReadUpTo);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCreatedAt = messages.filter((m) => !m.pending).at(-1)?.createdAt;

  const merge = useCallback((incoming: SentMessage[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const ids = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !ids.has(m.id));
      return fresh.length ? [...current, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : current;
    });
  }, []);

  // Polling (pauses when the tab is hidden)
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const qs = lastCreatedAt ? `?after=${encodeURIComponent(lastCreatedAt)}` : "";
        const res = await fetch(`/api/conversations/${conversationId}/messages${qs}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: { messages: SentMessage[]; readUpTo: string | null } = await res.json();
        merge(data.messages);
        setReadUpTo(data.readUpTo);
      } catch {
        /* offline — try again next tick */
      }
    };
    const timer = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [conversationId, lastCreatedAt, merge]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function send(text: string, retryId?: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    const tempId = retryId ?? `temp-${Date.now()}`;
    const optimistic: ChatMessage = { id: tempId, body: trimmed, senderId: currentUserId, createdAt: new Date().toISOString(), readAt: null, pending: true };
    setMessages((m) => (retryId ? m.map((x) => (x.id === retryId ? optimistic : x)) : [...m, optimistic]));
    if (!retryId) setBody("");
    startTransition(async () => {
      const result = await sendMessageAction(conversationId, { body: trimmed });
      if (result.ok && result.data) {
        const saved = result.data;
        setMessages((m) => {
          const withoutTemp = m.filter((x) => x.id !== tempId && x.id !== saved.id);
          return [...withoutTemp, saved].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
      } else {
        setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
        setError(result.ok ? null : result.error);
      }
    });
    textareaRef.current?.focus();
  }

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto bg-[#f6f5f2] px-3 py-4 sm:px-6" aria-live="polite" aria-label="הודעות">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const day = dayLabel(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          const read = mine && !m.pending && readUpTo !== null && m.createdAt <= readUpTo;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground shadow-sm">{day}</span>
                </div>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3.5 py-2 text-[0.95rem] shadow-sm sm:max-w-[70%]",
                    mine ? "rounded-ee-md bg-primary text-white" : "rounded-es-md bg-surface text-foreground",
                    m.pending && "opacity-70",
                    m.failed && "bg-red-100 text-red-900",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                  <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[0.7rem]", mine && !m.failed ? "text-primary-100" : "text-muted-foreground")}>
                    {formatTime(m.createdAt)}
                    {mine && !m.failed && (m.pending ? <Check className="size-3.5 opacity-60" aria-label="נשלח" /> : read ? <CheckCheck className="size-3.5 text-accent-200" aria-label="נקרא" /> : <Check className="size-3.5" aria-label="נשלח" />)}
                  </p>
                  {m.failed && (
                    <button type="button" onClick={() => send(m.body, m.id)} className="mt-1 flex items-center gap-1 text-xs font-medium underline">
                      <TriangleAlert className="size-3.5" aria-hidden />לא נשלח — נסו שוב
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
        {disabled ? (
          <p className="py-2 text-center text-sm text-muted-foreground">{disabled}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(body);
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor="chat-input" className="sr-only">כתיבת הודעה</label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(body);
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="כתבו הודעה..."
              className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-[0.95rem] focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={!body.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-700 active:scale-95 disabled:opacity-40"
              aria-label="שליחה"
            >
              <Send className="size-5 -scale-x-100" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
