// F1 26 (F1 25: 2026 Season Pack) reference data — verified June 2026.
// Everything here is a *template*: it seeds the reference roster and is copied
// into a new career, where it can be freely edited.

export interface TeamSeed {
  name: string;
  fullName: string;
  color: string;
  drivers: { name: string; code: string; number: number }[];
}

// 11 teams, 22 drivers — 2026 grid.
export const TEAMS: TeamSeed[] = [
  {
    name: "McLaren",
    fullName: "McLaren Formula 1 Team",
    color: "#FF8000",
    drivers: [
      { name: "Lando Norris", code: "NOR", number: 4 },
      { name: "Oscar Piastri", code: "PIA", number: 81 },
    ],
  },
  {
    name: "Ferrari",
    fullName: "Scuderia Ferrari HP",
    color: "#E8002D",
    drivers: [
      { name: "Charles Leclerc", code: "LEC", number: 16 },
      { name: "Lewis Hamilton", code: "HAM", number: 44 },
    ],
  },
  {
    name: "Mercedes",
    fullName: "Mercedes-AMG Petronas F1 Team",
    color: "#27F4D2",
    drivers: [
      { name: "George Russell", code: "RUS", number: 63 },
      { name: "Kimi Antonelli", code: "ANT", number: 12 },
    ],
  },
  {
    name: "Red Bull",
    fullName: "Oracle Red Bull Racing",
    color: "#3671C6",
    drivers: [
      { name: "Max Verstappen", code: "VER", number: 1 },
      { name: "Isack Hadjar", code: "HAD", number: 6 },
    ],
  },
  {
    name: "Williams",
    fullName: "Williams Racing",
    color: "#64C4FF",
    drivers: [
      { name: "Carlos Sainz", code: "SAI", number: 55 },
      { name: "Alex Albon", code: "ALB", number: 23 },
    ],
  },
  {
    name: "Racing Bulls",
    fullName: "Visa Cash App Racing Bulls",
    color: "#6692FF",
    drivers: [
      { name: "Liam Lawson", code: "LAW", number: 30 },
      { name: "Arvid Lindblad", code: "LIN", number: 37 },
    ],
  },
  {
    name: "Aston Martin",
    fullName: "Aston Martin Aramco F1 Team",
    color: "#229971",
    drivers: [
      { name: "Fernando Alonso", code: "ALO", number: 14 },
      { name: "Lance Stroll", code: "STR", number: 18 },
    ],
  },
  {
    name: "Haas",
    fullName: "MoneyGram Haas F1 Team",
    color: "#B6BABD",
    drivers: [
      { name: "Esteban Ocon", code: "OCO", number: 31 },
      { name: "Oliver Bearman", code: "BEA", number: 87 },
    ],
  },
  {
    name: "Audi",
    fullName: "Audi F1 Team",
    color: "#00788B",
    drivers: [
      { name: "Nico Hulkenberg", code: "HUL", number: 27 },
      { name: "Gabriel Bortoleto", code: "BOR", number: 5 },
    ],
  },
  {
    name: "Alpine",
    fullName: "BWT Alpine F1 Team",
    color: "#0093CC",
    drivers: [
      { name: "Pierre Gasly", code: "GAS", number: 10 },
      { name: "Franco Colapinto", code: "COL", number: 43 },
    ],
  },
  {
    name: "Cadillac",
    fullName: "Cadillac F1 Team",
    color: "#C8102E",
    drivers: [
      { name: "Sergio Perez", code: "PER", number: 11 },
      { name: "Valtteri Bottas", code: "BOT", number: 77 },
    ],
  },
];

export interface RaceSeed {
  round: number;
  name: string;
  country: string;
  circuit: string;
  date: string; // ISO date of the Sunday
  isSprint: boolean;
}

