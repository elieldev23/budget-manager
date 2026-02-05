"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function formatCAD(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

// Pour <input type="date" />
function toISODateInput(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type Named = { id: string; name: string };

export default function InlineEditRow({
  tx,
  users,
  sources,
  categories,
  onDone,
}: {
  tx: {
    id: string;
    date: Date | string;
    note: string | null;
    amountCents: number;
    userId: string;
    sourceLabelId: string | null;
    categoryLabelId: string | null;
    user?: { id: string; name: string | null } | null;
    source?: { id: string; name: string } | null;
    category?: { id: string; name: string } | null;
  };
  users: Named[];
  sources: Named[];
  categories: Named[];
  onDone: () => void;
}) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  const [date, setDate] = useState<string>(toISODateInput(tx.date));
  const [note, setNote] = useState<string>(tx.note ?? "");
  const [amount, setAmount] = useState<string>(() => (tx.amountCents / 100).toFixed(2));
  const [userId, setUserId] = useState<string>(tx.userId);
  const [sourceLabelId, setSourceLabelId] = useState<string>(tx.sourceLabelId ?? "");
  const [categoryLabelId, setCategoryLabelId] = useState<string>(tx.categoryLabelId ?? "");

  const isExpense = useMemo(() => {
    const v = Number(amount);
    return Number.isFinite(v) ? v < 0 : tx.amountCents < 0;
  }, [amount, tx.amountCents]);

  async function save() {
    setSaving(true);
    setErr("");

    const value = Number(amount);
    if (!Number.isFinite(value)) {
      setErr("Montant invalide");
      setSaving(false);
      return;
    }

    const amountCents = Math.round(value * 100);

    const payload = {
      date, // "YYYY-MM-DD"
      note,
      amountCents,
      userId,
      sourceLabelId: sourceLabelId || null,
      categoryLabelId: categoryLabelId || null,
    };

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

      router.refresh(); // re-fetch server component data
      onDone();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-white/10 last:border-b-0 bg-white/5">
      <td className="px-4 py-3 whitespace-nowrap">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-[150px] rounded bg-black/30 border border-white/10 px-2 py-1 text-sm"
        />
      </td>

      <td className="px-4 py-3 min-w-[240px]">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note…"
          className="w-full rounded bg-black/30 border border-white/10 px-2 py-1 text-sm"
        />
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <select
          value={sourceLabelId}
          onChange={(e) => setSourceLabelId(e.target.value)}
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
        <div className="flex items-center justify-end gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={[
              "w-[110px] rounded bg-black/30 border border-white/10 px-2 py-1 text-sm text-right",
              isExpense ? "text-red-300" : "text-green-300",
            ].join(" ")}
          />
        </div>
        <div className="text-[11px] text-white/50 mt-1">{formatCAD(Math.round(Number(amount) * 100) || 0)}</div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1 rounded bg-white text-black text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "…" : "Save"}
          </button>
          <button
            onClick={onDone}
            disabled={saving}
            className="px-3 py-1 rounded border border-white/15 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
        {err ? <div className="text-xs text-red-300 mt-2">{err}</div> : null}
      </td>
    </tr>
  );
}
