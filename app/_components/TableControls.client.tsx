"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function TableControlsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const sort = sp.get("sort") ?? "date";
  const order = sp.get("order") ?? "desc";
  const page = sp.get("page") ?? "1";

  function setParam(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) params.delete(k);
      else params.set(k, v);
    }
    // reset page if sort/order changes
    if ("sort" in next || "order" in next) params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between rounded border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Trier par</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value })}
          >
            <option value="date">Date</option>
            <option value="amount">Montant</option>
            <option value="note">Note</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Ordre</label>
          <select
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            value={order}
            onChange={(e) => setParam({ order: e.target.value })}
          >
            <option value="desc">Descendant</option>
            <option value="asc">Ascendant</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-white/50">
        Page actuelle : <span className="text-white/80">{page}</span>
      </div>
    </div>
  );
}