// 2026 F1 calendar — 24 rounds, 6 sprint weekends
// (China, Miami, Canada, Great Britain, Netherlands, Singapore).
export const CALENDAR: RaceSeed[] = [
  { round: 1, name: "Australian Grand Prix", country: "Australia", circuit: "Albert Park, Melbourne", date: "2026-03-08", isSprint: false },
  { round: 2, name: "Chinese Grand Prix", country: "China", circuit: "Shanghai International Circuit", date: "2026-03-15", isSprint: true },
  { round: 3, name: "Japanese Grand Prix", country: "Japan", circuit: "Suzuka", date: "2026-03-29", isSprint: false },
  { round: 4, name: "Bahrain Grand Prix", country: "Bahrain", circuit: "Bahrain International Circuit", date: "2026-04-12", isSprint: false },
  { round: 5, name: "Saudi Arabian Grand Prix", country: "Saudi Arabia", circuit: "Jeddah Corniche Circuit", date: "2026-04-19", isSprint: false },
  { round: 6, name: "Miami Grand Prix", country: "United States", circuit: "Miami International Autodrome", date: "2026-05-03", isSprint: true },
  { round: 7, name: "Canadian Grand Prix", country: "Canada", circuit: "Circuit Gilles Villeneuve", date: "2026-05-24", isSprint: true },
  { round: 8, name: "Monaco Grand Prix", country: "Monaco", circuit: "Circuit de Monaco", date: "2026-06-07", isSprint: false },
  { round: 9, name: "Spanish Grand Prix", country: "Spain", circuit: "Circuit de Barcelona-Catalunya", date: "2026-06-14", isSprint: false },
  { round: 10, name: "Austrian Grand Prix", country: "Austria", circuit: "Red Bull Ring", date: "2026-06-28", isSprint: false },
  { round: 11, name: "British Grand Prix", country: "United Kingdom", circuit: "Silverstone", date: "2026-07-05", isSprint: true },
  { round: 12, name: "Belgian Grand Prix", country: "Belgium", circuit: "Spa-Francorchamps", date: "2026-07-19", isSprint: false },
  { round: 13, name: "Hungarian Grand Prix", country: "Hungary", circuit: "Hungaroring", date: "2026-07-26", isSprint: false },
  { round: 14, name: "Dutch Grand Prix", country: "Netherlands", circuit: "Zandvoort", date: "2026-08-23", isSprint: true },
  { round: 15, name: "Italian Grand Prix", country: "Italy", circuit: "Monza", date: "2026-09-06", isSprint: false },
  { round: 16, name: "Madrid Grand Prix", country: "Spain", circuit: "Madring", date: "2026-09-13", isSprint: false },
  { round: 17, name: "Azerbaijan Grand Prix", country: "Azerbaijan", circuit: "Baku City Circuit", date: "2026-09-26", isSprint: false },
  { round: 18, name: "Singapore Grand Prix", country: "Singapore", circuit: "Marina Bay Street Circuit", date: "2026-10-11", isSprint: true },
  { round: 19, name: "United States Grand Prix", country: "United States", circuit: "Circuit of the Americas", date: "2026-10-25", isSprint: false },
  { round: 20, name: "Mexico City Grand Prix", country: "Mexico", circuit: "Autodromo Hermanos Rodriguez", date: "2026-11-01", isSprint: false },
  { round: 21, name: "Sao Paulo Grand Prix", country: "Brazil", circuit: "Interlagos", date: "2026-11-08", isSprint: false },
  { round: 22, name: "Las Vegas Grand Prix", country: "United States", circuit: "Las Vegas Strip Circuit", date: "2026-11-21", isSprint: false },
  { round: 23, name: "Qatar Grand Prix", country: "Qatar", circuit: "Lusail International Circuit", date: "2026-11-29", isSprint: false },
  { round: 24, name: "Abu Dhabi Grand Prix", country: "United Arab Emirates", circuit: "Yas Marina Circuit", date: "2026-12-06", isSprint: false },
];
