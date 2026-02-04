import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import FiltersBarClient from "@/app/_components/FiltersBar.client";
import TransactionsTable from "@/app/_components/TransactionsTable";

function formatCAD(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function startOfMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0));
}

function startOfNextMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 1, 0, 0, 0));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspaceId = "car-workspace";

  const sp = await searchParams;

  const yearStr = typeof sp.year === "string" ? sp.year : "2026";
  const monthStr = typeof sp.month === "string" ? sp.month : ""; // "" => all months
  const sourceId = typeof sp.source === "string" ? sp.source : "";
  const categoryId = typeof sp.category === "string" ? sp.category : "";

  const year = Number(yearStr) || 2026;
  const month = monthStr ? Number(monthStr) : NaN;

  const dateFilter =
    monthStr && !Number.isNaN(month) && month >= 1 && month <= 12
      ? {
          gte: startOfMonth(year, month),
          lt: startOfNextMonth(year, month),
        }
      : undefined;

  const where = {
    workspaceId,
    ...(dateFilter ? { date: dateFilter } : {}),
    ...(sourceId ? { sourceLabelId: sourceId } : {}),
    ...(categoryId ? { categoryLabelId: categoryId } : {}),
  } as const;

  const [transactions, summary, income, expenses, sources, categories] =
    await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        include: { source: true, category: true, user: true },
      }),

      prisma.transaction.aggregate({
        where,
        _sum: { amountCents: true },
        _count: { _all: true },
      }),

      prisma.transaction.aggregate({
        where: { ...where, amountCents: { gt: 0 } },
        _sum: { amountCents: true },
      }),

      prisma.transaction.aggregate({
        where: { ...where, amountCents: { lt: 0 } },
        _sum: { amountCents: true },
      }),

      prisma.label.findMany({
        where: { workspaceId, kind: "source" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),

      prisma.label.findMany({
        where: { workspaceId, kind: "category" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

  const totalCents = summary._sum.amountCents ?? 0;
  const incomeCents = income._sum.amountCents ?? 0;
  const expenseCents = expenses._sum.amountCents ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <Link
          href="/dashboard/new"
          className="px-4 py-2 rounded bg-white text-black font-semibold"
        >
          + Nouvelle transaction
        </Link>
      </div>

      <FiltersBarClient sources={sources} categories={categories} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Transactions</p>
          <p className="text-2xl font-semibold">{summary._count._all}</p>
        </div>

        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Revenus</p>
          <p className="text-2xl font-semibold">{formatCAD(incomeCents)}</p>
        </div>

        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Dépenses</p>
          <p className="text-2xl font-semibold">{formatCAD(expenseCents)}</p>
        </div>

        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Solde</p>
          <p className="text-2xl font-semibold">{formatCAD(totalCents)}</p>
        </div>
      </div>

      <TransactionsTable transactions={transactions} />
    </div>
  );
}
