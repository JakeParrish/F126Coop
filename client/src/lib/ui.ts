// ISO country codes for the countries on the 2026 calendar (for flag images).
const COUNTRY_ISO: Record<string, string> = {
  Australia: "au",
  China: "cn",
  Japan: "jp",
  Bahrain: "bh",
  "Saudi Arabia": "sa",
  "United States": "us",
  Canada: "ca",
  Monaco: "mc",
  Spain: "es",
  Austria: "at",
  "United Kingdom": "gb",
  Belgium: "be",
  Hungary: "hu",
  Netherlands: "nl",
  Italy: "it",
  Azerbaijan: "az",
  Singapore: "sg",
  Mexico: "mx",
  Brazil: "br",
  Qatar: "qa",
  "United Arab Emirates": "ae",
};

export function countryIso(country: string): string | null {
  return COUNTRY_ISO[country] ?? null;
}

// Driver nationality ISO by 3-letter code (2026 grid). Custom players have none.
const NATIONALITY_ISO: Record<string, string> = {
  NOR: "gb", PIA: "au", LEC: "mc", HAM: "gb", RUS: "gb", ANT: "it",
  VER: "nl", HAD: "fr", SAI: "es", ALB: "th", LAW: "nz", LIN: "gb",
  ALO: "es", STR: "ca", OCO: "fr", BEA: "gb", HUL: "de", BOR: "br",
  GAS: "fr", COL: "ar", PER: "mx", BOT: "fi",
};

export function nationalityIso(code: string): string | null {
  return NATIONALITY_ISO[code.toUpperCase()] ?? null;
}

// URL key for a driver, e.g. "Max Verstappen" -> "MaxVerstappen".
export function driverKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

// Countries selectable for a custom driver's nationality (ISO alpha-2 + name).
export const COUNTRIES: { iso: string; name: string }[] = [
  { iso: "ar", name: "Argentina" },
  { iso: "au", name: "Australia" },
  { iso: "at", name: "Austria" },
  { iso: "az", name: "Azerbaijan" },
  { iso: "bh", name: "Bahrain" },
  { iso: "be", name: "Belgium" },
  { iso: "br", name: "Brazil" },
  { iso: "ca", name: "Canada" },
  { iso: "cn", name: "China" },
  { iso: "co", name: "Colombia" },
  { iso: "cz", name: "Czechia" },
  { iso: "dk", name: "Denmark" },
  { iso: "ee", name: "Estonia" },
  { iso: "fi", name: "Finland" },
  { iso: "fr", name: "France" },
  { iso: "de", name: "Germany" },
  { iso: "gr", name: "Greece" },
  { iso: "hu", name: "Hungary" },
  { iso: "in", name: "India" },
  { iso: "id", name: "Indonesia" },
  { iso: "ie", name: "Ireland" },
  { iso: "it", name: "Italy" },
  { iso: "jp", name: "Japan" },
  { iso: "my", name: "Malaysia" },
  { iso: "mx", name: "Mexico" },
  { iso: "mc", name: "Monaco" },
  { iso: "nl", name: "Netherlands" },
  { iso: "nz", name: "New Zealand" },
  { iso: "no", name: "Norway" },
  { iso: "pl", name: "Poland" },
  { iso: "pt", name: "Portugal" },
  { iso: "qa", name: "Qatar" },
  { iso: "ro", name: "Romania" },
  { iso: "ru", name: "Russia" },
  { iso: "sa", name: "Saudi Arabia" },
  { iso: "sg", name: "Singapore" },
  { iso: "za", name: "South Africa" },
  { iso: "es", name: "Spain" },
  { iso: "se", name: "Sweden" },
  { iso: "ch", name: "Switzerland" },
  { iso: "th", name: "Thailand" },
  { iso: "tr", name: "Turkey" },
  { iso: "ua", name: "Ukraine" },
  { iso: "ae", name: "United Arab Emirates" },
  { iso: "gb", name: "United Kingdom" },
  { iso: "us", name: "United States" },
  { iso: "ve", name: "Venezuela" },
];

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
