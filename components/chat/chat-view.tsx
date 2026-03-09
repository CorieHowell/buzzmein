"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/messages";
import { Avatar } from "@/components/ui/avatar";
import type { ChatMessage } from "@/lib/supabase/queries/messages";

interface ChatViewProps {
  groupId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function ChatView({
  groupId,
  currentUserId,
  initialMessages,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Scroll to bottom whenever messages update
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime — re-fetch on any new message in this group
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          // Re-fetch to get profile join data (same pattern as bring-list)
          const { data } = await supabase
            .from("messages")
            .select(
              `
              id,
              group_id,
              user_id,
              body,
              created_at,
              sender:profiles!messages_user_id_fkey (
                display_name,
                avatar_url
              )
            `
            )
            .eq("group_id", groupId)
            .order("created_at", { ascending: false })
            .limit(50);

          if (data) {
            setMessages(
              data.reverse().map((row) => {
                const sender = Array.isArray(row.sender)
                  ? row.sender[0]
                  : row.sender;
                return {
                  id: row.id,
                  group_id: row.group_id,
                  user_id: row.user_id,
                  body: row.body,
                  created_at: row.created_at,
                  sender_name: (sender as { display_name: string } | null)?.display_name ?? "Unknown",
                  sender_avatar: (sender as { avatar_url: string | null } | null)?.avatar_url ?? null,
                };
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend() {
    const text = input.trim();
    if (!text || isPending) return;

    // Optimistic: add message immediately
    const optimistic: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      group_id: groupId,
      user_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
      sender_name: "You",
      sender_avatar: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    startTransition(async () => {
      try {
        await sendMessage(groupId, text);
        // Realtime will fire and replace the optimistic message with real data
      } catch {
        // Remove the optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimistic.id)
        );
        setInput(text); // Restore input
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (no shift); newline on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  // Determine display groups for date dividers and avatar collapsing
  interface DisplayMsg extends ChatMessage {
    showAvatar: boolean;
    showDateDivider: boolean;
    dividerLabel: string;
  }

  const displayMessages: DisplayMsg[] = messages.map((msg, idx) => {
    const prev = messages[idx - 1];
    const isOwn = msg.user_id === currentUserId;

    // Show avatar/name when first message in a run from this user
    const showAvatar =
      !isOwn && (idx === 0 || prev.user_id !== msg.user_id);

    // Date divider when day changes
    const prevDate = prev ? new Date(prev.created_at).toDateString() : null;
    const thisDate = new Date(msg.created_at).toDateString();
    const showDateDivider = prevDate !== thisDate;

    return {
      ...msg,
      showAvatar,
      showDateDivider,
      dividerLabel: showDateDivider ? formatDateDivider(msg.created_at) : "",
    };
  });

  return (
    // Escape the parent's px-4 py-6 padding and fill available height
    <div className="flex flex-col -mx-4 -mt-6 -mb-6">
      {/* ── Message feed ─────────────────────────────────────────── */}
      <div
        ref={feedRef}
        className="overflow-y-auto px-4 py-4"
        style={{ height: "calc(100svh - 360px)", minHeight: "260px" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-3xl">👋</p>
            <p className="font-semibold text-ink">Say hello to the group!</p>
            <p className="text-sm text-muted-foreground">
              Be the first to send a message.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {displayMessages.map((msg) => {
              const isOwn = msg.user_id === currentUserId;

              return (
                <div key={msg.id}>
                  {/* Date divider */}
                  {msg.showDateDivider && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">
                        {msg.dividerLabel}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}

                  {/* Message row */}
                  <div
                    className={`flex items-end gap-2 ${
                      isOwn ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar placeholder to maintain alignment */}
                    {!isOwn && (
                      <div className="w-8 shrink-0 self-end">
                        {msg.showAvatar ? (
                          <Avatar
                            src={msg.sender_avatar}
                            displayName={msg.sender_name}
                            size="sm"
                          />
                        ) : null}
                      </div>
                    )}

                    <div
                      className={`flex max-w-[72%] flex-col gap-0.5 ${
                        isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Sender name (first in group only, others only) */}
                      {msg.showAvatar && (
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          {msg.sender_name}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isOwn
                            ? "rounded-br-sm bg-primary text-white"
                            : "rounded-bl-sm bg-muted text-ink"
                        }`}
                      >
                        {msg.body}
                      </div>

                      {/* Timestamp — only on last message in a run */}
                      <span className="mx-1 text-[10px] text-muted-foreground/60">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────────── */}
      <div className="shrink-0 border-t bg-background px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message the group…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-input bg-muted/40 px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 translate-x-0.5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
