import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/client';
import type {
  ProductCategory,
  ServiceKind,
  ServiceStatus,
  StockEntryStatus,
  StockOutputReason,
  UserRole,
} from './generated/client';
import { getDirectDatabaseConnection } from '../src/lib/database-url';
import { hashPassword } from '../src/lib/password';

// =====================================================================
// Configuration via env vars (override with: BULK_PRODUCTS=2000 npm run db:seed:bulk)
// =====================================================================
const cfg = {
  users: Number(process.env.BULK_USERS) || 30,
  suppliers: Number(process.env.BULK_SUPPLIERS) || 80,
  products: Number(process.env.BULK_PRODUCTS) || 1500,
  productSupplierLinks: Number(process.env.BULK_PRODUCT_SUPPLIER_LINKS) || 4000,
  serviceTypes: Number(process.env.BULK_SERVICE_TYPES) || 40,
  stockEntries: Number(process.env.BULK_STOCK_ENTRIES) || 600,
  stockOutputs: Number(process.env.BULK_STOCK_OUTPUTS) || 2500,
  serviceRecords: Number(process.env.BULK_SERVICE_RECORDS) || 1500,
  daysBack: Number(process.env.BULK_DAYS_BACK) || 180,
  defaultPassword: process.env.BULK_PASSWORD || 'Demo1234!',
};

const database = getDirectDatabaseConnection();
const searchPath = `${database.schema},public`;
const pgOptions = process.env.PGOPTIONS ?? '';
if (!pgOptions.includes('search_path')) {
  process.env.PGOPTIONS = [pgOptions, `--search_path=${searchPath}`]
    .filter(Boolean)
    .join(' ');
}
const adapter = new PrismaPg(
  { connectionString: database.connectionString },
  { schema: database.schema },
);
const prisma = new PrismaClient({ adapter });

