import {
  EmptyState,
  IdActionForm,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import { formatDecimal } from "@/lib/format";
import { deactivateServiceType, reactivateServiceType } from "@/server/actions";
import type { ServiceKind } from "../../../prisma/generated/client";

export type ServiceTypeRow = {
  id: string;
  name: string;
  kind: ServiceKind;
  unitName: string;
  description: string | null;
  isActive: boolean;
  supplies: {
    id: string;
    quantityPerUnit: { toNumber: () => number } | number | string;
    product: {
      name: string;
      unitName: string;
    };
  }[];
};

export function ServiceTypeList({
  title,
  types,
  canManage,
}: {
  title: string;
  canManage: boolean;
  types: ServiceTypeRow[];
}) {
  return (
    <Section>
      <SectionHeader title={title} />
      {types.length ? (
        <div className="divide-y divide-border">
          {types.map((type) => (
            <div className="px-4 py-3" key={type.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{type.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {type.description || type.unitName}
                  </p>
                </div>
                <StatusBadge tone={type.isActive ? "success" : "warning"}>
                  {type.isActive ? "Activo" : "Inactivo"}
                </StatusBadge>
              </div>
              {type.supplies.length ? (
                <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  {type.supplies.map((supply) => (
                    <li
                      className="rounded-control border border-border bg-surface-muted px-3 py-2"
                      key={supply.id}
                    >
                      {supply.product.name}: {formatDecimal(supply.quantityPerUnit, 3)}{" "}
                      {supply.product.unitName}
                    </li>
                  ))}
                </ul>
              ) : null}
              {canManage ? (
                <div className="mt-3">
                  <IdActionForm
                    action={
                      type.isActive ? deactivateServiceType : reactivateServiceType
                    }
                    id={type.id}
                  >
                    {type.isActive ? "Desactivar" : "Activar"}
                  </IdActionForm>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin tipos" />
      )}
    </Section>
  );
}
