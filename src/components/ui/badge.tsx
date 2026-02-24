import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-accent)] text-[var(--color-background)]",
        secondary:
          "border-transparent bg-[var(--color-background-tertiary)] text-[var(--color-foreground)]",
        destructive:
          "border-transparent bg-[var(--color-danger)] text-white",
        outline: "text-[var(--color-foreground)] border-[var(--color-card-border)]",
        success:
          "border-transparent bg-[var(--color-success)] text-white",
        warning:
          "border-transparent bg-[var(--color-warning)] text-white",
        health:
          "border-transparent bg-[var(--color-health)] text-[var(--background)]",
        mana:
          "border-transparent bg-[var(--color-mana)] text-white",
        win: "border-transparent bg-[var(--color-success)] text-white",
        lose: "border-transparent bg-[var(--color-danger)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
