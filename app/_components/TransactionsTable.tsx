"use client";

import type { Prisma } from "@prisma/client";
import { useState } from "react";
import InlineEditRow from "@/app/_components/InlineEditRow.client";
import TxRowActions from "@/app/_components/TxRowActions.client";

type Tx = Prisma.TransactionGetPayload<{
  include: { user: true; source: true; category: true };
}>;

type Named = { id: string; name: string };

function formatCAD(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export default function TransactionsTable({
  transactions,
  users,
  sources,
  categories,
}: {
  transactions: Tx[];
  users: Named[];
  sources: Named[];
  categories: Named[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">Aucune transaction pour l’instant.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-base font-semibold">Transactions</h2>
        <p className="text-xs text-white/60">{transactions.length} sur cette page</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/70">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium text-right">Montant</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="text-white/90">
            {transactions.map((t) => {
              if (editingId === t.id) {
                return (
                  <InlineEditRow
                    key={t.id}
                    tx={{
                      id: t.id,
                      date: t.date,
                      note: t.note ?? null,
                      amountCents: t.amountCents,
                      userId: t.userId,
                      sourceLabelId: t.sourceLabelId ?? null,
                      categoryLabelId: t.categoryLabelId ?? null,
                      user: t.user,
                      source: t.source,
                      category: t.category,
                    }}
                    users={users}
                    sources={sources}
                    categories={categories}
                    onDone={() => setEditingId(null)}
                  />
                );
              }

              const isExpense = t.amountCents < 0;

              return (
                <tr key={t.id} className="border-b border-white/10 last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.date)}</td>

                  <td className="px-4 py-3 min-w-[240px]">
                    {t.note ?? <span className="text-white/50">—</span>}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.source?.name ?? <span className="text-white/50">—</span>}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.category?.name ?? <span className="text-white/50">—</span>}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.user?.name ?? <span className="text-white/50">—</span>}
                  </td>

                  <td
                    className={[
                      "px-4 py-3 whitespace-nowrap text-right font-semibold",
                      isExpense ? "text-red-300" : "text-green-300",
                    ].join(" ")}
                  >
                    {formatCAD(t.amountCents)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(t.id)}
                        className="px-3 py-1 rounded border border-white/15 text-sm hover:bg-white/10"
                      >
                        Modifier
                      </button>

                      {/* ton menu delete existant */}
                      <TxRowActions id={t.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
