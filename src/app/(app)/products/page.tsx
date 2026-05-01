import { Pencil, Plus } from 'lucide-react';
import { Suspense } from 'react';

import { FilterBar, SearchFilter, SelectFilter } from '@/components/filters';
import { ProductForm } from '@/components/products/product-form';
import {
  DataTable,
  EmptyState,
  FlashMessage,
  PageHeader,
  ProductCategoryBadge,
  RecordActions,
  RecordStatusBadge,
  Section,
  StatusBadge,
  TableSkeleton,
} from '@/components/shared';
import { FormModal } from '@/components/ui/modal';
import {
  decimalToNumber,
  formatCurrency,
  formatDecimal,
  productCategoryLabels,
} from '@/lib/format';
import { requireActiveUser } from '@/lib/auth';
import { canManageCatalog } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import {
  deactivateProduct,
  reactivateProduct,
  restoreProduct,
  softDeleteProduct,
} from '@/server/actions';
import type { ProductCategory } from '../../../../prisma/generated/client';

type ProductsSearchParams = {
  q?: string;
  category?: ProductCategory;
  status?: 'active' | 'inactive' | 'deleted';
  success?: string;
};

type ProductsPageProps = {
  searchParams: Promise<ProductsSearchParams>;
};

const categories: ProductCategory[] = ['SCHOOL_SUPPLIES', 'BAZAAR', 'SNACKS'];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const user = await requireActiveUser('/products');
  const params = await searchParams;
  const canManage = canManageCatalog(user.role);

  const filterKey = JSON.stringify({
    category: params.category ?? '',
    q: params.q ?? '',
    status: params.status ?? '',
  });

  const statusOptions = [
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    ...(canManage ? [{ label: 'Eliminados', value: 'deleted' }] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        action={
          canManage ? (
            <FormModal
              size="lg"
              title="Nuevo producto"
              description="Define los datos basicos y de inventario."
              trigger={
                <>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Nuevo producto
                </>
              }
            >
              <ProductForm />
            </FormModal>
          ) : null
        }
      />

      {params.success ? (
        <FlashMessage type="success">
          Producto guardado correctamente.
        </FlashMessage>
      ) : null}

      <FilterBar>
        <SearchFilter label="Buscar" name="q" placeholder="Nombre, SKU o codigo" />
        <SelectFilter
          allLabel="Todas"
          label="Categoria"
          name="category"
          options={categories.map((item) => ({
            label: productCategoryLabels[item],
            value: item,
          }))}
        />
        <SelectFilter
          allLabel="Activos"
          label="Estado"
          name="status"
          options={statusOptions}
        />
      </FilterBar>

      <Suspense
        fallback={<TableSkeleton columns={6} rows={6} />}
        key={filterKey}
      >
        <ProductsList canManage={canManage} role={user.role} searchParams={params} />
      </Suspense>
    </div>
  );
}

async function ProductsList({
  canManage,
  role,
  searchParams,
}: {
  canManage: boolean;
  role: 'ADMIN' | 'WORKER';
  searchParams: ProductsSearchParams;
}) {
  const q = searchParams.q?.trim() ?? '';
  const category = searchParams.category;
  const status = searchParams.status ?? 'active';

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { barcode: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(status === 'inactive'
        ? { isActive: false }
        : status === 'deleted'
          ? { deletedAt: { not: null } }
          : { isActive: true }),
    },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    take: 100,
  });

  if (!products.length) {
    return (
      <Section>
        <EmptyState
          title="Sin productos"
          description="No hay productos con esos filtros."
        />
      </Section>
    );
  }

  const headers = [
    'Producto',
    'Categoria',
    'Stock',
    'Minimo',
    ...(role === 'ADMIN' ? ['Costo', 'Venta sug.'] : []),
    'Estado',
    ...(canManage ? ['Acciones'] : []),
  ];

  return (
    <Section>
      <DataTable headers={headers}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-4 py-3">
              <p className="font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.sku || product.barcode || product.unitName}
              </p>
            </td>
            <td className="px-4 py-3">
              <ProductCategoryBadge category={product.category} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge tone={stockTone(product)}>
                {formatDecimal(product.currentStock, 3)}
              </StatusBadge>
            </td>
            <td className="px-4 py-3">{formatDecimal(product.minimumStock, 3)}</td>
            {role === 'ADMIN' ? (
              <td className="px-4 py-3">{formatCurrency(product.purchasePrice)}</td>
            ) : null}
            {role === 'ADMIN' ? (
              <td className="px-4 py-3">
                {product.salePrice ? formatCurrency(product.salePrice) : '-'}
              </td>
            ) : null}
            <td className="px-4 py-3">
              <RecordStatusBadge
                deletedAt={product.deletedAt}
                isActive={product.isActive}
              />
            </td>
            {canManage ? (
              <td className="px-4 py-3">
                <RecordActions
                  deletedAt={product.deletedAt}
                  editTrigger={
                    <FormModal
                      size="lg"
                      title="Editar producto"
                      description="Actualiza datos y precios."
                      triggerClassName="btn-soft"
                      trigger={
                        <>
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                          Editar
                        </>
                      }
                    >
                      <ProductForm product={product} />
                    </FormModal>
                  }
                  id={product.id}
                  isActive={product.isActive}
                  onActivate={reactivateProduct}
                  onDeactivate={deactivateProduct}
                  onRestore={restoreProduct}
                  onSoftDelete={softDeleteProduct}
                />
              </td>
            ) : null}
          </tr>
        ))}
      </DataTable>
    </Section>
  );
}

function stockTone(product: { currentStock: unknown; minimumStock: unknown }) {
  const current = decimalToNumber(product.currentStock as never);
  const minimum = decimalToNumber(product.minimumStock as never);

  if (current <= 0) {
    return 'error';
  }

  if (current <= minimum) {
    return 'warning';
  }

  return 'success';
}
