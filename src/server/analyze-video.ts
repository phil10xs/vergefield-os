const META_API_BASE = "https://api.meta.ai";
const MODEL = "muse-spark-1.2";
const TIMEOUT_MS = 30000;
const MAX_ANALYSIS_BYTES = 25 * 1024 * 1024;

// Public-repo mock prompt: generic wording that still returns a real
// transcript and description. The tuned production prompt lives only in the
// private repo and is never pushed here.
const TRADE_CHOICES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Heating engineer",
  "Gas engineer",
  "Painter",
  "Plasterer",
  "Roofer",
  "Tiler",
  "Joiner",
  "Bricklayer",
  "Welder",
  "Scaffolder",
  "Gardener",
  "Cleaner",
  "General",
];

const PROMPT = [
  "A person filmed this short clip.",
  "1) Transcribe any spoken words.",
  "2) Describe what the footage shows in 2-3 sentences.",
  `3) Pick the one trade this issue needs from: ${TRADE_CHOICES.join(", ")}.`,
  'Reply as JSON only: {"transcript": "...", "description": "...", "trade": "..."}.',
].join(" ");

export interface VideoAnalysis {
  transcript: string;
  description: string;
  trade: string | null;
}

function normalizeTrade(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase();
  if (!clean) return null;
  return (
    TRADE_CHOICES.find((choice) => choice.toLowerCase() === clean) ?? null
  );
}

function extensionFor(mimeType: string): string {
  if (mimeType === "video/quicktime") return "mov";
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/x-m4v") return "m4v";
  return "mp4";
}

function extractText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  if (typeof root.output_text === "string" && root.output_text) {
    return root.output_text;
  }
  if (typeof root.output === "string" && root.output) {
    return root.output as string;
  }
  if (Array.isArray(root.output)) {
    const parts: string[] = [];
    for (const item of root.output) {
      const content = (item as { content?: unknown })?.content;
      if (typeof content === "string" && content) parts.push(content);
      else if (Array.isArray(content)) {
        for (const block of content) {
          const text = (block as { text?: unknown })?.text;
          if (typeof text === "string" && text) parts.push(text);
        }
      }
    }
    if (parts.length > 0) return parts.join("\n");
  }
  const choices = root.choices;
  if (Array.isArray(choices)) {
    const content = (
      choices[0] as { message?: { content?: unknown } } | undefined
    )?.message?.content;
    if (typeof content === "string" && content) return content;
  }
  return null;
}

function parseAnalysis(text: string): VideoAnalysis {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as {
        transcript?: unknown;
        description?: unknown;
        trade?: unknown;
      };
      return {
        transcript:
          typeof parsed.transcript === "string" ? parsed.transcript : "",
        description:
          typeof parsed.description === "string" ? parsed.description : "",
        trade: normalizeTrade(parsed.trade),
      };
    } catch {
      // Fall through to plain-text handling below.
    }
  }
  return { transcript: "", description: text.slice(0, 1000), trade: null };
}

async function uploadFile(
  key: string,
  bytes: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("purpose", "user_data");
    form.append(
      "file",
      new Blob([new Uint8Array(bytes)], { type: mimeType }),
      `clip.${extensionFor(mimeType)}`,
    );
    const response = await fetch(`${META_API_BASE}/v1/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      id?: unknown;
      file_id?: unknown;
    };
    const fileId = payload.id ?? payload.file_id;
    return typeof fileId === "string" && fileId ? fileId : null;
  } catch {
    return null;
  }
}

async function askAboutVideo(
  key: string,
  video: { type: "input_file"; file_id: string } | { type: "input_video"; video_url: string },
): Promise<VideoAnalysis | null> {
  try {
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
            content: [video, { type: "input_text", text: PROMPT }],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const text = extractText(await response.json());
    if (!text) return null;
    return parseAnalysis(text);
  } catch {
    return null;
  }
}

export async function analyzeVideo(
  bytes: Buffer,
  mimeType: string,
): Promise<VideoAnalysis | null> {
  const key = process.env.META_MODEL_API_KEY?.trim();
  if (!key || bytes.length === 0 || bytes.length > MAX_ANALYSIS_BYTES) {
    return null;
  }
  const fileId = await uploadFile(key, bytes, mimeType);
  if (fileId) {
    const viaFile = await askAboutVideo(key, {
      type: "input_file",
      file_id: fileId,
    });
    if (viaFile) return viaFile;
  }
  return askAboutVideo(key, {
    type: "input_video",
    video_url: `data:${mimeType};base64,${bytes.toString("base64")}`,
  });
}
