"use client";

import { useState } from "react";
import { UserPlus, ChevronRight, X, Copy, Check } from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface InviteMembersDrawerProps {
  inviteCode: string;
}

export function InviteMembersDrawer({ inviteCode }: InviteMembersDrawerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = `https://www.buzzmein.app/join/${inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const el = document.createElement("input");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* ── Trigger card ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-2xl bg-card px-4 py-3 text-left transition-opacity active:opacity-70"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <UserPlus size={18} className="text-primary" strokeWidth={2} />
        </div>
        <span className="flex-1 font-semibold text-ink">Invite Members</span>
        <ChevronRight size={18} className="text-muted-foreground" strokeWidth={1.5} />
      </button>

      {/* ── Bottom drawer ─────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background px-6 pt-5"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
          >
            {/* Handle + header */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Invite members</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-opacity active:opacity-70"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Invite URL row */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
              <span className="flex-1 truncate text-sm text-ink">
                buzzmein.app/join/{inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  copied
                    ? "bg-primary/10 text-primary"
                    : "bg-primary text-primary-foreground active:opacity-80"
                )}
              >
                {copied ? (
                  <>
                    <Check size={12} strokeWidth={2.5} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} strokeWidth={2} />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* QR code */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <QRCode value={inviteUrl} size={160} />
              </div>
              <p className="text-xs text-muted-foreground">Scan to join on mobile</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
