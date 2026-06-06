import { prisma } from "./db.js";
import { TEAMS } from "./data/f126.js";

// Seeds the reference roster (teams + drivers). Idempotent: safe to re-run.
async function main() {
  console.log("Seeding F1 26 reference roster...");

  for (let i = 0; i < TEAMS.length; i++) {
    const t = TEAMS[i];
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: { fullName: t.fullName, color: t.color, order: i },
      create: { name: t.name, fullName: t.fullName, color: t.color, order: i },
    });

    // Replace this team's drivers with the current seed lineup.
    await prisma.driver.deleteMany({ where: { teamId: team.id } });
    await prisma.driver.createMany({
      data: t.drivers.map((d) => ({
        name: d.name,
        code: d.code,
        number: d.number,
        imageUrl: d.image,
        teamId: team.id,
      })),
    });
  }

  const teamCount = await prisma.team.count();
  const driverCount = await prisma.driver.count();
  console.log(`Seeded ${teamCount} teams and ${driverCount} drivers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
