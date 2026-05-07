import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { OPERATIONAL_ROLES } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { getStockOutputHistory } from "@/services/stock-output.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      isActive: true,
      deletedAt: null,
    },
    select: { role: true },
  });

  if (!user || !OPERATIONAL_ROLES.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const payload = await getStockOutputHistory({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    reason: searchParams.get("reason") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  return Response.json(payload);
}
