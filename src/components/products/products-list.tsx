import { Pencil } from "lucide-react";

import { ProductForm } from "@/components/products/product-form";
import {
  DataTable,
  EmptyState,
  PaginationBar,
  ProductCategoryBadge,
  RecordActions,
  RecordStatusBadge,
  Section,
  StatusBadge,
} from "@/components/shared";
import { FormModal } from "@/components/ui/modal";
import {
  decimalToNumber,
  formatCurrency,
  formatDecimal,
} from "@/lib/format";
import { buildPaginationMeta, readPagination } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import {
  deactivateProduct,
  reactivateProduct,
  restoreProduct,
  softDeleteProduct,
} from "@/server/actions";
import type { ProductCategory } from "../../../prisma/generated/client";

export type ProductsSearchParams = {
  q?: string;
  category?: ProductCategory;
  status?: "active" | "inactive" | "deleted";
  page?: string;
  pageSize?: string;
};

export async function ProductsList({
  canManage,
  role,
  searchParams,
}: {
  canManage: boolean;
  role: "ADMIN" | "WORKER";
  searchParams: ProductsSearchParams;
}) {
  const q = searchParams.q?.trim() ?? "";
  const category = searchParams.category;
  const status = searchParams.status ?? "active";
  const pagination = readPagination(searchParams);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { barcode: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
    ...(status === "inactive"
      ? { isActive: false }
      : status === "deleted"
        ? { deletedAt: { not: null } }
        : { isActive: true }),
  };

  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.product.count({ where }),
  ]);

  const meta = buildPaginationMeta(totalItems, pagination);

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
    "Producto",
    "Categoria",
    "Stock",
    "Minimo",
    ...(role === "ADMIN" ? ["Costo", "Venta sug."] : []),
    "Estado",
    ...(canManage ? ["Acciones"] : []),
  ];

  return (
    <Section>
      <DataTable headers={headers} containerClassName="overflow-x-auto">
        {products.map((product) => {
          const current = decimalToNumber(product.currentStock);
          const minimum = decimalToNumber(product.minimumStock);
          const tone =
            current <= 0 ? "error" : current <= minimum ? "warning" : "success";

          return (
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
                <StatusBadge tone={tone}>
                  {formatDecimal(product.currentStock, 3)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">
                {formatDecimal(product.minimumStock, 3)}
              </td>
              {role === "ADMIN" ? (
                <td className="px-4 py-3">
                  {formatCurrency(product.purchasePrice)}
                </td>
              ) : null}
              {role === "ADMIN" ? (
                <td className="px-4 py-3">
                  {product.salePrice ? formatCurrency(product.salePrice) : "-"}
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
          );
        })}
      </DataTable>
      <PaginationBar {...meta} />
    </Section>
  );
}
