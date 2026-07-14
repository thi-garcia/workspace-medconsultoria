import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@app/ui";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground ring-border",
        primary: "bg-brand-blueLight/10 text-brand-blueText ring-brand-blueLight/25",
        success: "bg-success/10 text-success ring-success/25",
        warning: "bg-warning/10 text-warning ring-warning/30",
        danger: "bg-destructive/10 text-destructive ring-destructive/25",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
