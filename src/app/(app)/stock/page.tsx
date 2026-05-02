import { Suspense } from 'react';

import { FilterBar, SearchFilter, SelectFilter } from '@/components/filters';
import { TableSkeleton } from '@/components/shared';
import { StockTable } from '@/components/stock/stock-table';
import { productCategoryLabels } from '@/lib/format';
import { requireActiveUser } from '@/lib/auth';
import type { ProductCategory } from '../../../../prisma/generated/client';

type StockSearchParams = {
  q?: string;
  category?: ProductCategory;
  status?: 'all' | 'low' | 'out';
};

type StockPageProps = {
  searchParams: Promise<StockSearchParams>;
};

const categories: ProductCategory[] = ['SCHOOL_SUPPLIES', 'BAZAAR', 'SNACKS'];

export default async function StockPage({ searchParams }: StockPageProps) {
  await requireActiveUser('/stock');
  const params = await searchParams;

  const filterKey = `${params.q ?? ''}|${params.category ?? ''}|${params.status ?? ''}`;

  return (
    <div className="space-y-5">
      <FilterBar>
        <SearchFilter label="Buscar" name="q" placeholder="Producto" />
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
          allLabel="Todo"
          label="Vista"
          name="status"
          options={[
            { label: 'Bajo stock', value: 'low' },
            { label: 'Sin stock', value: 'out' },
          ]}
        />
      </FilterBar>

      <Suspense
        fallback={<TableSkeleton columns={7} rows={6} />}
        key={filterKey}
      >
        <StockTable params={params} />
      </Suspense>
    </div>
  );
}
