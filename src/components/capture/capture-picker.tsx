"use client";

import * as React from "react";
import { Images, Plus, Video, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { durationOf } from "./media-upload-fields";
import { VideoRecorder } from "./video-recorder";
import { checkMediaSelection } from "@/lib/media-rules";
import { isRecordingSupported, shouldUseNativeCapture } from "@/lib/recorder";

type Source = "video" | "gallery";

interface Preview {
  url: string;
  kind: "photo" | "video";
  name: string;
  source: Source;
  index: number;
}

function eventPromise(
  target: HTMLElement,
  name: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      target.removeEventListener(name, done);
      reject(new Error("timeout"));
    }, timeoutMs);
    function done() {
      window.clearTimeout(timer);
      target.removeEventListener(name, done);
      resolve();
    }
    target.addEventListener(name, done);
  });
}

/**
 * Grab one still near the start of a clip for SAM issue grounding. Silent
 * enrichment: failures resolve null and the check-in proceeds without boxes.
 */
async function captureFrame(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await eventPromise(video, "loadeddata", 5000);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    video.currentTime = duration > 1 ? duration * 0.25 : 0.1;
    await eventPromise(video, "seeked", 5000);
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) return null;
    const scale = Math.min(1, 768 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.75),
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const SOURCES: {
  key: Source;
  label: string;
  hint: string;
  icon: typeof Video;
}[] = [
  {
    key: "video",
    label: "Record a video",
    hint: "Up to 20 seconds · capped for fast upload",
    icon: Video,
  },
  {
    key: "gallery",
    label: "Choose videos from gallery",
    hint: "One or more clips, one session each",
    icon: Images,
  },
];

export function CapturePicker() {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [recorderOpen, setRecorderOpen] = React.useState(false);
  const [previews, setPreviews] = React.useState<Preview[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  // Detected after mount so server and first client render agree.
  const [nativeCapture, setNativeCapture] = React.useState(false);

  React.useEffect(() => {
    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    setNativeCapture(
      shouldUseNativeCapture({
        userAgent: navigator.userAgent ?? "",
        maxTouchPoints: navigator.maxTouchPoints ?? 0,
        coarsePointer: coarse,
      }),
    );
  }, []);
  const videoRef = React.useRef<HTMLInputElement>(null);
  const galleryRef = React.useRef<HTMLInputElement>(null);
  const framesRef = React.useRef<HTMLInputElement>(null);
  const urlsRef = React.useRef<string[]>([]);
  const captureRun = React.useRef(0);

  React.useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function inputList(): { source: Source; el: HTMLInputElement | null }[] {
    return [
      { source: "video", el: videoRef.current },
      { source: "gallery", el: galleryRef.current },
    ];
  }

  async function sync() {
    const next: Preview[] = [];
    const files: { kind: "photo" | "video"; file: File }[] = [];
    for (const { source, el } of inputList()) {
      for (const [index, file] of [...(el?.files ?? [])].entries()) {
        const kind = file.type.startsWith("video/") ? "video" : "photo";
        files.push({ kind, file });
        next.push({
          url: URL.createObjectURL(file),
          kind,
          name: file.name,
          source,
          index,
        });
      }
    }
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = next.map((preview) => preview.url);
    setPreviews(next);
    const durations = await Promise.all(
      files.map((entry) => durationOf(entry.file)),
    );
    const message = checkMediaSelection(
      files.map((entry, index) => ({
        kind: entry.kind,
        durationSeconds: durations[index] ?? 0,
        sizeBytes: entry.file.size,
      })),
      { videosOnly: true },
    );
    setError(message);
    for (const { el } of inputList()) {
      el?.setCustomValidity(message && el.files?.length ? message : "");
    }
    void captureFrames(files.filter((entry) => entry.kind === "video"));
  }

  /** Still per video, index-aligned, for SAM grounding. Invisible by design. */
  async function captureFrames(entries: { file: File }[]) {
    const run = (captureRun.current += 1);
    const transfer = new DataTransfer();
    for (const [index, entry] of entries.entries()) {
      const blob = await captureFrame(entry.file);
      if (run !== captureRun.current) return;
      if (blob) {
        transfer.items.add(
          new File([blob], `sam-frame-${index}.jpg`, {
            type: "image/jpeg",
          }),
        );
      }
    }
    if (run !== captureRun.current) return;
    if (framesRef.current) framesRef.current.files = transfer.files;
  }

  function removePreview(preview: Preview) {
    const el = inputList().find((entry) => entry.source === preview.source)?.el;
    if (!el) return;
    if (preview.source === "gallery") {
      const kept = new DataTransfer();
      [...(el.files ?? [])].forEach((file, index) => {
        if (index !== preview.index) kept.items.add(file);
      });
      el.files = kept.files;
    } else {
      el.value = "";
    }
    void sync();
  }

  function pick(source: Source) {
    setSheetOpen(false);
    if (source === "video" && !nativeCapture && isRecordingSupported()) {
      setRecorderOpen(true);
      return;
    }
    inputList()
      .find((entry) => entry.source === source)
      ?.el?.click();
  }

  function acceptRecording(file: File) {
    const el = videoRef.current;
    setRecorderOpen(false);
    if (!el) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    el.files = transfer.files;
    void sync();
  }

  return (
    <div>
      <input
        ref={videoRef}
        type="file"
        name="media"
        accept="video/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden
        onChange={() => void sync()}
        className="sr-only"
      />
      <input
        ref={galleryRef}
        type="file"
        name="media"
        accept="video/*"
        multiple
        tabIndex={-1}
        aria-hidden
        onChange={() => void sync()}
        className="sr-only"
      />
      <input
        ref={framesRef}
        type="file"
        name="frames"
        accept="image/jpeg"
        multiple
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />

      {previews.length > 0 ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {previews.map((preview) => (
            <div
              key={`${preview.source}-${preview.index}-${preview.name}`}
              className="relative overflow-hidden rounded-xl border border-border bg-background"
            >
              {preview.kind === "video" ? (
                <video
                  src={preview.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="aspect-square w-full object-cover"
                />
              )}
              {preview.kind === "video" ? (
                <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Video
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removePreview(preview)}
                aria-label={`Remove ${preview.name}`}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background px-3 py-3 text-sm font-semibold"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {previews.length > 0 ? "Add more" : "Add videos"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        One session per video — keep each clip to 20 seconds. Narrate as
        you film, the trade is detected from your words.
      </p>

      {recorderOpen ? (
        <VideoRecorder
          onDone={acceptRecording}
          onCancel={() => setRecorderOpen(false)}
        />
      ) : null}

      {sheetOpen ? (
        <Modal
          label="Choose capture source"
          onClose={() => setSheetOpen(false)}
        >
          <p className="mb-3 text-base font-semibold">Add to your check-in</p>
          <div className="space-y-2">
            {SOURCES.map((source) => (
              <button
                key={source.key}
                type="button"
                onClick={() => pick(source.key)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-left"
              >
                <source.icon
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {source.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {source.key === "video" && nativeCapture
                      ? "Opens your camera · 20 seconds max"
                      : source.hint}
                  </span>
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="min-h-11 w-full rounded-xl px-3 text-sm font-semibold text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
