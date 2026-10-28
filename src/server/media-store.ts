import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join, resolve, sep } from "path";

export const UPLOADS_DIR = join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function mediaKind(mimeType: string): "photo" | "video" | null {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return null;
}

export function safeFilename(original: string): string {
  const base = original.split(/[\\/]/).pop() ?? "capture";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "capture";
}

export async function saveUpload(
  jobId: string,
  originalName: string,
  mimeType: string,
  bytes: Buffer,
): Promise<{ kind: "photo" | "video"; filename: string; sizeBytes: number }> {
  const kind = mediaKind(mimeType);
  if (!kind) throw new Error(`Unsupported file type: ${mimeType || "unknown"}`);
  if (bytes.length === 0) throw new Error("Empty file");
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 50 MB limit");
  }
  const dir = join(UPLOADS_DIR, jobId);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}-${safeFilename(originalName)}`;
  await writeFile(join(dir, filename), bytes);
  return { kind, filename, sizeBytes: bytes.length };
}

export function uploadPath(jobId: string, filename: string): string {
  const root = resolve(UPLOADS_DIR) + sep;
  const resolved = resolve(UPLOADS_DIR, jobId, filename);
  if (!resolved.startsWith(root)) throw new Error("Invalid path");
  return resolved;
}
