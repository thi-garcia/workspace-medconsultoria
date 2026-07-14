import * as React from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary ring-1 ring-inset ring-primary/10">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
