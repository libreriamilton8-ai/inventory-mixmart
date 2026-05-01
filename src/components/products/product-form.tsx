import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { Select } from "@/components/ui/select";
import { productCategoryLabels } from "@/lib/format";
import { createProduct, updateProduct } from "@/server/actions";
import type { ProductCategory } from "../../../prisma/generated/client";

const categories: ProductCategory[] = ["SCHOOL_SUPPLIES", "BAZAAR", "SNACKS"];

export type ProductFormValues = {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  category: ProductCategory;
  unitName: string;
  purchasePrice: unknown;
  salePrice: unknown;
  minimumStock: unknown;
};

export function ProductForm({ product }: { product?: ProductFormValues }) {
  const isEdit = Boolean(product);

  return (
    <form
      action={isEdit ? updateProduct : createProduct}
      className="grid gap-4 p-6 md:grid-cols-3"
    >
      {isEdit && product ? (
        <input name="id" type="hidden" value={product.id} />
      ) : null}
      <Field className="md:col-span-2" label="Nombre">
        <input className="input" defaultValue={product?.name} name="name" required />
      </Field>
      <Field label="Categoria">
        <Select
          defaultValue={product?.category ?? "SCHOOL_SUPPLIES"}
          name="category"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {productCategoryLabels[item]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="SKU">
        <input className="input" defaultValue={product?.sku ?? ""} name="sku" />
      </Field>
      <Field label="Codigo barras">
        <input
          className="input"
          defaultValue={product?.barcode ?? ""}
          name="barcode"
        />
      </Field>
      <Field label="Unidad">
        <input
          className="input"
          defaultValue={product?.unitName ?? "unidad"}
          name="unitName"
          required
        />
      </Field>
      <Field label="Costo ref.">
        <input
          className="input"
          defaultValue={product?.purchasePrice?.toString() ?? "0"}
          min="0"
          name="purchasePrice"
          required
          step="0.01"
          type="number"
        />
      </Field>
      <Field label="Venta sugerida">
        <input
          className="input"
          defaultValue={product?.salePrice?.toString() ?? ""}
          min="0"
          name="salePrice"
          step="0.01"
          type="number"
        />
      </Field>
      <Field label="Stock minimo">
        <input
          className="input"
          defaultValue={product?.minimumStock?.toString() ?? "0"}
          min="0"
          name="minimumStock"
          required
          step="0.001"
          type="number"
        />
      </Field>
      <Field className="md:col-span-3" label="Descripcion">
        <textarea
          className="input min-h-24 py-2"
          defaultValue={product?.description ?? ""}
          name="description"
        />
      </Field>
      <div className="flex justify-end md:col-span-3">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {isEdit ? "Guardar cambios" : "Crear producto"}
        </SubmitButton>
      </div>
    </form>
  );
}
