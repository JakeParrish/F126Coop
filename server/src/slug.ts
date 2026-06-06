import { prisma } from "./db.js";

// Build a URL-safe slug from a career name.
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "career"
  );
}

// A slug guaranteed not to collide with an existing career, by suffixing.
export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await prisma.career.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
