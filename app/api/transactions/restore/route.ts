import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tx = body?.transaction;
    if (!tx?.id) {
      return Response.json({ error: "transaction manquante." }, { status: 400 });
    }

    // Re-créer avec le même id (pratique pour undo)
    const restored = await prisma.transaction.create({
      data: {
        id: String(tx.id),
        amountCents: Number(tx.amountCents),
        date: new Date(tx.date),
        note: tx.note ?? null,
        userId: String(tx.userId),
        workspaceId: tx.workspaceId ?? null,
        sourceLabelId: tx.sourceLabelId ?? null,
        categoryLabelId: tx.categoryLabelId ?? null,
      },
    });

    return Response.json({ ok: true, restored }, { status: 201 });
  } catch (e: any) {
    // si déjà recréé / double clic undo, on évite de crash
    return Response.json({ error: "Impossible de restaurer." }, { status: 500 });
  }
}
