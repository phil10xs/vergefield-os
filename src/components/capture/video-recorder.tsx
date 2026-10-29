"use client";

import * as React from "react";
import { Circle, Square, VideoOff, X } from "lucide-react";
import {
  RECORDER_AUDIO_BITS_PER_SECOND,
  RECORDER_MAX_SECONDS,
  RECORDER_VIDEO_BITS_PER_SECOND,
  RECORDER_VIDEO_CONSTRAINTS,
  pickRecorderMimeType,
  recorderFileName,
} from "@/lib/recorder";

/**
 * Capped in-browser recorder: 720p target, ~2.5 Mbps video + 128 kbps audio,
 * 20-second auto-stop. Keeps phone clips small for fast upload while holding
 * full quality for the model.
 */
export function VideoRecorder({
  onDone,
  onCancel,
}: {
  onDone: (file: File) => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const previewRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<number | null>(null);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { ...RECORDER_VIDEO_CONSTRAINTS },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setReady(true);
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
          await previewRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) {
          setError(
            "Camera unavailable — allow access or choose videos from your gallery instead.",
          );
        }
      }
    }
    void start();
    return () => {
      cancelled = true;
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Ignore teardown races.
        }
      }
      stopTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = pickRecorderMimeType(
      (type) => window.MediaRecorder?.isTypeSupported(type) ?? false,
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(
        stream,
        mimeType
          ? {
              mimeType,
              videoBitsPerSecond: RECORDER_VIDEO_BITS_PER_SECOND,
              audioBitsPerSecond: RECORDER_AUDIO_BITS_PER_SECOND,
            }
          : undefined,
      );
    } catch {
      // Some browsers reject bitrate hints — retry with plain defaults.
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        setError("Recording is not supported here — use the gallery instead.");
        return;
      }
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      clearTimer();
      const type = recorder.mimeType || mimeType || "video/webm";
      const file = new File(chunksRef.current, recorderFileName(type), {
        type: type.split(";")[0] ?? "video/webm",
      });
      cleanupOnly();
      if (file.size > 0) {
        onDone(file);
      } else {
        setError("Nothing was recorded — try again.");
        setRecording(false);
      }
    };
    setElapsed(0);
    setRecording(true);
    recorder.start(250);
    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(seconds);
      if (seconds >= RECORDER_MAX_SECONDS) stopRecording();
    }, 250);
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Ignore double-stop races.
      }
    }
  }

  function cleanupOnly() {
    clearTimer();
    stopTracks();
  }

  function handleCancel() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // Ignore teardown races.
      }
    }
    cleanupOnly();
    onCancel();
  }

  const remaining = Math.max(0, RECORDER_MAX_SECONDS - elapsed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Record a video"
      className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-border bg-card p-4 pb-8"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">
          {recording ? `Recording… ${remaining}s left` : "Record your clip"}
        </p>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Close recorder"
          className="rounded-full p-1 text-muted-foreground"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : (
        <>
          <video
            ref={previewRef}
            muted
            playsInline
            autoPlay
            className="aspect-video w-full rounded-xl bg-black object-cover"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            20 seconds max · capped size for fast upload · narrate as you film
          </p>
          <div className="mt-3 flex gap-2">
            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={!ready}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60"
              >
                <Circle className="h-4 w-4 fill-current" aria-hidden />
                Start recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-3 py-3 text-sm font-semibold text-white"
              >
                <Square className="h-4 w-4 fill-current" aria-hidden />
                Stop ({remaining}s)
              </button>
            )}
          </div>
        </>
      )}

      {!ready && !error ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <VideoOff className="h-4 w-4" aria-hidden />
          Starting camera…
        </p>
      ) : null}
    </div>
  );
}
