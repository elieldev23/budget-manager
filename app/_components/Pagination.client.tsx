"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PaginationClient({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  function go(nextPage: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/70">
        Page <span className="text-white/90 font-semibold">{page}</span> /{" "}
        <span className="text-white/90 font-semibold">{totalPages}</span> —{" "}
        <span className="text-white/90 font-semibold">{total}</span> transactions
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 rounded border border-white/10 bg-black/30 hover:bg-black/40 disabled:opacity-50 text-sm"
        >
          ← Précédent
        </button>

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 rounded border border-white/10 bg-black/30 hover:bg-black/40 disabled:opacity-50 text-sm"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
