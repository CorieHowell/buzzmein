type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  displayName: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

// Deterministic background color from display name
function getInitialsColor(name: string): string {
  const colors = [
    "bg-violet-200 text-violet-800",
    "bg-purple-200 text-purple-800",
    "bg-fuchsia-200 text-fuchsia-800",
    "bg-indigo-200 text-indigo-800",
    "bg-blue-200 text-blue-800",
    "bg-teal-200 text-teal-800",
    "bg-emerald-200 text-emerald-800",
    "bg-amber-200 text-amber-800",
    "bg-rose-200 text-rose-800",
    "bg-orange-200 text-orange-800",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, displayName, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}
      >
        {/* Plain <img> — avatars are already small CDN files; next/image adds no benefit
            and breaks on blob: URLs (local crop preview) and requires hostname whitelisting */}
        <img
          src={src}
          alt={displayName}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${getInitialsColor(displayName)} ${className}`}
      title={displayName}
    >
      {getInitials(displayName)}
    </div>
  );
}
