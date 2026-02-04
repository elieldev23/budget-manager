import { prisma } from "@/lib/db/prisma";
import EditTransactionForm from "@/app/_components/EditTransactionForm";
import { notFound } from "next/navigation";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspaceId = "car-workspace";

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { source: true, category: true, user: true },
  });

  if (!tx) return notFound();

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

  // input date value needs YYYY-MM-DD
  const yyyy = tx.date.getFullYear();
  const mm = String(tx.date.getMonth() + 1).padStart(2, "0");
  const dd = String(tx.date.getDate()).padStart(2, "0");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Modifier la transaction</h1>
        <p className="text-sm text-white/60">ID: {tx.id}</p>
      </div>

      <EditTransactionForm
        id={tx.id}
        initial={{
          date: `${yyyy}-${mm}-${dd}`,
          amountCents: tx.amountCents,
          note: tx.note ?? "",
          sourceLabelId: tx.sourceLabelId ?? "",
          categoryLabelId: tx.categoryLabelId ?? "",
          userId: tx.userId,
        }}
        sources={sources}
        categories={categories}
        users={users.map((u) => ({ id: u.id, name: u.name ?? u.email }))}
      />
    </div>
  );
}
