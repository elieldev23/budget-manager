"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import TxRowActions from "@/app/_components/TxRowActions.client";
import InlineEditRow from "@/app/_components/InlineEditRow.client";

type Named = { id: string; name: string };

export type TxUI = {
  id: string;
  date: string; // YYYY-MM-DD
  note: string | null;
  amountCents: number;
  userId: string;
  sourceLabelId: string | null;
  categoryLabelId: string | null;

  // affichage (déjà résolu côté server)
  userName?: string | null;
  sourceName?: string | null;
  categoryName?: string | null;
};

function formatCAD(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dt);
}


export default function TransactionsTable({
  transactions,
  users,
  sources,
  categories,
}: {
  transactions: TxUI[];
  users: Named[];
  sources: Named[];
  categories: Named[];
}) {
  const [rows, setRows] = useState<TxUI[]>(transactions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const snapshotRef = useRef<TxUI[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const byId = useMemo(() => {
    const u = new Map(users.map((x) => [x.id, x.name]));
    const s = new Map(sources.map((x) => [x.id, x.name]));
    const c = new Map(categories.map((x) => [x.id, x.name]));
    return { u, s, c };
  }, [users, sources, categories]);

  function optimisticApply(next: {
    id: string;
    date: string;
    note: string | null;
    amountCents: number;
    userId: string;
    sourceLabelId: string | null;
    categoryLabelId: string | null;
  }) {
    snapshotRef.current = rows;

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== next.id) return r;

        return {
          ...r,
          ...next,
          userName: byId.u.get(next.userId) ?? r.userName ?? null,
          sourceName: next.sourceLabelId
            ? byId.s.get(next.sourceLabelId) ?? null
            : null,
          categoryName: next.categoryLabelId
            ? byId.c.get(next.categoryLabelId) ?? null
            : null,
        };
      })
    );
  }

  function optimisticRollback() {
    if (snapshotRef.current) setRows(snapshotRef.current);
    snapshotRef.current = null;
  }

  async function deleteTx(id: string) {
    setBusyId(id);

    // optimistic remove
    snapshotRef.current = rows;
    setRows((prev) => prev.filter((r) => r.id !== id));

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Erreur delete");
      }
      toast.success("Transaction supprimée ✅");
      if (editingId === id) setEditingId(null);
    } catch (e: any) {
      optimisticRollback();
      toast.error("Erreur suppression", {
        description: e?.message ?? "Impossible de supprimer.",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
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
        <p className="text-xs text-white/60">{rows.length} sur cette page</p>
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
            {rows.map((t) => {
              if (editingId === t.id) {
                return (
                  <InlineEditRow
                    key={t.id}
                    tx={{
                      id: t.id,
                      date: t.date,
                      note: t.note,
                      amountCents: t.amountCents,
                      userId: t.userId,
                      sourceLabelId: t.sourceLabelId,
                      categoryLabelId: t.categoryLabelId,
                    }}
                    users={users}
                    sources={sources}
                    categories={categories}
                    onDone={() => setEditingId(null)}
                    onOptimisticApply={optimisticApply}
                    onOptimisticRollback={optimisticRollback}
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
                    {t.sourceName ?? <span className="text-white/50">—</span>}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.categoryName ?? <span className="text-white/50">—</span>}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.userName ?? <span className="text-white/50">—</span>}
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
                    <TxRowActions
                      disabled={busyId === t.id}
                      onEdit={() => setEditingId(t.id)}
                      onDelete={() => deleteTx(t.id)}
                    />
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
