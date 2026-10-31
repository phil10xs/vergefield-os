import { colors } from "@/brand";
import { cn } from "@/lib/utils";

/**
 * VergeCare mark: a repair wrench inside the home. Fixed brand colors, so it
 * renders identically in light and dark mode. Matches public/brand SVGs.
 */
export function VergeCareMark({
  className,
  title = "VergeCare",
  decorative = false,
}: {
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-9 w-9 shrink-0", className)}
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img" as const, "aria-label": title })}
    >
      <rect x="2" y="2" width="60" height="60" rx="15" fill={colors.ink} />
      <path
        d="M32 11 13.5 27.5h5.5v21.5h11.5V38.5h7v10.5H49V27.5h5.5Z"
        fill={colors.signal}
      />
      <g stroke={colors.ink} fill="none">
        <line
          x1="27.5"
          y1="46.5"
          x2="35.5"
          y2="38.5"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M40.1 30.4A6 6 0 1 0 43.6 38.1"
          strokeWidth="4.5"
        />
      </g>
    </svg>
  );
}
