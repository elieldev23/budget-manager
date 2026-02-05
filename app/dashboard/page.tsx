import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

import FiltersBarClient from "@/app/_components/FiltersBar.client";
import TransactionsTable from "@/app/_components/TransactionsTable";
import TableControlsClient from "@/app/_components/TableControls.client";
import PaginationClient from "@/app/_components/Pagination.client";

function formatCAD(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function startOfMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12 - 1, 1));
}

function startOfNextMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 1));
}

type Named = { id: string; name: string };

function uniqueByName(items: Named[]) {
  const map = new Map<string, Named>();
  for (const it of items) if (!map.has(it.name)) map.set(it.name, it);
  return Array.from(map.values());
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspaceId = "car-workspace";
  const sp = await searchParams;

  // Filters
  const year = Number(sp.year ?? 2026);
  const month = Number(sp.month ?? "");
  const sourceId = typeof sp.source === "string" ? sp.source : "";
  const categoryId = typeof sp.category === "string" ? sp.category : "";

  const dateFilter =
    month >= 1 && month <= 12
      ? { gte: startOfMonth(year, month), lt: startOfNextMonth(year, month) }
      : undefined;

  const where = {
    workspaceId,
    ...(dateFilter ? { date: dateFilter } : {}),
    ...(sourceId ? { sourceLabelId: sourceId } : {}),
    ...(categoryId ? { categoryLabelId: categoryId } : {}),
  } as const;

  // Sorting
  const sortParam = typeof sp.sort === "string" ? sp.sort : "date";
  const orderParam = typeof sp.order === "string" ? sp.order : "desc";
  const dir: Prisma.SortOrder = orderParam === "asc" ? "asc" : "desc";

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sortParam === "amount"
      ? { amountCents: dir }
      : sortParam === "note"
      ? { note: dir }
      : { date: dir };

  // Pagination
  const pageSize = 10;
  const page = Math.max(1, Number(sp.page ?? 1));
  const skip = (page - 1) * pageSize;

  const [
    total,
    transactions,
    summary,
    income,
    expenses,
    sourcesRaw,
    categoriesRaw,
    usersRaw,
  ] = await Promise.all([
    prisma.transaction.count({ where }),

    prisma.transaction.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
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

    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  // ✅ normalisation (name toujours string)
  const sources = uniqueByName(sourcesRaw);
  const categories = uniqueByName(categoriesRaw);
  const users = uniqueByName(
    usersRaw.map((u) => ({ id: u.id, name: u.name ?? u.email }))
  );

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

      <TableControlsClient />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Transactions</p>
          <p className="text-2xl font-semibold">{summary._count._all}</p>
        </div>

        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Revenus</p>
          <p className="text-2xl font-semibold">
            {formatCAD(income._sum.amountCents ?? 0)}
          </p>
        </div>

        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Dépenses</p>
          <p className="text-2xl font-semibold">
            {formatCAD(expenses._sum.amountCents ?? 0)}
          </p>
        </div>

        <div className="p-4 rounded bg-white/5 border border-white/10">
          <p className="text-sm text-white/60">Solde</p>
          <p className="text-2xl font-semibold">
            {formatCAD(summary._sum.amountCents ?? 0)}
          </p>
        </div>
      </div>

      <TransactionsTable
        transactions={transactions}
        users={users}
        sources={sources}
        categories={categories}
      />

      <PaginationClient page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
