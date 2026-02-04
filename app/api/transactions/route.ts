import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const workspaceId = String(body.workspaceId ?? "");
    const userId = String(body.userId ?? "");
    const dateStr = String(body.date ?? "");
    const amountCents = Number(body.amountCents);

    const note = body.note === null ? null : String(body.note ?? "");
    const sourceLabelId = body.sourceLabelId ? String(body.sourceLabelId) : null;
    const categoryLabelId = body.categoryLabelId ? String(body.categoryLabelId) : null;

    if (!workspaceId || !userId || !dateStr) {
      return Response.json({ error: "workspaceId, userId et date sont obligatoires." }, { status: 400 });
    }
    if (!Number.isFinite(amountCents) || amountCents === 0) {
      return Response.json({ error: "amountCents invalide (ne peut pas être 0)." }, { status: 400 });
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return Response.json({ error: "Date invalide." }, { status: 400 });
    }

    const created = await prisma.transaction.create({
      data: {
        workspaceId,
        userId,
        date,
        amountCents: Math.trunc(amountCents),
        note: note || null,
        sourceLabelId,
        categoryLabelId,
      },
    });

    return Response.json({ ok: true, transaction: created }, { status: 201 });
  } catch (e) {
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
