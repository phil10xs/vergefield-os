export const MAX_VIDEO_SECONDS = 20;
// Mirrors MAX_UPLOAD_BYTES server-side plus the action body cap: uploads
// past this point are rejected, so stop them here with a clear message.
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export interface MediaSelection {
  kind: "photo" | "video";
  durationSeconds?: number;
  sizeBytes?: number;
}

export function groupFilesBySession<T extends { type: string }>(
  files: T[],
): T[][] {
  const videos = files.filter((file) => file.type.startsWith("video/"));
  const photos = files.filter((file) => !file.type.startsWith("video/"));
  if (videos.length === 0) return files.length > 0 ? [photos] : [];
  const [first, ...rest] = videos;
  return [[first!, ...photos], ...rest.map((video) => [video])];
}

export function checkMediaSelection(
  files: MediaSelection[],
  options: { videosOnly?: boolean } = {},
): string | null {
  if (options.videosOnly && files.some((file) => file.kind !== "video")) {
    return "Only videos are allowed — attach short video clips.";
  }
  const total = files.reduce((sum, file) => sum + (file.sizeBytes ?? 0), 0);
  if (total > MAX_TOTAL_BYTES) {
    return "Those files are over 50 MB in total — try fewer or shorter clips.";
  }
  const videos = files.filter((file) => file.kind === "video");
  const overlong = videos.find(
    (video) => (video.durationSeconds ?? 0) > MAX_VIDEO_SECONDS,
  );
  if (overlong) {
    return "Please keep the video to 20 seconds or less.";
  }
  return null;
}
