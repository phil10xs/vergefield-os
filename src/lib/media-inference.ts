import { TRADES } from "./chat-parse";

const TRADE_KEYWORDS: { trade: string; words: string[] }[] = [
  {
    trade: "Plumber",
    words: [
      "leak",
      "leaking",
      "drip",
      "tap",
      "faucet",
      "pipe",
      "drain",
      "blocked",
      "blockage",
      "toilet",
      "sink",
      "water pressure",
      "flood",
    ],
  },
  {
    trade: "Electrician",
    words: [
      "socket",
      "wiring",
      "fuse",
      "fusebox",
      "consumer unit",
      "no power",
      "power cut",
      "switch",
      "light",
      "flicker",
      "sparking",
      "electric",
      "trip switch",
    ],
  },
  {
    trade: "Carpenter",
    words: [
      "wardrobe",
      "door",
      "hinge",
      "shelf",
      "shelves",
      "cupboard",
      "drawer",
      "floorboard",
      "skirting",
      "timber",
      "wood",
    ],
  },
  {
    trade: "Heating engineer",
    words: [
      "boiler",
      "heating",
      "radiator",
      "hot water",
      "thermostat",
      "cylinder",
    ],
  },
  {
    trade: "Painter",
    words: [
      "damp",
      "mould",
      "mold",
      "paint",
      "peeling",
      "stain",
      "plaster",
      "crack",
    ],
  },
  {
    trade: "Roofer",
    words: ["roof", "gutter", "slate", "tiles", "chimney", "loft"],
  },
  { trade: "Joiner", words: ["window", "lock", "frame"] },
  { trade: "Bricklayer", words: ["brick", "mortar", "wall", "pointing"] },
];

function titleCase(trade: string): string {
  return trade
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function inferTrade(text: string): string | null {
  const lower = text.toLowerCase();
  if (!lower.trim()) return null;
  const named = [...TRADES].sort((a, b) => b.length - a.length);
  for (const trade of named) {
    if (new RegExp(`\\b${trade}s?\\b`).test(lower)) {
      return titleCase(trade);
    }
  }
  let best: { trade: string; hits: number } | null = null;
  for (const { trade, words } of TRADE_KEYWORDS) {
    const hits = words.filter((word) =>
      lower.includes(word.toLowerCase()),
    ).length;
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { trade, hits };
    }
  }
  return best?.trade ?? null;
}

export function buildTitle(
  trade: string | null,
  address: string,
  text: string,
): string {
  const short = address.split(",")[0]?.trim() || "Site";
  const label = trade ?? "General";
  const lead = text
    .split(/[.\n]/)
    .map((sentence) => sentence.trim())
    .find(Boolean)
    ?.slice(0, 60);
  const title = lead
    ? `${label} request — ${short}: ${lead}`
    : `${label} request — ${short}`;
  return title.slice(0, 120);
}
