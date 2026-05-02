import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  testId?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
  testId,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-orange-200/70",
        compact ? "py-10 px-5" : "py-14 px-6",
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-4 shadow-sm",
          compact ? "w-12 h-12" : "w-14 h-14"
        )}
      >
        <Icon className={cn("text-[#FF6F00]", compact ? "w-6 h-6" : "w-7 h-7")} />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1.5 font-serif">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
