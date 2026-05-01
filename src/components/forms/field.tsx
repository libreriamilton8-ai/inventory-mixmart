import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
