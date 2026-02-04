import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const workspaceId = "car-workspace";

  const labels = await prisma.label.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" }, // on garde le plus ancien
    select: { id: true, name: true, kind: true },
  });

  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const l of labels) {
    const key = `${l.kind}:${l.name}`;
    if (seen.has(key)) toDelete.push(l.id);
    else seen.add(key);
  }

  if (toDelete.length) {
    await prisma.label.deleteMany({ where: { id: { in: toDelete } } });
  }

  console.log(`✅ Labels doublons supprimés: ${toDelete.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
