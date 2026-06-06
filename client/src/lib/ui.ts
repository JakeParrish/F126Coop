// Flag emoji for the countries on the 2026 calendar.
const FLAGS: Record<string, string> = {
  Australia: "🇦🇺",
  China: "🇨🇳",
  Japan: "🇯🇵",
  Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Monaco: "🇲🇨",
  Spain: "🇪🇸",
  Austria: "🇦🇹",
  "United Kingdom": "🇬🇧",
  Belgium: "🇧🇪",
  Hungary: "🇭🇺",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Qatar: "🇶🇦",
  "United Arab Emirates": "🇦🇪",
};

export function flagFor(country: string): string {
  return FLAGS[country] ?? "🏁";
}

// Race weekend range (Fri–Sun) from the stored Sunday date, e.g. "06–08 MAR".
export function raceDateRange(iso: string | null): string {
  if (!iso) return "";
  const sun = new Date(`${iso}T00:00:00`);
  if (isNaN(sun.getTime())) return iso;
  const fri = new Date(sun);
  fri.setDate(sun.getDate() - 2);
  const m = (d: Date) => d.toLocaleString("en", { month: "short" }).toUpperCase();
  return m(fri) === m(sun)
    ? `${fri.getDate()}–${sun.getDate()} ${m(sun)}`
    : `${fri.getDate()} ${m(fri)} – ${sun.getDate()} ${m(sun)}`;
}

// Pick a readable text colour (near-black or white) for a given hex background.
export function readableText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? "#0B0B0F" : "#ffffff";
}
