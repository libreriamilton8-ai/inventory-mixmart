import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Search,
  Settings2,
} from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { FinancialSummaryCard } from "@/components/dashboard/financial-summary-card";
import { RecentMovementsPanel } from "@/components/dashboard/recent-movements-panel";
import { DashboardContentSkeleton } from "@/components/shared";
import { decimalToNumber } from "@/lib/format";
import { requireActiveUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  getDashboardFinancialSummary,
  getRecentDashboardMovements,
} from "@/services/dashboard.service";

type DashboardPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <Suspense fallback={<DashboardContentSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
  const user = await requireActiveUser("/dashboard");
  const params = await searchParams;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    products,
    entriesToday,
    outputsToday,
    salesToday,
    wasteToday,
    servicesToday,
    financialSummary,
    recentMovements,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minimumStock: true,
        purchasePrice: true,
      },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.stockEntry.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.stockOutput.count({
      where: { occurredAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.stockOutput.count({
      where: {
        occurredAt: { gte: todayStart, lte: todayEnd },
        reason: "SALE",
      },
    }),
    prisma.stockOutput.count({
      where: {
        occurredAt: { gte: todayStart, lte: todayEnd },
        reason: "WASTE",
      },
    }),
    prisma.serviceRecord.count({
      where: { serviceDate: { gte: todayStart, lte: todayEnd } },
    }),
    getDashboardFinancialSummary(params.range),
    getRecentDashboardMovements(),
  ]);

  const lowStockProducts = products.filter((product) => {
    const stock = decimalToNumber(product.currentStock);
    const minimum = decimalToNumber(product.minimumStock);
    return stock <= minimum;
  });
  const outOfStockProducts = lowStockProducts.filter(
    (product) => decimalToNumber(product.currentStock) <= 0,
  );
  const lowStockOnly = lowStockProducts.filter(
    (product) => decimalToNumber(product.currentStock) > 0,
  );
  const inventoryCost = products.reduce(
    (sum, product) =>
      sum +
      decimalToNumber(product.currentStock) *
        decimalToNumber(product.purchasePrice),
    0,
  );
  const attentionList = [
    ...outOfStockProducts.map((product) => ({
      product,
      status: "out" as const,
    })),
    ...lowStockOnly.map((product) => ({ product, status: "low" as const })),
  ].slice(0, 4);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-3 pb-24 sm:space-y-3.5 lg:pb-12">
      <QuickActions isAdmin={isAdmin} />

      {isAdmin ? (
        <FinancialSummaryCard
          entriesToday={entriesToday}
          initialSummary={financialSummary}
          inventoryCost={inventoryCost}
          outOfStockCount={outOfStockProducts.length}
          outputsToday={outputsToday}
          salesToday={salesToday}
        />
      ) : (
        <WorkerHero
          entriesToday={entriesToday}
          outputsToday={outputsToday}
          salesToday={salesToday}
          wasteToday={wasteToday}
          servicesToday={servicesToday}
          outOfStockCount={outOfStockProducts.length}
          lowStockCount={lowStockOnly.length}
        />
      )}

      <div className="grid gap-3.5 xl:grid-cols-[2fr_1fr]">
        <RecentMovementsPanel
          currentUserId={user.id}
          movements={recentMovements}
          showOwnerFilter={!isAdmin}
        />
        <AttentionPanel
          items={attentionList}
          outOfStock={outOfStockProducts.length}
          lowStock={lowStockOnly.length}
        />
      </div>
    </div>
  );
}

