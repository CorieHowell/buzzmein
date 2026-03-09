"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-6 px-2 text-xs"
      )}
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
