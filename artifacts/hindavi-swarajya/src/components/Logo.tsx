import logoUrl from "@/assets/logo.png";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  alt?: string;
};

export function Logo({ className, alt = "हिंदवी स्वराज्य" }: Props) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}
