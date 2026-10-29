import type { Job } from "@/db/schema";

export interface VisitGroup {
  day: string;
  label: string;
  sessions: Job[];
}

export interface PropertyGroup {
  address: string;
  visits: VisitGroup[];
  sessionCount: number;
}

function visitLabel(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function sessionAddress(item: Job): string {
  return (
    item.propertyAddress?.trim() || item.siteName?.trim() || "Unassigned site"
  );
}

export function visitDayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatVisitDay(day: string): string {
  return visitLabel(day);
}

export function selectVisitSessions(jobs: Job[], anchor: Job): Job[] {
  const address = sessionAddress(anchor);
  const day = visitDayOf(anchor.createdAt);
  return jobs
    .filter(
      (item) =>
        sessionAddress(item) === address &&
        visitDayOf(item.createdAt) === day,
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function groupSessionsByPropertyVisit(jobs: Job[]): PropertyGroup[] {
  const byProperty = new Map<string, Map<string, Job[]>>();
  for (const item of jobs) {
    const address = sessionAddress(item);
    const day = visitDayOf(item.createdAt);
    let visits = byProperty.get(address);
    if (!visits) {
      visits = new Map();
      byProperty.set(address, visits);
    }
    const list = visits.get(day) ?? [];
    list.push(item);
    visits.set(day, list);
  }
  return [...byProperty.entries()]
    .map(([address, visits]) => {
      const ordered = [...visits.entries()]
        .map(([day, sessions]) => ({
          day,
          label: visitLabel(day),
          sessions: sessions.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          ),
        }))
        .sort((a, b) => (a.day < b.day ? 1 : -1));
      return {
        address,
        visits: ordered,
        sessionCount: ordered.reduce(
          (total, visit) => total + visit.sessions.length,
          0,
        ),
      };
    })
    .sort((a, b) => a.address.localeCompare(b.address));
}

export function excerptWords(text: string, maxWords: number): string {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")} …`;
}

export function inferIssue(
  notes: string | null,
  heard: string[],
  seen: string[],
): string {
  const clean = notes?.trim();
  if (clean && clean !== "See photos and video.") return clean;
  const fromHeard = heard.join(" ").trim();
  if (fromHeard) return excerptWords(fromHeard, 40);
  const fromSeen = seen.join(" ").trim();
  if (fromSeen) return excerptWords(fromSeen, 40);
  return "See photos and video.";
}

const ISSUE_PROBLEMS: { match: RegExp; adj: string; noun: string }[] = [
  { match: /mould|mold/i, adj: "Mouldy", noun: "Mould" },
  { match: /damp/i, adj: "Damp", noun: "Damp" },
  { match: /leak/i, adj: "Leaking", noun: "Leak" },
  { match: /drip/i, adj: "Leaking", noun: "Leak" },
  { match: /block/i, adj: "Blocked", noun: "Blockage" },
  { match: /broken|broke|fell off/i, adj: "Broken", noun: "Breakage" },
  { match: /crack/i, adj: "Cracked", noun: "Cracks" },
  { match: /weed/i, adj: "Weedy", noun: "Weeds" },
  { match: /flicker/i, adj: "Flickering", noun: "Flickering lights" },
  {
    match: /faulty|fault|failure|no hot water|not working/i,
    adj: "Faulty",
    noun: "Fault",
  },
];

const ISSUE_PLACES = [
  "living room",
  "bathroom",
  "kitchen",
  "bedroom",
  "garden",
  "hallway",
  "cupboard",
  "window",
  "bathtub",
  "glass",
  "tap",
  "boiler",
  "sink",
  "floor",
  "wall",
  "ceiling",
  "door",
  "lock",
  "roof",
  "light",
];

const PLACE_ALIAS: Record<string, string> = { bathtub: "bathroom" };

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function nameIssue(text: string, trade: string | null): string {
  const problem = ISSUE_PROBLEMS.find((entry) => entry.match.test(text));
  let place: string | null = null;
  let earliest = Number.POSITIVE_INFINITY;
  const lower = text.toLowerCase();
  for (const candidate of ISSUE_PLACES) {
    const at = lower.indexOf(candidate);
    if (at !== -1 && at < earliest) {
      earliest = at;
      place = candidate;
    }
  }
  if (place) place = PLACE_ALIAS[place] ?? place;
  if (problem && place) return `${problem.adj} ${titleCase(place)}`;
  if (problem) return problem.noun;
  if (place) return `${titleCase(place)} issue`;
  if (trade?.trim()) return `${trade.trim()} issue`;
  return "Reported issue";
}

const FILLER_WORDS = new Set([
  "uh",
  "um",
  "erm",
  "er",
  "ah",
  "mm",
  "mhm",
  "hmm",
  "uh-huh",
]);

function cleanToken(raw: string): string {
  return raw.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

export function condenseTranscript(text: string, maxWords = 60): string {
  const tokens = text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  const kept: string[] = [];
  let prev = "";
  for (let index = 0; index < tokens.length; index++) {
    const raw = tokens[index]!;
    const word = cleanToken(raw);
    if (
      word === "you" &&
      cleanToken(tokens[index + 1] ?? "") === "know"
    ) {
      index++;
      continue;
    }
    if (!word || FILLER_WORDS.has(word)) continue;
    if (word === prev) continue;
    prev = word;
    kept.push(raw);
  }
  return excerptWords(kept.join(" "), maxWords);
}

export interface BudgetTotal {
  low: number;
  high: number;
}

/**
 * Sums per-issue cost bands ("£40–£120", "around £80") into a visit budget.
 * Unparseable and missing bands are skipped; null when nothing sums.
 */
export function sumCostBands(
  bands: (string | null | undefined)[],
): BudgetTotal | null {
  let low = 0;
  let high = 0;
  let count = 0;
  for (const band of bands) {
    if (!band) continue;
    const numbers = [...band.replace(/,/g, "").matchAll(/\d+(?:\.\d+)?/g)].map(
      (match) => Number(match[0]),
    );
    if (numbers.length === 0 || numbers.some((n) => !Number.isFinite(n))) {
      continue;
    }
    const first = numbers[0]!;
    const last = numbers[numbers.length - 1]!;
    low += Math.min(first, last);
    high += Math.max(first, last);
    count += 1;
  }
  return count > 0 ? { low, high } : null;
}

export function formatBudget(total: BudgetTotal): string {
  const pounds = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
  return total.low === total.high
    ? pounds(total.low)
    : `${pounds(total.low)}–${pounds(total.high)}`;
}

export function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}
