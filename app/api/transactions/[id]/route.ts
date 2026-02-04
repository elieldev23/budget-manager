import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const dateStr = String(body.date ?? "");
    const amountCents = Number(body.amountCents);

    const note = body.note === null ? null : String(body.note ?? "");
    const sourceLabelId = body.sourceLabelId ? String(body.sourceLabelId) : null;
    const categoryLabelId = body.categoryLabelId ? String(body.categoryLabelId) : null;
    const userId = body.userId ? String(body.userId) : null;

    if (!dateStr) {
      return Response.json({ error: "date est obligatoire." }, { status: 400 });
    }
    if (!Number.isFinite(amountCents) || amountCents === 0) {
      return Response.json(
        { error: "amountCents invalide (ne peut pas être 0)." },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return Response.json({ error: "Date invalide." }, { status: 400 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        date,
        amountCents: Math.trunc(amountCents),
        note: note || null,
        sourceLabelId,
        categoryLabelId,
        ...(userId ? { userId } : {}),
      },
    });

    return Response.json({ ok: true, transaction: updated }, { status: 200 });
  } catch {
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // delete retourne l'objet supprimé => parfait pour undo
    const deleted = await prisma.transaction.delete({
      where: { id },
    });

    return Response.json({ ok: true, deleted }, { status: 200 });
  } catch {
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
