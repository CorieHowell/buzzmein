import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface GroupHeaderProps {
  groupName: string;
}

export function GroupHeader({ groupName }: GroupHeaderProps) {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-white border-b border-border">
        <div className="mx-auto grid h-14 max-w-lg grid-cols-3 items-center px-4">
          {/* left — back to home */}
          <div className="flex items-center">
            <Link
              href="/home"
              className="-ml-1 flex items-center gap-0.5 rounded-lg p-1.5 text-primary hover:bg-secondary transition-colors"
              aria-label="Back to home"
            >
              <ChevronLeft size={22} strokeWidth={2} />
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>
          {/* center — group name */}
          <div className="flex justify-center">
            <p className="truncate text-base font-semibold text-ink">
              {groupName}
            </p>
          </div>
          {/* right — empty spacer keeps grid balanced */}
          <div />
        </div>
      </header>
      {/* Spacer: fixed header (h-14 = 56px) minus main's pt-6 (24px) = net 32px push */}
      <div className="-mt-6 h-14" />
    </>
  );
}
