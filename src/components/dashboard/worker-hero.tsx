import { cn } from "@/lib/utils";

type WorkerHeroProps = {
  entriesToday: number;
  outputsToday: number;
  salesToday: number;
  wasteToday: number;
  servicesToday: number;
  outOfStockCount: number;
  lowStockCount: number;
};

export function WorkerHero({
  entriesToday,
  outputsToday,
  salesToday,
  wasteToday,
  servicesToday,
  outOfStockCount,
  lowStockCount,
}: WorkerHeroProps) {
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
