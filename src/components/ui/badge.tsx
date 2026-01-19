"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[--ring] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[--accent] text-[--background]",
        secondary:
          "border-transparent bg-[--background-tertiary] text-[--foreground-muted]",
        outline:
          "text-[--foreground-muted] border-[--border]",
        high:
          "border-[--priority-high] bg-[--priority-high-muted] text-[--priority-high]",
        medium:
          "border-[--priority-medium] bg-[--priority-medium-muted] text-[--priority-medium]",
        low:
          "border-[--priority-low] bg-[--priority-low-muted] text-[--foreground-muted]",
        success:
          "border-[--score-excellent] bg-[--score-excellent]/10 text-[--score-excellent]",
        destructive:
          "border-[--priority-high] bg-[--priority-high]/10 text-[--priority-high]",
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
