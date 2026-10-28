export interface JobDraft {
  title: string;
  siteName: string | null;
  assignee: string | null;
  priority: "low" | "medium" | "high";
  trade: string | null;
  notes: string | null;
}

export const TRADES = [
  "carpenter",
  "plumber",
  "electrician",
  "bricklayer",
  "plasterer",
  "painter",
  "roofer",
  "tiler",
  "welder",
  "joiner",
  "scaffolder",
  "labourer",
  "heating engineer",
  "gas engineer",
] as const;

export const TRADE_OPTIONS = [
  ...TRADES.map((trade) =>
    trade
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  ),
  "Other",
] as const;

const DAY_WORDS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "today",
  "tomorrow",
  "morning",
  "afternoon",
  "evening",
]);

function removeFirst(haystack: string, needle: string): string {
  const index = haystack.indexOf(needle);
  if (index === -1) return haystack;
  return `${haystack.slice(0, index)} ${haystack.slice(index + needle.length)}`;
}

export function parseJobMessage(message: string): JobDraft {
  let rest = message.trim();
  const lower = rest.toLowerCase();

  let priority: JobDraft["priority"] = "medium";
  const highMatch = lower.match(
    /\b(urgent|asap|emergency|high priority|priority high)\b/,
  );
  const lowMatch = highMatch
    ? null
    : lower.match(/\b(low priority|priority low|no rush|whenever)\b/);
  if (highMatch) {
    priority = "high";
    rest = removeFirst(rest, rest.slice(highMatch.index, highMatch.index! + highMatch[0].length));
  } else if (lowMatch) {
    priority = "low";
    rest = removeFirst(rest, rest.slice(lowMatch.index, lowMatch.index! + lowMatch[0].length));
  }

  let notes: string | null = null;
  const notesMatch = rest.match(/\bnotes?\s*:\s*(.+)$/i);
  if (notesMatch?.[1]) {
    notes = notesMatch[1].trim();
    rest = rest.slice(0, notesMatch.index).trim();
  }

  let assignee: string | null = null;
  const assignMatch = rest.match(
    /\bassign(?:ed)?\s+to\s+([A-Za-z][\w.]*(?:\s+[A-Za-z][\w.]*)*)/,
  );
  const forMatch = assignMatch
    ? null
    : rest.match(/\bfor\s+([A-Z][\w.]*(?:\s+[A-Z][\w.]*)*)/);
  const who = (assignMatch?.[1] ?? forMatch?.[1] ?? "").trim();
  if (who) {
    assignee = who;
    rest = removeFirst(rest, (assignMatch ?? forMatch)![0]);
  }

  let siteName: string | null = null;
  const siteColon = rest.match(/\bsite\s*:\s*([^,.;]+)/i);
  if (siteColon?.[1] && siteColon[1].trim()) {
    siteName = siteColon[1].trim();
    rest = removeFirst(rest, siteColon[0]);
  } else {
    const atMatch = rest.match(
      /\b(?:at|on|in)\s+([A-Z][\w'&.\-]*(?:\s+[A-Z0-9][\w'&.\-]*)*)/,
    );
    const candidate = atMatch?.[1]?.trim() ?? "";
    if (candidate && !DAY_WORDS.has(candidate.toLowerCase())) {
      siteName = candidate;
      rest = removeFirst(rest, atMatch![0]);
    }
  }

  let trade: string | null = null;
  const sortedTrades = [...TRADES].sort((a, b) => b.length - a.length);
  for (const option of sortedTrades) {
    if (new RegExp(`\\b${option}s?\\b`).test(rest.toLowerCase())) {
      trade = option
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      break;
    }
  }

  let title = rest
    .replace(
      /^(please\s+)?(create|log|add|raise)(\s+a)?\s+(new\s+)?job\s*[:\-–]?\s*/i,
      "",
    )
    .replace(/\s+/g, " ")
    .replace(/(^|\s)[,.;:]+(?=\s|$)/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,.;:\-–\s]+|[,.;:\-–\s]+$/g, "")
    .trim();
  if (!title) title = message.trim().slice(0, 120);
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, siteName, assignee, priority, trade, notes };
}
