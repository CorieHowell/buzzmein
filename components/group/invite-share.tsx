"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InviteShareProps {
  groupId: string;
  inviteCode: string;
}

export function InviteShare({ groupId, inviteCode }: InviteShareProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `https://www.buzzmein.app/join/${inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select + copy via execCommand
      const el = document.createElement("input");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Invite URL row */}
      <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
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

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <QRCode value={inviteUrl} size={180} />
        </div>
        <p className="text-xs text-muted-foreground">Scan to join on mobile</p>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 pt-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
      >
        <Link
          href={`/group/${groupId}`}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Go to my group
        </Link>
      </div>
    </div>
  );
}
