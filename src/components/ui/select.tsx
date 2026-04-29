import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectProps = React.ComponentPropsWithoutRef<"select">;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, ...props }, ref) => (
    <div className="select-field">
      <select className={cn("select-input", className)} ref={ref} {...props}>
        {children}
      </select>
      <span aria-hidden="true" className="select-icon">
        <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </div>
  ),
);

Select.displayName = "Select";
