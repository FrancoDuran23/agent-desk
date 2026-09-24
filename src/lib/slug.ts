export function uid(prefix = ""): string {
  const n = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return prefix ? `${prefix}_${n}` : n;
}

export function clip(input: string, max: number): string {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
  return slug || "pieza";
}

export function looksCorporate(goal: string): boolean {
  return /sinerg|innovad|potenci|l[ií]deres del|soluci[oó]n integral|cutting-edge|disruptiv|apasionad|next-?gen|ecosistema digital/i.test(
    goal,
  );
}
