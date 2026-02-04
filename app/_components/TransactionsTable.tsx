import type { Prisma } from "@prisma/client";
import TxRowActions from "@/app/_components/TxRowActions.client";

type Tx = Prisma.TransactionGetPayload<{
  include: { user: true; source: true; category: true };
}>;

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

export default function TransactionsTable({ transactions }: { transactions: Tx[] }) {
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
        <p className="text-xs text-white/60">{transactions.length} au total</p>
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
                    <TxRowActions id={t.id} />
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
