"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

type Named = { id: string; name: string };

function toISODateInput(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function InlineEditRow({
  tx,
  users,
  sources,
  categories,
  onDone,
  onOptimisticApply,
  onOptimisticRollback,
}: {
  tx: {
    id: string;
    date: Date | string;
    note: string | null;
    amountCents: number;
    userId: string;
    sourceLabelId: string | null;
    categoryLabelId: string | null;
  };
  users: Named[];
  sources: Named[];
  categories: Named[];
  onDone: () => void;
  onOptimisticApply: (next: {
    id: string;
    date: string; // YYYY-MM-DD
    note: string | null;
    amountCents: number;
    userId: string;
    sourceLabelId: string | null;
    categoryLabelId: string | null;
  }) => void;
  onOptimisticRollback: () => void;
}) {
  const [saving, setSaving] = useState(false);

  // Champs
  const [date, setDate] = useState<string>(toISODateInput(tx.date));
  const [note, setNote] = useState<string>(tx.note ?? "");
  const [amount, setAmount] = useState<string>(() =>
    (tx.amountCents / 100).toFixed(2)
  );
  const [userId, setUserId] = useState<string>(tx.userId);
  const [sourceLabelId, setSourceLabelId] = useState<string>(
    tx.sourceLabelId ?? ""
  );
  const [categoryLabelId, setCategoryLabelId] = useState<string>(
    tx.categoryLabelId ?? ""
  );

  // Validation UX
  const [fieldErr, setFieldErr] = useState<{ date?: string; amount?: string }>(
    {}
  );

  const parsedAmount = useMemo(() => {
    const v = Number(amount.replace(",", "."));
    return Number.isFinite(v) ? v : NaN;
  }, [amount]);

  const isExpense = useMemo(() => {
    return Number.isFinite(parsedAmount)
      ? parsedAmount < 0
      : tx.amountCents < 0;
  }, [parsedAmount, tx.amountCents]);

  function validate() {
    const nextErr: typeof fieldErr = {};

    const dt = new Date(date);
    if (!date || Number.isNaN(dt.getTime())) nextErr.date = "Date invalide.";

    if (!Number.isFinite(parsedAmount))
      nextErr.amount = "Montant invalide (ex: -62.40).";

    setFieldErr(nextErr);
    return Object.keys(nextErr).length === 0;
  }

  const save = useCallback(async () => {
    if (saving) return;

    if (!validate()) {
      toast.error("Corrige les champs en rouge.");
      return;
    }

    setSaving(true);

    const amountCents = Math.round(parsedAmount * 100);
    const payload = {
      date,
      note: note.trim() ? note.trim() : null,
      amountCents,
      userId,
      sourceLabelId: sourceLabelId || null,
      categoryLabelId: categoryLabelId || null,
    };

    // ✅ Optimistic apply (UI instant)
    onOptimisticApply({ id: tx.id, ...payload });

    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Erreur update");
      }

      toast.success("Transaction mise à jour ✅");
      onDone();
    } catch (e: any) {
      onOptimisticRollback();
      toast.error("Erreur de sauvegarde", {
        description: e?.message ?? "Impossible de sauvegarder.",
      });
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    parsedAmount,
    date,
    note,
    userId,
    sourceLabelId,
    categoryLabelId,
    onOptimisticApply,
    onOptimisticRollback,
    onDone,
    tx.id,
  ]);

  // ✅ Enter = Save, Escape = Cancel
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        void save();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onDone();
      }
    },
    [save, onDone]
  );

  // (optionnel) autofocus sur la date
  const dateRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    dateRef.current?.focus();
  }, []);

  return (
    <tr className="border-b border-white/10 last:border-b-0 bg-white/5">
      <td className="px-4 py-3 whitespace-nowrap">
        <input
          ref={dateRef}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onKeyDown={onKeyDown}
          className={[
            "w-[150px] rounded bg-black/30 border px-2 py-1 text-sm",
            fieldErr.date ? "border-red-500/40" : "border-white/10",
          ].join(" ")}
        />
        {fieldErr.date ? (
          <div className="text-xs text-red-300 mt-1">{fieldErr.date}</div>
        ) : null}
      </td>

      <td className="px-4 py-3 min-w-[240px]">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Note…"
          className="w-full rounded bg-black/30 border border-white/10 px-2 py-1 text-sm"
        />
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <select
          value={sourceLabelId}
          onChange={(e) => setSourceLabelId(e.target.value)}
          onKeyDown={onKeyDown}
          className="rounded bg-black/30 border border-white/10 px-2 py-1 text-sm"
        >
          <option value="">—</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <select
          value={categoryLabelId}
          onChange={(e) => setCategoryLabelId(e.target.value)}
          onKeyDown={onKeyDown}
          className="rounded bg-black/30 border border-white/10 px-2 py-1 text-sm"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={onKeyDown}
          className="rounded bg-black/30 border border-white/10 px-2 py-1 text-sm"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-right">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={onKeyDown}
          className={[
            "w-[110px] rounded bg-black/30 border px-2 py-1 text-sm text-right",
            fieldErr.amount ? "border-red-500/40" : "border-white/10",
            isExpense ? "text-red-300" : "text-green-300",
          ].join(" ")}
        />
        {fieldErr.amount ? (
          <div className="text-xs text-red-300 mt-1">{fieldErr.amount}</div>
        ) : null}
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => void save()}
            disabled={saving}
            className="px-3 py-1 rounded bg-white text-black text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "…" : "Enregistrer"}
          </button>

          <button
            onClick={onDone}
            disabled={saving}
            className="px-3 py-1 rounded border border-white/15 text-sm disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </td>
    </tr>
  );
}
