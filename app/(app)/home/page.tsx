import { getFeedItems } from "@/lib/supabase/queries/feed";
import { FeedCard } from "@/components/home/feed-card";
import { QuoteHeader } from "@/components/dashboard/quote-header";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default async function HomePage() {
  const items = await getFeedItems();

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-4 pb-2 flex justify-center">
        <QuoteHeader />
      </div>

      {items.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      {/* Icon circle — matches group card style */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border">
        <Zap size={36} strokeWidth={1.5} className="text-ink/40" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xl font-semibold text-ink">All quiet for now</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Activity from your groups will show up here.
        </p>
      </div>

      <Link href="/dashboard" className={buttonVariants()}>
        Go to groups
      </Link>
    </div>
  );
}