function QuickActions({ isAdmin }: { isAdmin: boolean }) {
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
  tone: "positive" | "warning" | "service" | "info" | "brand";
}) {
  const toneClass = {
    positive: "bg-accent-100 text-accent-600",
    warning: "bg-secondary-100 text-secondary-600",
    service: "bg-oat-200 text-oat-700",
    info: "bg-info-100 text-info-600",
    brand: "bg-primary-100 text-primary",
  }[tone];

  return (
    <Link
      className="group flex min-w-0 items-center gap-2.5 rounded-[14px] border border-border bg-card p-2.5 transition hover:-translate-y-px hover:border-oat-400 hover:shadow-elevated sm:gap-3 sm:p-3.5"
      href={href}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9",
          toneClass,
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

function WorkerHero({
  entriesToday,
  outputsToday,
  salesToday,
  wasteToday,
  servicesToday,
  outOfStockCount,
  lowStockCount,
}: {
  entriesToday: number;
  outputsToday: number;
  salesToday: number;
  wasteToday: number;
  servicesToday: number;
  outOfStockCount: number;
  lowStockCount: number;
}) {
  const todayLabel = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date());

  return (
    <div className="grid gap-3.5 xl:grid-cols-[3fr_1fr]">
      <section className="rounded-card border border-border bg-card p-4 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] font-medium tracking-tight text-foreground sm:text-[19px]">
              Tu jornada
            </h2>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Hoy - {todayLabel}
            </p>
          </div>
          <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-foreground px-3 text-[11.5px] font-medium text-background">
            En turno
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-7">
          <WorkerMetric
            label="Entradas registradas"
            value={entriesToday}
            note="hoy"
            tone="accent"
          />
          <WorkerMetric
            label="Salidas registradas"
            value={outputsToday}
            note={`${salesToday} ventas - ${wasteToday} mermas`}
            tone="ink"
          />
          <WorkerMetric
            label="Servicios atendidos"
            value={servicesToday}
            note="impresiones, copias"
            tone="primary"
          />
        </div>
      </section>

      <aside className="grid grid-cols-2 gap-2 rounded-card border border-border bg-card p-4 sm:block sm:p-5">
        <div className="col-span-2">
          <h3 className="font-display text-[16px] font-medium">
            Alertas operativas
          </h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Productos a vigilar
          </p>
        </div>

        <AlertTile
          count={outOfStockCount}
          danger={outOfStockCount > 0}
          label="Sin stock"
        />
        <AlertTile count={lowStockCount} label="Bajo stock" warning />
      </aside>
    </div>
  );
}

function WorkerMetric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  tone: "accent" | "ink" | "primary";
}) {
  const toneClass = {
    accent: "text-accent-600",
    ink: "text-foreground",
    primary: "text-primary",
  }[tone];

  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-[32px] font-medium leading-none tracking-tight sm:text-[38px]",
          toneClass,
        )}
      >
        {value}
      </p>
      <p className="mt-2 truncate text-[11.5px] text-muted-foreground">{note}</p>
    </div>
  );
}

function AlertTile({
  count,
  danger = false,
  label,
  warning = false,
}: {
  count: number;
  danger?: boolean;
  label: string;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center justify-between gap-2 rounded-[10px] px-3 py-2.5",
        danger
          ? "border border-error/15 bg-error-surface"
          : warning && count > 0
            ? "bg-warning-surface"
            : "bg-surface-muted",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-[13px] font-medium",
            danger ? "text-error" : "text-foreground",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "text-[11px]",
            danger ? "text-error/75" : "text-muted-foreground",
          )}
        >
          {count} {count === 1 ? "producto" : "productos"}
        </p>
      </div>
      <span
        className={cn(
          "rounded-pill px-2.5 py-1 text-[11px] font-semibold",
          danger
            ? "bg-error text-error-foreground"
            : warning && count > 0
              ? "bg-warning text-warning-foreground"
              : "bg-surface text-muted-foreground",
        )}
      >
        {danger ? "!" : count}
      </span>
    </div>
  );
}

type AttentionItem = {
  product: {
    id: string;
    name: string;
    sku: string | null;
    currentStock: { toNumber: () => number } | number | string;
    minimumStock: { toNumber: () => number } | number | string;
  };
  status: "out" | "low";
};

function AttentionPanel({
  items,
  outOfStock,
  lowStock,
}: {
  items: AttentionItem[];
  outOfStock: number;
  lowStock: number;
}) {
  const total = outOfStock + lowStock;

  return (
    <section className="rounded-card border border-border bg-card p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[17px] font-medium sm:text-[18px]">
          Atencion
        </h3>
        <Link
          className="text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
          href="/stock?status=low"
        >
          Ver stock
        </Link>
      </header>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <Chip active>{`Todos - ${total}`}</Chip>
        <Chip>{`Sin stock - ${outOfStock}`}</Chip>
        <Chip>{`Bajo - ${lowStock}`}</Chip>
      </div>

      {items.length ? (
        <ul className="mt-3 grid gap-2 sm:block sm:space-y-2">
          {items.map(({ product, status }) => {
            const isOut = status === "out";
            const stock = decimalToNumber(product.currentStock);
            const minimum = decimalToNumber(product.minimumStock);
            return (
              <li
                className={cn(
                  "grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-[12px] border px-3.5 py-3",
                  isOut
                    ? "border-error/18 bg-error-surface"
                    : "border-transparent bg-warning-surface",
                )}
                key={product.id}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-[13px] font-medium",
                      isOut ? "text-error" : "text-foreground",
                    )}
                  >
                    {product.name}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 truncate font-mono text-[11px] tracking-[0.02em]",
                      isOut ? "text-error/70" : "text-muted-foreground",
                    )}
                  >
                    {product.sku ?? "Sin SKU"} - min {Math.round(minimum)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                    isOut
                      ? "bg-error text-error-foreground"
                      : "bg-warning text-warning-foreground",
                  )}
                >
                  {isOut
                    ? "Sin stock"
                    : `${Math.round(stock)} / ${Math.round(minimum)}`}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-accent-600" strokeWidth={2} />
          Todo el stock dentro de los minimos.
        </div>
      )}
    </section>
  );
}

function Chip({
  active = false,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-pill border px-2.5 py-1 text-[11.5px] font-medium",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-transparent bg-surface-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
