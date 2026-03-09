"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  "Good people, good times.",
  "The best nights start with the right people.",
  "Great things happen when good people gather.",
  "Your people make everything better.",
  "Together is always a good idea.",
  "Life's too short for boring company.",
  "Every meetup is a memory in the making.",
  "Good company turns any night into something special.",
  "The table is always better full.",
  "Some things are just better with your crew.",
];

export function QuoteHeader() {
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
    let stored = sessionStorage.getItem("buzz_quote_idx");
    let idx: number;

    if (stored !== null) {
      idx = parseInt(stored, 10);
    } else {
      idx = Math.floor(Math.random() * QUOTES.length);
      sessionStorage.setItem("buzz_quote_idx", String(idx));
    }

    setQuote(QUOTES[idx] ?? QUOTES[0]);
  }, []);

  // Render a placeholder with the same height to avoid layout shift
  if (!quote) {
    return <div className="h-12 w-full" aria-hidden />;
  }

  return (
    <p className="text-3xl font-normal text-ink leading-snug text-center w-full">
      {quote}
    </p>
  );
}
