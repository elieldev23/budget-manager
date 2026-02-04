"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-red-600">
        Une erreur est survenue
      </h2>

      <p className="text-sm text-gray-600">
        {error.message}
      </p>

      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded bg-black text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
