"use client";

export default function TxRowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="px-3 py-1 rounded border border-white/15 text-sm disabled:opacity-60"
      >
        Modifier
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="px-3 py-1 rounded border border-red-500/30 text-red-200 text-sm disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
