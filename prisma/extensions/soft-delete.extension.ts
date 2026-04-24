import { Prisma } from "../generated/client";

type UnknownRecord = Record<string, unknown>;

type SoftDeleteModelConfig = {
  field?: string;
  deletedValue?: () => Date | string;
  delegate?: string;
};

type SoftDeleteConfig = {
  models: Record<string, SoftDeleteModelConfig>;
};

type ModelDelegate = {
  update(args: unknown): Promise<unknown>;
  updateMany(args: unknown): Promise<Prisma.BatchPayload>;
  delete(args: unknown): Promise<unknown>;
  deleteMany(args?: unknown): Promise<Prisma.BatchPayload>;
};

const readOperations = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

const writeWhereOperations = new Set([
  "update",
  "updateMany",
  "updateManyAndReturn",
]);

function modelToDelegateName(model: string) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function getModelDelegate(
  client: unknown,
  model: string,
  modelConfig: SoftDeleteModelConfig,
) {
  const delegateName = modelConfig.delegate ?? modelToDelegateName(model);
  const delegate = (client as Record<string, unknown>)[delegateName];

  if (!delegate || typeof delegate !== "object") {
    throw new Error(`Prisma delegate "${delegateName}" was not found.`);
  }

  return delegate as ModelDelegate;
}

function getSoftDeleteField(modelConfig: SoftDeleteModelConfig) {
  return modelConfig.field ?? "deletedAt";
}

function getDeletedValue(modelConfig: SoftDeleteModelConfig) {
  return modelConfig.deletedValue?.() ?? new Date();
}

function hasDefinedOwnField(record: UnknownRecord, field: string) {
  return (
    Object.prototype.hasOwnProperty.call(record, field) &&
    record[field] !== undefined
  );
}

export function mergeWhereWithNotDeleted(
  where: UnknownRecord | undefined,
  field = "deletedAt",
) {
  if (!where) {
    return { [field]: null };
  }

  if (hasDefinedOwnField(where, field)) {
    return where;
  }

  return {
    ...where,
    [field]: null,
  };
}

function mergeWhereWithDeleted(
  where: UnknownRecord | undefined,
  field = "deletedAt",
) {
  if (!where) {
    return { [field]: { not: null } };
  }

  if (hasDefinedOwnField(where, field)) {
    return where;
  }

  return {
    ...where,
    [field]: { not: null },
  };
}

function withNotDeletedWhere(args: unknown, field: string) {
  const queryArgs = (args ?? {}) as UnknownRecord;

  return {
    ...queryArgs,
    where: mergeWhereWithNotDeleted(
      queryArgs.where as UnknownRecord | undefined,
      field,
    ),
  };
}

function getModelConfig(config: SoftDeleteConfig, model: string | undefined) {
  return model ? config.models[model] : undefined;
}

function ensureSoftDeleteConfig(
  config: SoftDeleteConfig,
  model: string | undefined,
) {
  const modelConfig = getModelConfig(config, model);

  if (!model || !modelConfig) {
    throw new Error(`Model "${model ?? "unknown"}" is not configured for soft delete.`);
  }

  return { model, modelConfig };
}

export function defineSoftDeleteExtension(config: SoftDeleteConfig) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: "soft-delete",
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const modelConfig = getModelConfig(config, model);

            if (!modelConfig) {
              return query(args);
            }

            const field = getSoftDeleteField(modelConfig);

            if (operation === "upsert") {
              throw new Error(
                `Upsert is disabled for soft-delete model "${model}". Use update, restore, or prismaRaw for an explicit administrative write.`,
              );
            }

            if (readOperations.has(operation) || writeWhereOperations.has(operation)) {
              return query(withNotDeletedWhere(args, field));
            }

            if (operation === "delete") {
              const queryArgs = args as UnknownRecord;
              const delegate = getModelDelegate(client, model, modelConfig);

              return delegate.update({
                ...queryArgs,
                where: mergeWhereWithNotDeleted(
                  queryArgs.where as UnknownRecord | undefined,
                  field,
                ),
                data: {
                  [field]: getDeletedValue(modelConfig),
                },
              });
            }

            if (operation === "deleteMany") {
              const queryArgs = (args ?? {}) as UnknownRecord;
              const delegate = getModelDelegate(client, model, modelConfig);

              return delegate.updateMany({
                ...queryArgs,
                where: mergeWhereWithNotDeleted(
                  queryArgs.where as UnknownRecord | undefined,
                  field,
                ),
                data: {
                  [field]: getDeletedValue(modelConfig),
                },
              });
            }

            return query(args);
          },
        },
      },
      model: {
        $allModels: {
          async restore<T>(
            this: T,
            where: Prisma.Args<T, "update">["where"],
          ): Promise<Prisma.Result<T, Prisma.Args<T, "update">, "update">> {
            const context = Prisma.getExtensionContext(this) as unknown as
              ModelDelegate & {
                $name?: string;
              };
            const { modelConfig } = ensureSoftDeleteConfig(config, context.$name);
            const field = getSoftDeleteField(modelConfig);

            return context.update({
              where: mergeWhereWithDeleted(where as UnknownRecord | undefined, field),
              data: {
                [field]: null,
              },
            }) as Promise<Prisma.Result<T, Prisma.Args<T, "update">, "update">>;
          },

          async restoreMany<T>(
            this: T,
            where?: Prisma.Args<T, "updateMany">["where"],
          ): Promise<Prisma.BatchPayload> {
            const context = Prisma.getExtensionContext(this) as unknown as
              ModelDelegate & {
                $name?: string;
              };
            const { modelConfig } = ensureSoftDeleteConfig(config, context.$name);
            const field = getSoftDeleteField(modelConfig);

            return context.updateMany({
              where: mergeWhereWithDeleted(where as UnknownRecord | undefined, field),
              data: {
                [field]: null,
              },
            });
          },

          async hardDelete<T>(
            this: T,
            where: Prisma.Args<T, "delete">["where"],
          ): Promise<Prisma.Result<T, Prisma.Args<T, "delete">, "delete">> {
            const context = Prisma.getExtensionContext(this) as { $name?: string };
            const { model, modelConfig } = ensureSoftDeleteConfig(
              config,
              context.$name,
            );
            const delegate = getModelDelegate(client, model, modelConfig);

            return delegate.delete({ where }) as Promise<
              Prisma.Result<T, Prisma.Args<T, "delete">, "delete">
            >;
          },

          async hardDeleteMany<T>(
            this: T,
            where?: Prisma.Args<T, "deleteMany">["where"],
          ): Promise<Prisma.BatchPayload> {
            const context = Prisma.getExtensionContext(this) as { $name?: string };
            const { model, modelConfig } = ensureSoftDeleteConfig(
              config,
              context.$name,
            );
            const delegate = getModelDelegate(client, model, modelConfig);

            return delegate.deleteMany({ where });
          },
        },
      },
    }),
  );
}

export const inventorySoftDeleteExtension = defineSoftDeleteExtension({
  models: {
    User: {},
    Supplier: {},
    Product: {},
    ProductSupplier: {},
    ServiceType: {},
    ServiceTypeSupply: {},
  },
});
