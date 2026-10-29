export const MAX_VIDEO_SECONDS = 20;
export const MAX_VIDEOS = 1;

export interface MediaSelection {
  kind: "photo" | "video";
  durationSeconds?: number;
}

export function checkMediaSelection(
  files: MediaSelection[],
): string | null {
  const videos = files.filter((file) => file.kind === "video");
  if (videos.length > MAX_VIDEOS) {
    return "Please attach at most one video — add stills for the rest.";
  }
  const overlong = videos.find(
    (video) => (video.durationSeconds ?? 0) > MAX_VIDEO_SECONDS,
  );
  if (overlong) {
    return "Please keep the video to 20 seconds or less.";
  }
  return null;
}
