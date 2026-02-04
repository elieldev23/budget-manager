import { prisma } from "@/lib/db/prisma";
import AddTransactionForm from "@/app/_components/AddTransactionForm";

export default async function NewTransactionPage() {
  const workspaceId = "car-workspace";

  const [sources, categories, users] = await Promise.all([
    prisma.label.findMany({
      where: { workspaceId, kind: "source" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.label.findMany({
      where: { workspaceId, kind: "category" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nouvelle transaction</h1>
        <p className="text-sm text-white/60">Ajoute une dépense ou un revenu.</p>
      </div>

      <AddTransactionForm
        workspaceId={workspaceId}
        sources={sources}
        categories={categories}
        users={users.map((u) => ({
          id: u.id,
          name: u.name ?? u.email,
        }))}
      />
    </div>
  );
}
