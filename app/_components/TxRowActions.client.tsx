"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type DeletedTx = {
  id: string;
  amountCents: number;
  date: string;
  note: string | null;
  userId: string;
  workspaceId: string | null;
  sourceLabelId: string | null;
  categoryLabelId: string | null;
  createdAt: string;
};

export default function TxRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      const data = (await res.json()) as { ok: true; deleted: DeletedTx };

      router.refresh();

      toast.success("Transaction supprimée", {
        action: {
          label: "Annuler",
          onClick: async () => {
            const undoToast = toast.loading("Restauration...");
            try {
              const r = await fetch("/api/transactions/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction: data.deleted }),
              });

              if (!r.ok) throw new Error("Restore failed");

              toast.success("Transaction restaurée ✅");
              router.refresh();
            } catch {
              toast.error("Impossible de restaurer");
            } finally {
              toast.dismiss(undoToast);
            }
          },
        },
      });
    } catch {
      toast.error("Impossible de supprimer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/dashboard/transactions/${id}/edit`}
        className="px-2 py-1 rounded border border-white/10 bg-black/30 hover:bg-black/40 text-xs"
      >
        Edit
      </Link>

      <button
        onClick={onDelete}
        disabled={loading}
        className="px-2 py-1 rounded border border-white/10 bg-red-500/10 hover:bg-red-500/20 text-xs text-red-200 disabled:opacity-50"
        type="button"
      >
        {loading ? "..." : "Delete"}
      </button>
    </div>
  );
}
