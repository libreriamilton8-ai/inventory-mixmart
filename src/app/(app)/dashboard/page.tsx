import { Suspense } from "react";

import {
  AttentionPanel,
  type AttentionItem,
} from "@/components/dashboard/attention-panel";
import { FinancialSummaryCard } from "@/components/dashboard/financial-summary-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentMovementsPanel } from "@/components/dashboard/recent-movements-panel";
import { WorkerHero } from "@/components/dashboard/worker-hero";
import { DashboardContentSkeleton } from "@/components/shared";
import { requireActiveUser } from "@/lib/auth";
import {
  getDashboardFinancialSummary,
  getDashboardInventoryStats,
  getDashboardTodayCounts,
  getRecentDashboardMovements,
} from "@/services/dashboard.service";

type DashboardPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <Suspense fallback={<DashboardContentSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
  const [user, params] = await Promise.all([
    requireActiveUser("/dashboard"),
    searchParams,
  ]);

  const [todayCounts, inventoryStats, financialSummary, recentMovements] =
    await Promise.all([
      getDashboardTodayCounts(),
      getDashboardInventoryStats(),
      getDashboardFinancialSummary(params.range),
      getRecentDashboardMovements(),
    ]);

  const attentionList: AttentionItem[] = inventoryStats.attention.map(
    (item) => ({
      product: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
      },
      status: item.status,
    }),
  );

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-3 pb-24 sm:space-y-3.5 lg:pb-12">
      <QuickActions isAdmin={isAdmin} />

      {isAdmin ? (
        <FinancialSummaryCard
          entriesToday={todayCounts.entriesToday}
          initialSummary={financialSummary}
          inventoryCost={inventoryStats.inventoryCost}
          outOfStockCount={inventoryStats.outOfStockCount}
          outputsToday={todayCounts.outputsToday}
          salesToday={todayCounts.salesToday}
        />
      ) : (
        <WorkerHero
          entriesToday={todayCounts.entriesToday}
          outputsToday={todayCounts.outputsToday}
          salesToday={todayCounts.salesToday}
          wasteToday={todayCounts.wasteToday}
          servicesToday={todayCounts.servicesToday}
          outOfStockCount={inventoryStats.outOfStockCount}
          lowStockCount={inventoryStats.lowStockCount}
        />
      )}

      <div className="grid gap-3.5 xl:grid-cols-[2fr_1fr]">
        <RecentMovementsPanel
          currentUserId={user.id}
          movements={recentMovements}
          showOwnerFilter={!isAdmin}
        />
        <AttentionPanel
          items={attentionList}
          outOfStock={inventoryStats.outOfStockCount}
          lowStock={inventoryStats.lowStockCount}
        />
      </div>
    </div>
  );
}
