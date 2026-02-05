import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  const body = await req.json().catch(() => ({}));

  // On accepte des updates partiels
  const data: any = {};

  if (typeof body.note === "string") data.note = body.note.trim() || null;

  if (typeof body.amountCents === "number" && Number.isFinite(body.amountCents)) {
    data.amountCents = Math.trunc(body.amountCents);
  }

  if (typeof body.date === "string") {
    const d = new Date(body.date);
    if (!Number.isNaN(d.getTime())) data.date = d;
  }

  if (typeof body.sourceLabelId === "string") {
    data.sourceLabelId = body.sourceLabelId || null;
  }

  if (typeof body.categoryLabelId === "string") {
    data.categoryLabelId = body.categoryLabelId || null;
  }

  if (typeof body.userId === "string") {
    data.userId = body.userId;
  }

  // Sécurité: rien à update
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, id }, { status: 200 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data,
    include: { user: true, source: true, category: true },
  });

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
