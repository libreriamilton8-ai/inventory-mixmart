import { Plus } from "lucide-react";

import { OutputForm } from "@/components/outputs/output-form";
import { OutputsPanel } from "@/components/outputs/outputs-panel";
import {
  FlashMessage,
  PageHeader,
} from "@/components/shared";
import { FormModal } from "@/components/ui/modal";
import { formatDecimal } from "@/lib/format";
import { requireActiveUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getStockOutputHistory,
  type StockOutputHistoryParams,
} from "@/services/stock-output.service";

type OutputsPageProps = {
  searchParams: Promise<
    StockOutputHistoryParams & { success?: string; error?: string }
  >;
};

export default async function OutputsPage({ searchParams }: OutputsPageProps) {
  const params = await searchParams;
  const [, products, initialPayload] = await Promise.all([
    requireActiveUser("/outputs"),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        unitName: true,
        currentStock: true,
        salePrice: true,
        brand: { select: { name: true } },
      },
      take: 300,
    }),
    getStockOutputHistory(params),
  ]);

  return (
    <div className="space-y-3">
      <PageHeader
        action={
          <FormModal
            size="xl"
            title="Nueva salida"
            description="Registra ventas, mermas o uso interno."
            trigger={
              <>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nueva salida
              </>
            }
          >
            <OutputForm
              products={products.map((product) => ({
                id: product.id,
                name: product.name,
                category: product.category,
                unitName: product.unitName,
                currentStock: formatDecimal(product.currentStock, 3),
                salePrice: product.salePrice
                  ? formatDecimal(product.salePrice, 2)
                  : null,
                brandName: product.brand?.name ?? null,
              }))}
            />
          </FormModal>
        }
      />

      {params.success ? (
        <FlashMessage type="success">Salida registrada correctamente.</FlashMessage>
      ) : null}
      {params.error === "stock" ? (
        <FlashMessage type="error">
          Stock insuficiente para completar la salida.
        </FlashMessage>
      ) : null}

      <OutputsPanel initialParams={params} initialPayload={initialPayload} />
    </div>
  );
}
