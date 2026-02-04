"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

function monthOptions() {
  const labels = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
  ];
  return Array.from({ length: 12 }, (_, i) => {
    const v = String(i + 1).padStart(2, "0");
    return { value: v, label: `${v} — ${labels[i]}` };
  });
}

export default function FiltersBarClient({
  sources,
  categories,
}: {
  sources: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const year = sp.get("year") ?? "2026";
  const month = sp.get("month") ?? ""; // "" = all
  const sourceId = sp.get("source") ?? "";
  const categoryId = sp.get("category") ?? "";

  const months = useMemo(() => monthOptions(), []);

  const activeCount =
    (year !== "2026" ? 1 : 0) +
    (month ? 1 : 0) +
    (sourceId ? 1 : 0) +
    (categoryId ? 1 : 0);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) params.delete(k);
      else params.set(k, v);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    router.push(pathname); // enlève tous les query params
  }

  return (
    <div className="rounded border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm text-white/70">
          Filtres {activeCount ? <span className="text-white/50">({activeCount})</span> : null}
        </div>

        <button
          onClick={reset}
          className="text-xs px-3 py-1.5 rounded border border-white/10 bg-black/30 hover:bg-black/40"
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Year */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Année</label>
          <input
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={year}
            inputMode="numeric"
            onChange={(e) => updateParams({ year: e.target.value })}
            placeholder="2026"
          />
        </div>

        {/* Month */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Mois</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={month}
            onChange={(e) => updateParams({ month: e.target.value })}
          >
            <option value="">Tous</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Source</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={sourceId}
            onChange={(e) => updateParams({ source: e.target.value })}
          >
            <option value="">Toutes</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Catégorie</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={categoryId}
            onChange={(e) => updateParams({ category: e.target.value })}
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 text-xs text-white/50">
        Les filtres sont dans l’URL → tu peux partager le lien.
      </div>
    </div>
  );
}
