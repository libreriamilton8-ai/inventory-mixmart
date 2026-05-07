import { Plus } from 'lucide-react';
import { Suspense } from 'react';

import { SupplierForm } from '@/components/suppliers/supplier-form';
import {
  DataTable,
  EmptyState,
  FlashMessage,
  PageContentSkeleton,
  PageHeader,
  PaginationBar,
  RecordActions,
  RecordDetailModal,
  RecordEditModal,
  RecordStatusBadge,
  Section,
} from '@/components/shared';
import { FormModal } from '@/components/ui/modal';
import { formatCurrency, formatDateOnly } from '@/lib/format';
import { sumLineCost } from '@/lib/calc';
import { requireActiveUser } from '@/lib/auth';
import { buildPaginationMeta, readPagination } from '@/lib/pagination';
import { canManageCatalog } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import {
  deactivateSupplier,
  reactivateSupplier,
  restoreSupplier,
  softDeleteSupplier,
} from '@/server/actions';
import { FilterBar, SearchFilter, SelectFilter } from '@/components/filters';

type SuppliersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: 'active' | 'inactive' | 'deleted';
    success?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default function SuppliersPage({ searchParams }: SuppliersPageProps) {
  return (
    <div>
      <Suspense fallback={<PageContentSkeleton />}>
        <SuppliersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SuppliersContent({ searchParams }: SuppliersPageProps) {
  const user = await requireActiveUser('/suppliers');
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const status = params.status;
  const canManage = canManageCatalog(user.role);
  const pagination = readPagination(params);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { ruc: { contains: q, mode: 'insensitive' as const } },
            { contactName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status === 'inactive'
      ? { isActive: false }
      : status === 'deleted'
        ? { deletedAt: { not: null } }
        : status === 'active'
          ? { isActive: true }
          : {}),
  };

  const [suppliers, totalItems] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            productSuppliers: true,
            stockEntries: true,
          },
        },
        stockEntries: {
          orderBy: { orderedAt: 'desc' },
          take: 3,
          include: {
            items: { select: { quantity: true, unitCost: true } },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.supplier.count({ where }),
  ]);

  const meta = buildPaginationMeta(totalItems, pagination);

  const headers = [
    'Proveedor',
    'Contacto',
    'Productos',
    'Compras',
    'Estado',
    ...(canManage ? ['Acciones'] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        action={
          canManage ? (
            <FormModal
              size="lg"
              title="Nuevo proveedor"
              description="Registra los datos para vincularlo a entradas y productos."
              trigger={
                <>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Nuevo proveedor
                </>
              }
            >
              <SupplierForm />
            </FormModal>
          ) : null
        }
      />

      {params.success ? (
        <FlashMessage type="success">
          Proveedor guardado correctamente.
        </FlashMessage>
      ) : null}

      <Section>
        <FilterBar>
          <SearchFilter
            label="Buscar"
            name="q"
            placeholder="Nombre, RUC o contacto"
          />

          <SelectFilter
            allLabel="Todos"
            label="Estado"
            name="status"
            options={[
              { label: 'Activos', value: 'active' },
              { label: 'Inactivos', value: 'inactive' },
              ...(canManage ? [{ label: 'Eliminados', value: 'deleted' }] : []),
            ]}
          />
        </FilterBar>
        {suppliers.length ? (
          <DataTable headers={headers}>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {supplier.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    RUC {supplier.ruc}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{supplier.contactName}</p>
                  <p className="text-xs text-muted-foreground">
                    {supplier.phone}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {supplier._count.productSuppliers}
                </td>
                <td className="px-4 py-3">{supplier._count.stockEntries}</td>
                <td className="px-4 py-3">
                  <RecordStatusBadge
                    deletedAt={supplier.deletedAt}
                    isActive={supplier.isActive}
                  />
                </td>
                {canManage ? (
                  <td className="px-4 py-3">
                    <RecordActions
                      deletedAt={supplier.deletedAt}
                      detailTrigger={
                        <RecordDetailModal title="Detalle proveedor">
                          <SupplierDetail supplier={supplier} />
                        </RecordDetailModal>
                      }
                      editTrigger={
                        <RecordEditModal title="Editar proveedor">
                          <SupplierForm supplier={supplier} />
                        </RecordEditModal>
                      }
                      id={supplier.id}
                      isActive={supplier.isActive}
                      onActivate={reactivateSupplier}
                      onDeactivate={deactivateSupplier}
                      onRestore={restoreSupplier}
                      onSoftDelete={softDeleteSupplier}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            title="Sin proveedores"
            description="No hay proveedores con esos filtros."
          />
        )}
        <PaginationBar {...meta} />
      </Section>
    </div>
  );
}

type SupplierDetailProps = {
  supplier: {
    name: string;
    ruc: string;
    contactName: string;
    phone: string;
    address: string | null;
    notes: string | null;
    _count: {
      productSuppliers: number;
      stockEntries: number;
    };
    stockEntries: {
      id: string;
      orderedAt: Date;
      items: {
        quantity: { toNumber: () => number } | number | string;
        unitCost: { toNumber: () => number } | number | string;
      }[];
    }[];
  };
};

function SupplierDetail({ supplier }: SupplierDetailProps) {
  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <DetailBox label="Proveedor" value={supplier.name} />
        <DetailBox label="RUC" value={supplier.ruc} />
        <DetailBox label="Contacto" value={supplier.contactName} />
        <DetailBox label="Telefono" value={supplier.phone} />
        <DetailBox
          className="md:col-span-2"
          label="Direccion"
          value={supplier.address || "Sin direccion registrada"}
        />
        <DetailBox
          className="md:col-span-2"
          label="Notas"
          value={supplier.notes || "Sin notas"}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryBox
          label="Productos vinculados"
          value={String(supplier._count.productSuppliers)}
        />
        <SummaryBox
          label="Compras registradas"
          value={String(supplier._count.stockEntries)}
        />
      </div>

      <div className="rounded-control border border-border bg-surface">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold text-foreground">
            Compras recientes
          </h3>
        </div>
        {supplier.stockEntries.length ? (
          <ul className="divide-y divide-border">
            {supplier.stockEntries.map((entry) => (
              <li
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                key={entry.id}
              >
                <span className="text-muted-foreground">
                  {formatDateOnly(entry.orderedAt)}
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(sumLineCost(entry.items))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            Sin compras recientes.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailBox({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 rounded-control border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-border bg-surface-muted px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
