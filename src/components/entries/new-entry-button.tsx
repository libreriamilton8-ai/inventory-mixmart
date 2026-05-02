import { Plus } from "lucide-react";

import { EntryForm } from "@/components/entries/entry-form";
import { FormModal } from "@/components/ui/modal";
import prisma from "@/lib/prisma";

export async function NewEntryButton() {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 200,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unitName: true },
      take: 300,
    }),
  ]);

  return (
    <FormModal
      size="xl"
      title="Nueva entrada"
      description="Registra una orden o recepcion de mercaderia."
      trigger={
        <>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nueva entrada
        </>
      }
    >
      <EntryForm products={products} suppliers={suppliers} />
    </FormModal>
  );
}

export function NewEntryButtonFallback() {
  return (
    <button
      className="btn btn-primary"
      type="button"
      disabled
      aria-busy="true"
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      Nueva entrada
    </button>
  );
}
