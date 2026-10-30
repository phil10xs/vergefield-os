"use client";

import * as React from "react";

export const ISSUE_EXAMPLES = [
  "Broken wardrobe",
  "Leaking tap",
  "Blocked sink",
  "No hot water",
  "Heating failure",
  "Faulty sockets",
  "Lights flickering",
  "Damp or mould patch",
  "Cracked tiles",
  "Broken boiler",
  "Faulty lock",
  "Damaged flooring",
];

export function NoteField() {
  const [value, setValue] = React.useState("");
  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">
          What is the issue?{" "}
          <span className="font-normal text-muted-foreground">
            (optional if you filmed it)
          </span>
        </span>
        <textarea
          name="note"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          placeholder="A sentence or two — or tap an example below…"
          className="text-area"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {ISSUE_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setValue(example)}
            className="min-h-11 rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-muted"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
