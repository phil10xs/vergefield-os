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
      "drainage",
      "blocked",
      "blockage",
      "toilet",
      "sink",
      "bath",
      "shower",
      "cistern",
      "overflow",
      "stopcock",
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
      "bulb",
      "downlight",
      "dimmer",
      "circuit",
      "meter",
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
      "banister",
      "architrave",
      "decking",
      "fence",
      "gate",
      "timber",
      "wood",
    ],
  },
  {
    trade: "Heating engineer",
    words: [
      "boiler",
      "boiler pressure",
      "pilot light",
      "heating",
      "radiator",
      "cold radiator",
      "hot water",
      "no hot water",
      "thermostat",
      "cylinder",
      "pump",
    ],
  },
  {
    trade: "Gas engineer",
    words: [
      "gas",
      "gas leak",
      "gas safety",
      "gas certificate",
      "carbon monoxide",
      "cp12",
    ],
  },
  {
    trade: "Painter",
    words: [
      "damp",
      "mould",
      "mold",
      "paint",
      "wallpaper",
      "gloss",
      "emulsion",
      "peeling",
      "stain",
      "crack",
    ],
  },
  {
    trade: "Plasterer",
    words: [
      "plaster",
      "skim",
      "coving",
      "dry lining",
      "partition",
      "render",
    ],
  },
  {
    trade: "Roofer",
    words: [
      "roof",
      "flat roof",
      "gutter",
      "downpipe",
      "slate",
      "tiles",
      "flashing",
      "fascia",
      "soffit",
      "chimney",
      "loft",
    ],
  },
  {
    trade: "Tiler",
    words: [
      "tile",
      "grout",
      "shower tray",
      "splashback",
      "silicone",
      "bathroom",
    ],
  },
  {
    trade: "Joiner",
    words: [
      "window",
      "double glazing",
      "upvc",
      "sash",
      "patio door",
      "lock",
      "frame",
    ],
  },
  {
    trade: "Bricklayer",
    words: ["brick", "mortar", "wall", "pointing", "repointing", "lintel"],
  },
  {
    trade: "Welder",
    words: ["weld", "metal gate", "railing"],
  },
  {
    trade: "Scaffolder",
    words: ["scaffold"],
  },
  {
    trade: "Gardener",
    words: [
      "garden",
      "weed",
      "weeds",
      "weedy",
      "moss",
      "mossy",
      "lawn",
      "grass",
      "hedge",
      "overgrown",
      "flowerbed",
      "pruning",
      "mow",
    ],
  },
  {
    trade: "Cleaner",
    words: [
      "cleaner",
      "clean",
      "deep clean",
      "scrub",
      "pressure wash",
      "jet wash",
    ],
  },
];

function titleCase(trade: string): string {
  return trade
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function wordPattern(word: string): RegExp {
  return new RegExp(`\\b${word}s?\\b`);
}

export function inferTrade(text: string): string | null {
  const lower = text.toLowerCase();
  if (!lower.trim()) return null;
  const named = [...TRADES].sort((a, b) => b.length - a.length);
  for (const trade of named) {
    if (wordPattern(trade).test(lower)) {
      return titleCase(trade);
    }
  }
  let best: { trade: string; hits: number } | null = null;
  for (const { trade, words } of TRADE_KEYWORDS) {
    const hits = words.filter((word) =>
      wordPattern(word.toLowerCase()).test(lower),
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
