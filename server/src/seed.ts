import { prisma } from "./db.js";
import { TEAMS } from "./data/f126.js";
import { uniqueSlug } from "./slug.js";

// Backfills careers created before slug/imageUrl existed. Idempotent: it only
// fills in null values, so it is safe to run on every boot.
async function backfill() {
  // 1. Give slug-less careers a slug derived from their name.
  const noSlug = await prisma.career.findMany({ where: { slug: null } });
  for (const c of noSlug) {
    await prisma.career.update({ where: { id: c.id }, data: { slug: await uniqueSlug(c.name) } });
  }
  if (noSlug.length) console.log(`Backfilled ${noSlug.length} career slug(s).`);

  // 2. Copy reference headshots onto real-driver entrants missing an image,
  //    matched by driver name. (Custom players without a photo stay null.)
  const drivers = await prisma.driver.findMany({ select: { name: true, imageUrl: true } });
  const imageByName = new Map(drivers.map((d) => [d.name, d.imageUrl]));
  const entrants = await prisma.entrant.findMany({
    where: { imageUrl: null, isPlayer: false },
    select: { id: true, name: true },
  });
  let filled = 0;
  for (const e of entrants) {
    const img = imageByName.get(e.name);
    if (img) {
      await prisma.entrant.update({ where: { id: e.id }, data: { imageUrl: img } });
      filled++;
    }
  }
  if (filled) console.log(`Backfilled ${filled} entrant headshot(s).`);
}

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

  await backfill();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
