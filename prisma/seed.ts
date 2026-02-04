import { PrismaClient, Role, LabelKind } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --------------------
  // USERS
  // --------------------
  const you = await prisma.user.upsert({
    where: { email: "you@example.com" },
    update: {},
    create: {
      email: "you@example.com",
      password: "demo-password",
      name: "Toi",
    },
  });

  const dad = await prisma.user.upsert({
    where: { email: "dad@example.com" },
    update: {},
    create: {
      email: "dad@example.com",
      password: "demo-password",
      name: "Papa",
    },
  });

  // --------------------
  // WORKSPACE
  // --------------------
  const car = await prisma.workspace.upsert({
    where: { id: "car-workspace" },
    update: {},
    create: {
      id: "car-workspace", // clé stable volontaire
      name: "Voiture",
    },
  });

  // --------------------
  // WORKSPACE MEMBERS
  // --------------------
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: you.id,
        workspaceId: car.id,
      },
    },
    update: { role: Role.admin },
    create: {
      userId: you.id,
      workspaceId: car.id,
      role: Role.admin,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: dad.id,
        workspaceId: car.id,
      },
    },
    update: { role: Role.editor },
    create: {
      userId: dad.id,
      workspaceId: car.id,
      role: Role.editor,
    },
  });

  // --------------------
  // LABELS (source / category)
  // clé unique logique = (workspaceId, name, kind)
  // --------------------
  const labels = [
    { name: "Chèque", kind: LabelKind.source },
    { name: "Épargne", kind: LabelKind.source },
    { name: "Crédit", kind: LabelKind.source },
    { name: "Essence", kind: LabelKind.category },
    { name: "Réparation", kind: LabelKind.category },
    { name: "Lavage", kind: LabelKind.category },
  ];

  const labelMap = new Map<string, string>();

  for (const label of labels) {
    const existing = await prisma.label.findFirst({
      where: {
        name: label.name,
        kind: label.kind,
        workspaceId: car.id,
      },
    });

    const saved =
      existing ??
      (await prisma.label.create({
        data: {
          name: label.name,
          kind: label.kind,
          workspaceId: car.id,
        },
      }));

    labelMap.set(label.name, saved.id);
  }

  // --------------------
  // TRANSACTIONS
  // clé logique = (workspaceId, date, amount, note)
  // --------------------
  const transactions = [
    {
      userId: you.id,
      workspaceId: car.id,
      amountCents: -6240,
      date: new Date("2026-01-02"),
      note: "Essence Petro-Canada",
      sourceLabel: "Chèque",
      categoryLabel: "Essence",
    },
    {
      userId: you.id,
      workspaceId: car.id,
      amountCents: -1499,
      date: new Date("2026-01-09"),
      note: "Lavage auto",
      sourceLabel: "Chèque",
      categoryLabel: "Lavage",
    },
  ];

  for (const tx of transactions) {
    const exists = await prisma.transaction.findFirst({
      where: {
        workspaceId: tx.workspaceId,
        amountCents: tx.amountCents,
        date: tx.date,
        note: tx.note,
      },
    });

    if (!exists) {
      await prisma.transaction.create({
        data: {
          userId: tx.userId,
          workspaceId: tx.workspaceId,
          amountCents: tx.amountCents,
          date: tx.date,
          note: tx.note,
          sourceLabelId: labelMap.get(tx.sourceLabel)!,
          categoryLabelId: labelMap.get(tx.categoryLabel)!,
        },
      });
    }
  }

  console.log("✅ Seed idempotent terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
