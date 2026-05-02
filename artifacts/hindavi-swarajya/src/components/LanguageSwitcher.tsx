import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n";
import { cn } from "@/lib/utils";

type Variant = "icon" | "compact" | "pill";

export function LanguageSwitcher({
  variant = "icon",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "en") as LanguageCode;
  const currentLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === current)?.native ?? "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change language"
          data-testid="button-language-switcher"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full transition-colors active:scale-[0.97]",
            variant === "icon" &&
              "w-10 h-10 text-foreground/70 hover:text-foreground hover:bg-foreground/5",
            variant === "compact" &&
              "h-9 px-3 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/5",
            variant === "pill" &&
              "h-9 px-3.5 text-xs font-medium border border-foreground/10 bg-background hover:bg-foreground/5 text-foreground/80",
            className,
          )}
        >
          <Languages className="w-4 h-4" />
          {variant !== "icon" && <span>{currentLabel}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang.code === current;
          return (
            <DropdownMenuItem
              key={lang.code}
              onSelect={() => void i18n.changeLanguage(lang.code)}
              data-testid={`lang-option-${lang.code}`}
              className="flex items-center justify-between gap-3 cursor-pointer rounded-lg"
            >
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{lang.native}</span>
                <span className="text-[11px] text-muted-foreground">
                  {lang.label}
                </span>
              </div>
              {active && <Check className="w-4 h-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
