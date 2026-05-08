import logoUrl from "@/assets/logo-dark.png";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  alt?: string;
  /** When true, render the logo flat (no dark backdrop). Use only on already-dark surfaces. */
  bare?: boolean;
};

export function Logo({ className, alt = "हिंदवी स्वराज्य", bare = false }: Props) {
  if (bare) {
    return (
      <img
        src={logoUrl}
        alt={alt}
        className={cn("object-contain select-none", className)}
        draggable={false}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-black overflow-hidden shrink-0",
        className,
      )}
      style={{
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.10) inset, 0 6px 16px -6px rgba(0,0,0,0.35)",
      }}
    >
      <img
        src={logoUrl}
        alt={alt}
        className="h-full w-auto object-contain select-none"
        draggable={false}
      />
    </span>
  );
}
