"use client";

import * as React from "react";
import { Images, Plus, Video, X } from "lucide-react";
import { durationOf } from "./media-upload-fields";
import { checkMediaSelection } from "@/lib/media-rules";

type Source = "video" | "gallery";

interface Preview {
  url: string;
  kind: "photo" | "video";
  name: string;
  source: Source;
  index: number;
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
    hint: "Up to 20 seconds, narrate as you film",
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
  const [previews, setPreviews] = React.useState<Preview[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLInputElement>(null);
  const galleryRef = React.useRef<HTMLInputElement>(null);
  const urlsRef = React.useRef<string[]>([]);

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
    inputList()
      .find((entry) => entry.source === source)
      ?.el?.click();
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
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background px-3 py-3 text-sm font-semibold"
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

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setSheetOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose capture source"
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-border bg-card p-4 pb-8"
          >
            <p className="mb-3 text-sm font-bold">Add to your check-in</p>
            <div className="space-y-2">
              {SOURCES.map((source) => (
                <button
                  key={source.key}
                  type="button"
                  onClick={() => pick(source.key)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-left"
                >
                  <source.icon
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {source.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {source.hint}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
