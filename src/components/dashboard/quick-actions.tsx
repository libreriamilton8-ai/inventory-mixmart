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
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-2 xl:grid-cols-4">
      <QuickAction
        href="/entries"
        mobileTitle="Entrada"
        title="Registrar entrada"
        description="Recibir mercaderia"
        icon={<ArrowDownLeft className="h-4 w-4" strokeWidth={2} />}
        tone="positive"
      />
      <QuickAction
        href="/outputs"
        mobileTitle="Salida"
        title="Registrar salida"
        description="Venta, merma, uso"
        icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2} />}
        tone="warning"
      />
      <QuickAction
        href="/services"
        mobileTitle="Servicio"
        title="Registrar servicio"
        description="Impresion, copia"
        icon={<Settings2 className="h-4 w-4" strokeWidth={2} />}
        tone="service"
      />
      {isAdmin ? (
        <QuickAction
          href="/reports"
          mobileTitle="Reportes"
          title="Ver reportes"
          description="Ingresos y mermas"
          icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />}
          tone="info"
        />
      ) : (
        <QuickAction
          href="/stock"
          mobileTitle="Stock"
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
  mobileTitle,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  mobileTitle?: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: Tone;
}) {
  return (
    <Link
      className="group flex min-h-[74px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[12px] border border-border bg-card px-1.5 py-2 text-center transition hover:-translate-y-px hover:border-oat-400 hover:shadow-elevated sm:min-h-0 sm:flex-row sm:justify-start sm:gap-3 sm:rounded-[14px] sm:p-3.5 sm:text-left"
      href={href}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[10px] sm:size-9",
          TONE_CLASS[tone],
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10.5px] font-medium leading-tight text-foreground sm:truncate sm:text-[13.5px]">
          <span className="sm:hidden">{mobileTitle ?? title}</span>
          <span className="hidden sm:inline">{title}</span>
        </span>
        <span className="hidden truncate text-[11.5px] text-muted-foreground sm:block">
          {description}
        </span>
      </span>
    </Link>
  );
}
