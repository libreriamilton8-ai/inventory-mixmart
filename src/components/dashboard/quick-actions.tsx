import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Search,
  Settings2,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "positive" | "warning" | "service" | "info" | "brand";

const TONE_CLASS: Record<Tone, string> = {
  positive: "bg-accent-100 text-accent-600",
  warning: "bg-secondary-100 text-secondary-600",
  service: "bg-oat-200 text-oat-700",
  info: "bg-info-100 text-info-600",
  brand: "bg-primary-100 text-primary",
};

export function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      <QuickAction
        href="/entries"
        title="Registrar entrada"
        description="Recibir mercaderia"
        icon={<ArrowDownLeft className="h-4 w-4" strokeWidth={2} />}
        tone="positive"
      />
      <QuickAction
        href="/outputs"
        title="Registrar salida"
        description="Venta, merma, uso"
        icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2} />}
        tone="warning"
      />
      <QuickAction
        href="/services"
        title="Registrar servicio"
        description="Impresion, copia"
        icon={<Settings2 className="h-4 w-4" strokeWidth={2} />}
        tone="service"
      />
      {isAdmin ? (
        <QuickAction
          href="/reports"
          title="Ver reportes"
          description="Ingresos y mermas"
          icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />}
          tone="info"
        />
      ) : (
        <QuickAction
          href="/stock"
          title="Buscar producto"
          description="Verificar stock"
          icon={<Search className="h-4 w-4" strokeWidth={2} />}
          tone="brand"
        />
      )}
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: Tone;
}) {
  return (
    <Link
      className="group flex min-w-0 items-center gap-2.5 rounded-[14px] border border-border bg-card p-2.5 transition hover:-translate-y-px hover:border-oat-400 hover:shadow-elevated sm:gap-3 sm:p-3.5"
      href={href}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9",
          TONE_CLASS[tone],
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[12.5px] font-medium text-foreground sm:text-[13.5px]">
          {title}
        </span>
        <span className="truncate text-[11px] text-muted-foreground sm:text-[11.5px]">
          {description}
        </span>
      </span>
    </Link>
  );
}
