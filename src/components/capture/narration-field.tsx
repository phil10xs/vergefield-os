"use client";

import * as React from "react";
import { VoiceInputButton } from "@/components/voice/voice-input-button";

export function NarrationField({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const [value, setValue] = React.useState(defaultValue ?? "");
  return (
    <div className="flex items-start gap-2">
      <textarea
        name="narration"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        placeholder="Spoken narration — type it, or tap the mic and talk through what the camera sees…"
        className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <VoiceInputButton
        onTranscript={(transcript) =>
          setValue((current) => (current ? `${current} ${transcript}` : transcript))
        }
      />
    </div>
  );
}
