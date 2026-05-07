// Small reusable avatar circle. Falls back to initials when no image.
//
// Plain Server Component — no client-side JS. Uses a regular <img> instead
// of next/image so we don't have to whitelist the Supabase Storage hostname
// in next.config.ts (one less thing to break when moving environments).

type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "size-7 text-[10px]",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl",
};

export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: Size;
  className?: string;
}) {
  const initials = getInitials(name);
  const dim = SIZE_CLASS[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "Avatar"}
        className={`${dim} ${className} rounded-full object-cover ring-1 ring-border`}
      />
    );
  }

  return (
    <div
      className={`${dim} ${className} flex items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800 ring-1 ring-border dark:bg-emerald-950/60 dark:text-emerald-200`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