// =====================================================================
// Deterministic random helpers (seeded RNG so re-runs are stable)
// =====================================================================
let seed = 0xc0ffee;
function rand() {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function int(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function decimal(min: number, max: number, digits = 2) {
  const value = rand() * (max - min) + min;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
function pad(n: number, length = 4) {
  return String(n).padStart(length, '0');
}

const FIRST_NAMES = [
  'Ana', 'Luis', 'Maria', 'Carlos', 'Elena', 'Jorge', 'Lucia', 'Pedro', 'Rosa',
  'Diego', 'Carmen', 'Miguel', 'Sofia', 'Andres', 'Gabriela', 'Roberto', 'Patricia',
  'Fernando', 'Daniela', 'Ricardo', 'Valeria', 'Eduardo', 'Camila', 'Manuel',
  'Beatriz', 'Hugo', 'Natalia', 'Cesar', 'Veronica', 'Alberto', 'Adriana',
];
const LAST_NAMES = [
  'Rodriguez', 'Garcia', 'Lopez', 'Martinez', 'Gonzalez', 'Perez', 'Sanchez',
  'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Reyes',
  'Morales', 'Castillo', 'Romero', 'Mendoza', 'Vargas', 'Castro', 'Ortiz',
  'Silva', 'Rojas', 'Medina', 'Aguilar', 'Vega', 'Salazar', 'Guerrero',
];

const SCHOOL_NAMES = [
  'Cuaderno', 'Lapiz', 'Borrador', 'Tajador', 'Regla', 'Mochila', 'Cartuchera',
  'Folder', 'Hojas', 'Plumones', 'Marcadores', 'Tempera', 'Acuarela', 'Tijera',
  'Goma', 'Engrampador', 'Perforador', 'Resaltador', 'Lapicero', 'Compas',
  'Calculadora', 'Diccionario', 'Atlas', 'Crayolas', 'Plastilina', 'Pegamento',
];
const SCHOOL_VARIANTS = [
  'A4', 'oficio', '100 hojas', 'cuadriculado', 'rayado', 'punteado', 'azul',
  'rojo', 'negro', 'verde', '12 unid', '24 unid', 'jumbo', 'fino', 'estandar',
  'premium', 'escolar', 'profesional',
];

const BAZAAR_NAMES = [
  'Vaso', 'Plato', 'Cuchillo', 'Tenedor', 'Cuchara', 'Olla', 'Sarten',
  'Bandeja', 'Toalla', 'Sabana', 'Almohada', 'Funda', 'Mantel', 'Servilleta',
  'Escoba', 'Recogedor', 'Trapo', 'Cubo', 'Detergente', 'Jabon', 'Champu',
  'Pasta dental', 'Cepillo', 'Peine', 'Espejo',
];
const BAZAAR_VARIANTS = [
  'plastico', 'vidrio', 'metal', 'mediano', 'grande', 'chico', 'pack 4',
  'pack 6', 'antiadherente', 'inox', 'colorido', 'blanco', 'negro', 'familiar',
  'individual',
];

const SNACK_NAMES = [
  'Chocolate', 'Galletas', 'Caramelos', 'Chupetes', 'Chicles', 'Papitas',
  'Cancha', 'Mani', 'Pasas', 'Wafer', 'Bizcocho', 'Pan', 'Yogurt', 'Leche',
  'Jugo', 'Gaseosa', 'Agua', 'Cafe', 'Te', 'Cocoa', 'Avena', 'Cereal',
  'Mermelada', 'Miel',
];
const SNACK_VARIANTS = [
  '100g', '200g', '500g', '1kg', 'lata', 'botella', 'caja x12', 'caja x24',
  'sabor fresa', 'sabor vainilla', 'sabor chocolate', 'sin azucar', 'integral',
  'tradicional',
];

const UNITS = ['unidad', 'paquete', 'caja', 'docena', 'kg', 'litro', 'pack'];

const SERVICE_NAMES = [
  'Impresion B/N', 'Impresion color', 'Anillado', 'Espiralado', 'Empastado',
  'Plastificado', 'Fotocopia', 'Escaneo', 'Tipeo', 'Diseno', 'Reparacion lapicero',
  'Forrado de cuaderno', 'Recarga tinta', 'Folder personalizado', 'Tarjetas',
  'Volantes', 'Banner', 'Sticker', 'Sello', 'Membretado',
];

// =====================================================================
// Domain helpers
// =====================================================================
async function clearMutableData() {
  console.log('  - clearing existing operational data (movements, outputs, entries, services)');
  // Deletion order respects FKs.
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.stock_movements`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.service_consumptions`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.service_records`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.stock_output_items`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.stock_outputs`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.stock_entry_items`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${database.schema}.stock_entries`,
  ).catch(() => {});
  // Reset stocks for products that already exist so triggers reapply cleanly.
  await prisma.$executeRawUnsafe(
    `UPDATE ${database.schema}.products SET current_stock = 0`,
  ).catch(() => {});
}

async function seedUsers(): Promise<{ id: string; role: UserRole }[]> {
  console.log(`  - users (~${cfg.users})`);
  const passwordHash = await hashPassword(cfg.defaultPassword);
  const users: { id: string; role: UserRole }[] = [];

  // ensure 1 ADMIN exists
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: 'admin@mixmart.local',
      firstName: 'Admin',
      lastName: 'Mixmart',
      role: 'ADMIN',
      passwordHash,
      isActive: true,
    },
    update: { isActive: true, deletedAt: null, passwordHash },
  });
  users.push({ id: admin.id, role: 'ADMIN' });

  for (let i = 1; i < cfg.users; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const username = `${first.toLowerCase()}.${last.toLowerCase()}.${pad(i, 3)}`;
    const role: UserRole = i % 8 === 0 ? 'ADMIN' : 'WORKER';
    const user = await prisma.user.upsert({
      where: { username },
      create: {
        username,
        email: `${username}@mixmart.local`,
        firstName: first,
        lastName: last,
        role,
        passwordHash,
        phone: `+519${pad(int(0, 99_999_999), 8)}`,
        dni: pad(int(10_000_000, 99_999_999), 8),
        isActive: true,
      },
      update: { isActive: true, deletedAt: null },
    });
    users.push({ id: user.id, role });
  }
  return users;
}

async function seedSuppliers(): Promise<string[]> {
  console.log(`  - suppliers (~${cfg.suppliers})`);
  const ids: string[] = [];
  for (let i = 0; i < cfg.suppliers; i++) {
    const ruc = `20${pad(100_000_000 + i, 9)}`;
    const supplier = await prisma.supplier.upsert({
      where: { ruc },
      create: {
        ruc,
        name: `Distribuidora ${pick(LAST_NAMES)} ${pad(i, 3)} S.A.C.`,
        contactName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: `+519${pad(int(0, 99_999_999), 8)}`,
        address: `Av. ${pick(LAST_NAMES)} ${int(100, 9999)}, Lima`,
        notes: 'Proveedor importado masivamente para pruebas.',
        isActive: rand() > 0.05,
      },
      update: { deletedAt: null },
    });
    ids.push(supplier.id);
  }
  return ids;
}

async function seedProducts(): Promise<{ id: string; category: ProductCategory; purchasePrice: number; salePrice: number }[]> {
  console.log(`  - products (~${cfg.products})`);
  const products: { id: string; category: ProductCategory; purchasePrice: number; salePrice: number }[] = [];

  for (let i = 0; i < cfg.products; i++) {
    const r = rand();
    let category: ProductCategory;
    let baseName: string;
    let variant: string;

    if (r < 0.45) {
      category = 'SCHOOL_SUPPLIES';
      baseName = pick(SCHOOL_NAMES);
      variant = pick(SCHOOL_VARIANTS);
    } else if (r < 0.78) {
      category = 'BAZAAR';
      baseName = pick(BAZAAR_NAMES);
      variant = pick(BAZAAR_VARIANTS);
    } else {
      category = 'SNACKS';
      baseName = pick(SNACK_NAMES);
      variant = pick(SNACK_VARIANTS);
    }

    const sku = `${category.slice(0, 3)}-${pad(i, 5)}`;
    const purchasePrice = decimal(0.5, 80);
    const salePrice = Math.round(purchasePrice * decimal(1.2, 1.7) * 100) / 100;
    const minimumStock = int(2, 25);

    const product = await prisma.product.upsert({
      where: { sku },
      create: {
        sku,
        barcode: `78${pad(int(100_000_000, 999_999_999), 9)}`,
        name: `${baseName} ${variant} ${pad(i, 4)}`,
        description: `${baseName} variante ${variant}.`,
        category,
        unitName: pick(UNITS),
        purchasePrice,
        salePrice,
        minimumStock,
      },
      update: {
        purchasePrice,
        salePrice,
        minimumStock,
        isActive: true,
        deletedAt: null,
      },
    });

    products.push({
      id: product.id,
      category,
      purchasePrice,
      salePrice,
    });

    if ((i + 1) % 200 === 0) {
      console.log(`      ${i + 1} / ${cfg.products}`);
    }
  }

  return products;
}

async function seedProductSupplierLinks(
  products: { id: string }[],
  suppliers: string[],
) {
  console.log(`  - product-supplier links (~${cfg.productSupplierLinks})`);
  let created = 0;
  for (let i = 0; i < cfg.productSupplierLinks && created < cfg.productSupplierLinks; i++) {
    const product = products[int(0, products.length - 1)];
    const supplierId = suppliers[int(0, suppliers.length - 1)];
    try {
      await prisma.productSupplier.upsert({
        where: {
          productId_supplierId: {
            productId: product.id,
            supplierId,
          },
        },
        create: {
          productId: product.id,
          supplierId,
          supplierProductCode: `EXT-${pad(i, 6)}`,
          isPreferred: rand() < 0.15,
        },
        update: {
          deletedAt: null,
        },
      });
      created++;
    } catch {
      // unique conflicts on isPreferred re-attempt: just continue
    }
  }
}

async function seedServiceTypes(): Promise<{ id: string; kind: ServiceKind }[]> {
  console.log(`  - service types (~${cfg.serviceTypes})`);
  const types: { id: string; kind: ServiceKind }[] = [];

  for (let i = 0; i < cfg.serviceTypes; i++) {
    const baseName = SERVICE_NAMES[i % SERVICE_NAMES.length];
    const name = i < SERVICE_NAMES.length ? baseName : `${baseName} variante ${i - SERVICE_NAMES.length + 1}`;
    const kind: ServiceKind = rand() < 0.7 ? 'IN_HOUSE' : 'OUTSOURCED';

    // Don't touch `kind` on update: a DB trigger forbids changing it once
    // service records reference the type. Keep the existing kind for already
    // existing rows.
    const type = await prisma.serviceType.upsert({
      where: { name },
      create: {
        name,
        kind,
        unitName: pick(['servicio', 'copia', 'hora', 'pagina']),
        description: `Servicio ${baseName} generado para pruebas.`,
      },
      update: { deletedAt: null, isActive: true },
    });
    types.push({ id: type.id, kind: type.kind });
  }
  return types;
}

async function seedStockEntries(
  products: { id: string; purchasePrice: number }[],
  suppliers: string[],
  workers: string[],
) {
  console.log(`  - stock entries (~${cfg.stockEntries})`);
  let created = 0;
  const minutesInWindow = cfg.daysBack * 24 * 60;

  for (let i = 0; i < cfg.stockEntries; i++) {
    const supplierId = suppliers[int(0, suppliers.length - 1)];
    const createdById = workers[int(0, workers.length - 1)];
    const minutesAgo = int(0, minutesInWindow);
    const orderedAt = new Date(Date.now() - minutesAgo * 60 * 1000);
    const status: StockEntryStatus = rand() < 0.85 ? 'RECEIVED' : 'ORDERED';
    const itemCount = int(2, 12);
    const itemProducts = new Set<string>();
    const items: { productId: string; quantity: number; unitCost: number }[] = [];

    while (items.length < itemCount) {
      const product = products[int(0, products.length - 1)];
      if (itemProducts.has(product.id)) continue;
      itemProducts.add(product.id);
      const cost = Math.round(product.purchasePrice * decimal(0.85, 1.1) * 100) / 100;
      items.push({
        productId: product.id,
        quantity: int(5, 60),
        unitCost: cost,
      });
    }

    await prisma.stockEntry.create({
      data: {
        supplierId,
        createdById,
        status,
        orderedAt,
        receivedAt: status === 'RECEIVED' ? orderedAt : null,
        referenceNumber: `BULK-${pad(i, 6)}`,
        notes: 'Entrada generada en seed masivo.',
        items: { create: items },
      },
    });
    created++;

    if (created % 100 === 0) {
      console.log(`      ${created} / ${cfg.stockEntries}`);
    }
  }
}

async function seedStockOutputs(
  products: { id: string; salePrice: number }[],
  workers: string[],
) {
  console.log(`  - stock outputs (~${cfg.stockOutputs})`);
  const reasons: StockOutputReason[] = ['SALE', 'SALE', 'SALE', 'SALE', 'WASTE', 'INTERNAL_USE'];
  const minutesInWindow = cfg.daysBack * 24 * 60;
  let created = 0;
  let stockShortages = 0;

  for (let i = 0; i < cfg.stockOutputs; i++) {
    const createdById = workers[int(0, workers.length - 1)];
    const reason = pick(reasons);
    const minutesAgo = int(0, minutesInWindow);
    const occurredAt = new Date(Date.now() - minutesAgo * 60 * 1000);
    const itemCount = reason === 'SALE' ? int(1, 5) : int(1, 2);
    const itemProducts = new Set<string>();
    const items: { productId: string; quantity: number; unitSalePrice?: number }[] = [];

    while (items.length < itemCount) {
      const product = products[int(0, products.length - 1)];
      if (itemProducts.has(product.id)) continue;
      itemProducts.add(product.id);
      items.push({
        productId: product.id,
        quantity: int(1, 5),
        unitSalePrice:
          reason === 'SALE'
            ? Math.round(product.salePrice * decimal(0.95, 1.05) * 100) / 100
            : undefined,
      });
    }

    try {
      await prisma.stockOutput.create({
        data: {
          createdById,
          reason,
          occurredAt,
          notes: `Salida ${reason} ${pad(i, 6)}`,
          items: { create: items },
        },
      });
      created++;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Insufficient stock')) {
        stockShortages++;
      } else {
        throw error;
      }
    }

    if ((created + stockShortages) % 250 === 0) {
      console.log(`      intentos ${created + stockShortages} / ${cfg.stockOutputs} (${stockShortages} sin stock)`);
    }
  }

  console.log(`      total creadas ${created}, omitidas por stock insuficiente ${stockShortages}`);
}

async function seedServiceRecords(
  serviceTypes: { id: string; kind: ServiceKind }[],
  products: { id: string }[],
  workers: string[],
) {
  console.log(`  - service records (~${cfg.serviceRecords})`);
  const statusOptions: ServiceStatus[] = [
    'RECEIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'COMPLETED',
    'DELIVERED',
    'DELIVERED',
    'CANCELLED',
  ];
  const minutesInWindow = cfg.daysBack * 24 * 60;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < cfg.serviceRecords; i++) {
    const type = serviceTypes[int(0, serviceTypes.length - 1)];
    const createdById = workers[int(0, workers.length - 1)];
    const minutesAgo = int(0, minutesInWindow);
    const serviceDate = new Date(Date.now() - minutesAgo * 60 * 1000);
    const status = pick(statusOptions);

    try {
      const record = await prisma.serviceRecord.create({
        data: {
          serviceTypeId: type.id,
          createdById,
          kind: type.kind,
          status,
          quantity: int(1, 8),
          serviceDate,
          deliveredAt: status === 'DELIVERED' ? serviceDate : null,
          externalVendorName:
            type.kind === 'OUTSOURCED' ? `Proveedor ${pick(LAST_NAMES)}` : null,
          notes: `Servicio bulk ${pad(i, 6)}`,
        },
      });

      // Add 0-3 user-chosen consumptions for IN_HOUSE non-cancelled records
      if (type.kind === 'IN_HOUSE' && status !== 'CANCELLED') {
        const consumptionCount = int(0, 3);
        const used = new Set<string>();
        for (let j = 0; j < consumptionCount; j++) {
          const product = products[int(0, products.length - 1)];
          if (used.has(product.id)) continue;
          used.add(product.id);
          try {
            await prisma.serviceConsumption.create({
              data: {
                serviceRecordId: record.id,
                productId: product.id,
                quantity: int(1, 3),
              },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (
              !message.includes('Insufficient stock') &&
              !message.includes('uq_service_consumptions_service_product')
            ) {
              throw error;
            }
          }
        }
      }
      created++;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Insufficient stock')) {
        skipped++;
      } else {
        throw error;
      }
    }

    if ((created + skipped) % 200 === 0) {
      console.log(`      intentos ${created + skipped} / ${cfg.serviceRecords}`);
    }
  }

  console.log(`      total creados ${created}, omitidos ${skipped}`);
}

// =====================================================================
async function main() {
  console.log('Bulk seed configuration:', cfg);
  const reset = process.env.BULK_RESET === 'true';
  if (reset) {
    await clearMutableData();
  }

  console.log('Seeding...');
  const users = await seedUsers();
  const workers = users.map((user) => user.id);
  const suppliers = await seedSuppliers();
  const products = await seedProducts();
  await seedProductSupplierLinks(products, suppliers);
  const serviceTypes = await seedServiceTypes();
  await seedStockEntries(products, suppliers, workers);
  await seedStockOutputs(products, workers);
  await seedServiceRecords(serviceTypes, products, workers);

  console.log('\nDone.');
}

main()
  .catch((error) => {
    console.error('Bulk seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
