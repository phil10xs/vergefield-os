"use client";

import * as React from "react";
import { MediaInputs } from "./media-inputs";
import { checkMediaSelection } from "@/lib/media-rules";

export function durationOf(file: File): Promise<number> {
  if (!file.type.startsWith("video/")) return Promise.resolve(0);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

export function MediaUploadFields({ required = false }: { required?: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  async function validate() {
    const root = rootRef.current;
    if (!root) return;
    const inputs = [
      ...root.querySelectorAll<HTMLInputElement>('input[type="file"]'),
    ];
    const files = inputs.flatMap((input) => [...(input.files ?? [])]);
    const durations = await Promise.all(files.map(durationOf));
    const message = checkMediaSelection(
      files.map((file, index) => ({
        kind: file.type.startsWith("video/") ? "video" : "photo",
        durationSeconds: durations[index] ?? 0,
        sizeBytes: file.size,
      })),
    );
    setError(message);
    for (const input of inputs) {
      input.setCustomValidity(
        message && input.files?.length ? message : "",
      );
    }
  }

  return (
    <div ref={rootRef} onChange={() => void validate()}>
      <MediaInputs required={required} />
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
