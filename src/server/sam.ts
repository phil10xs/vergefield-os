/**
 * SAM 3.1 issue grounding: given a still frame and a short concept phrase,
 * return up to three normalized boxes around the matching damage. Uses the
 * same Meta Model API key as video analysis; null when unconfigured or on
 * any failure, so callers treat regions as optional enrichment.
 */

const META_API_BASE = "https://api.meta.ai";
const MODEL = "sam-3.1";
const TIMEOUT_MS = 45000;
const MAX_REGIONS = 3;

export interface SamRegion {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Frame canvas the fractions are relative to. */
  fw: number;
  fh: number;
}

const BOX_PATTERN =
  /<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)\|>/g;

/** Fallback nouns when the model names no object; first match wins. */
const KNOWN_OBJECTS = [
  "mould",
  "damp",
  "leak",
  "tap",
  "drawer",
  "cupboard",
  "wardrobe",
  "window",
  "wall",
  "ceiling",
  "floor",
  "door",
  "garden",
  "weed",
  "glass",
  "shade",
  "blind",
  "paint",
  "pipe",
  "radiator",
  "sink",
  "toilet",
  "shower",
  "bath",
  "roof",
  "gutter",
  "fence",
  "carpet",
  "tile",
  "socket",
  "boiler",
];

export function conceptFromAnalysis(input: {
  object: string | null;
  description: string;
  transcript: string;
}): string | null {
  if (input.object && input.object.trim()) return input.object.trim();
  const haystack = `${input.description} ${input.transcript}`.toLowerCase();
  for (const noun of KNOWN_OBJECTS) {
    if (new RegExp(`\\b${noun}s?\\b`).test(haystack)) return noun;
  }
  return null;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function parseSamRegions(text: string, label: string): SamRegion[] {
  const regions: SamRegion[] = [];
  for (const match of text.matchAll(BOX_PATTERN)) {
    if (regions.length >= MAX_REGIONS) break;
    const [x1, y1, x2, y2, w, h] = match.slice(1, 7).map(Number) as number[];
    if (!w || !h || w <= 0 || h <= 0) continue;
    if (!(x2! > x1! && y2! > y1!)) continue;
    const box = {
      label,
      x: clamp01(x1! / w),
      y: clamp01(y1! / h),
      w: clamp01((x2! - x1!) / w),
      h: clamp01((y2! - y1!) / h),
    };
    if (box.w <= 0 || box.h <= 0) continue;
    regions.push({ ...box, fw: w, fh: h });
  }
  return regions;
}

const CONTAIN_RATIO = 16 / 9;

/**
 * Map a frame-relative box onto an object-contain video inside a 16:9
 * wrapper, accounting for pillar/letterboxing. Falls back to identity
 * when the frame size is missing.
 */
export function fitBoxToContain(box: SamRegion): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const ratio =
    box.fw > 0 && box.fh > 0 ? box.fw / box.fh : CONTAIN_RATIO;
  if (ratio >= CONTAIN_RATIO) {
    const height = CONTAIN_RATIO / ratio;
    const offsetY = (1 - height) / 2;
    return {
      left: box.x,
      top: offsetY + box.y * height,
      width: box.w,
      height: box.h * height,
    };
  }
  const width = ratio / CONTAIN_RATIO;
  const offsetX = (1 - width) / 2;
  return {
    left: offsetX + box.x * width,
    top: box.y,
    width: box.w * width,
    height: box.h,
  };
}

function extractText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  if (typeof root.output_text === "string" && root.output_text) {
    return root.output_text;
  }
  if (Array.isArray(root.output)) {
    const parts: string[] = [];
    for (const item of root.output) {
      const content = (item as { content?: unknown })?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          const text = (block as { text?: unknown })?.text;
          if (typeof text === "string" && text) parts.push(text);
        }
      }
    }
    if (parts.length > 0) return parts.join("\n");
  }
  return null;
}

export async function localizeIssue(
  frameBytes: Buffer,
  concept: string,
): Promise<SamRegion[] | null> {
  const key = process.env.META_MODEL_API_KEY?.trim();
  const prompt = concept.trim().slice(0, 160);
  if (!key || frameBytes.length === 0 || !prompt) return null;
  try {
    const form = new FormData();
    form.append("purpose", "user_data");
    form.append(
      "file",
      new Blob([new Uint8Array(frameBytes)], { type: "image/jpeg" }),
      "frame.jpg",
    );
    const upload = await fetch(`${META_API_BASE}/v1/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!upload.ok) return null;
    const { id, file_id } = (await upload.json()) as {
      id?: unknown;
      file_id?: unknown;
    };
    const fileId = id ?? file_id;
    if (typeof fileId !== "string" || !fileId) return null;
    const response = await fetch(`${META_API_BASE}/v1/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_file", file_id: fileId },
              { type: "input_text", text: prompt },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const text = extractText(await response.json());
    if (!text) return null;
    const regions = parseSamRegions(text, prompt);
    return regions.length > 0 ? regions : null;
  } catch {
    return null;
  }
}
