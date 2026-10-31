/**
 * Capped in-browser recording so phone clips stay small without losing what
 * the model needs to see and hear. Uses a capped capture budget (720p,
 * ~2 Mbps): a 20-second check-in lands around 6 MB instead of 30–130 MB of
 * raw iPhone footage.
 */

export const RECORDER_MAX_SECONDS = 20;
export const RECORDER_VIDEO_BITS_PER_SECOND = 2_500_000;
export const RECORDER_AUDIO_BITS_PER_SECOND = 128_000;

export const RECORDER_VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: "environment",
} as const;

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

/** First MediaRecorder mime type the browser claims, or undefined. */
export function pickRecorderMimeType(
  isSupported: (mimeType: string) => boolean,
): string | undefined {
  for (const candidate of MIME_CANDIDATES) {
    try {
      if (isSupported(candidate)) return candidate;
    } catch {
      // Treat probe failures as unsupported and keep looking.
    }
  }
  return undefined;
}

export function recorderFileExtension(mimeType: string | undefined): string {
  return mimeType?.includes("mp4") ? "mp4" : "webm";
}

export function recorderFileName(mimeType: string | undefined): string {
  return `checkin-${Date.now()}.${recorderFileExtension(mimeType)}`;
}

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

export interface CaptureDevice {
  userAgent: string;
  maxTouchPoints: number;
  coarsePointer: boolean;
}

/**
 * True where tapping the capture input opens the full native camera, so the
 * cramped in-browser recorder is skipped: phones, tablets, and other
 * coarse-pointer touch devices. Touch laptops keep the in-browser recorder.
 */
export function shouldUseNativeCapture(device: CaptureDevice): boolean {
  const ua = device.userAgent ?? "";
  if (/android|iphone|ipod|mobile/i.test(ua)) return true;
  if (/ipad/i.test(ua)) return true;
  if (/macintosh/i.test(ua) && device.maxTouchPoints > 1) return true;
  return device.coarsePointer && device.maxTouchPoints > 0;
}
