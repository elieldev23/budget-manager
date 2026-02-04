"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };

export default function EditTransactionForm({
  id,
  initial,
  sources,
  categories,
  users,
}: {
  id: string;
  initial: {
    date: string;
    amountCents: number;
    note: string;
    sourceLabelId: string;
    categoryLabelId: string;
    userId: string;
  };
  sources: Option[];
  categories: Option[];
  users: Option[];
}) {
  const router = useRouter();

  const [date, setDate] = useState(initial.date);
  const [amount, setAmount] = useState(String(initial.amountCents / 100));
  const [note, setNote] = useState(initial.note);

  const [sourceId, setSourceId] = useState(initial.sourceLabelId);
  const [categoryId, setCategoryId] = useState(initial.categoryLabelId);
  const [userId, setUserId] = useState(initial.userId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n === 0) {
      setError("Entre un montant valide (ex: -12.50). Le montant ne peut pas être 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          amountCents: Math.round(n * 100),
          note: note || null,
          userId,
          sourceLabelId: sourceId || null,
          categoryLabelId: categoryId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur inconnue");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded border border-white/10 bg-white/5 p-5 space-y-4 max-w-2xl">
      {error ? (
        <div className="rounded border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Date</label>
          <input
            type="date"
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Montant ($CAD)</label>
          <input
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="-62.40"
            required
          />
          <p className="mt-1 text-xs text-white/40">
            Montant négatif = dépense, positif = revenu.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/60 mb-1">Note</label>
        <input
          className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Essence Petro-Canada"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Utilisateur</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Source</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            <option value="">—</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Catégorie</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded bg-white text-black font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded border border-white/10 bg-black/30 hover:bg-black/40"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
