"use client";

import * as React from "react";
import { TRADE_OPTIONS, type JobDraft } from "@/lib/chat-parse";
import { createJobFromDraft, parseChatAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/layout/page-header";
import { VoiceInputButton } from "@/components/voice/voice-input-button";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const EXAMPLES = [
  "Create job: second-fix electrics at Hulme Point for Ama Mensah, urgent, needs an electrician",
  "Log a job — snagging walk on Block B, assign to J. Whitfield, low priority",
];

function draftSummary(draft: JobDraft): string {
  const parts = [`"${draft.title}"`];
  if (draft.siteName) parts.push(`site: ${draft.siteName}`);
  if (draft.assignee) parts.push(`assignee: ${draft.assignee}`);
  if (draft.trade) parts.push(`trade: ${draft.trade}`);
  parts.push(`priority: ${draft.priority}`);
  return `I read that as ${parts.join(" · ")}. Check the draft, then create the job.`;
}

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ChatComposer() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      text: "Describe the site job — I'll draft it for you to confirm. Try: “Create job: … at … for …, urgent”.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [draft, setDraft] = React.useState<JobDraft | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    try {
      const parsed = await parseChatAction(message);
      setDraft(parsed);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: draftSummary(parsed) },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not parse that message");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="space-y-3" aria-live="polite">
          {messages.map((message, index) => (
            <p
              key={index}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-xl rounded-bl-sm bg-secondary px-3 py-2 text-sm text-secondary-foreground"
              }
            >
              {message.text}
            </p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Describe the job, or tap the mic to speak…"
            className={inputClass}
            aria-label="Describe the job"
          />
          <VoiceInputButton
            onTranscript={(transcript) =>
              setInput((current) =>
                current ? `${current} ${transcript}` : transcript,
              )
            }
          />
          <Button
            type="button"
            variant="accent"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
          >
            {busy ? "Reading…" : "Send"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setInput(example)}
              className="rounded-lg bg-secondary px-2.5 py-1 text-left text-xs font-medium text-secondary-foreground hover:bg-muted"
            >
              {example}
            </button>
          ))}
        </div>
        {error ? (
          <div className="mt-3">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-base font-bold tracking-tight">
          Job draft
        </h2>
        {!draft ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your confirmed draft appears here. Nothing is saved until you
            create the job.
          </p>
        ) : (
          <form action={createJobFromDraft} className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Title</span>
              <input
                name="title"
                defaultValue={draft.title}
                required
                className={inputClass}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Site</span>
                <input
                  name="siteName"
                  defaultValue={draft.siteName ?? ""}
                  placeholder="e.g. Hulme Point"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">
                  Assignee
                </span>
                <input
                  name="assignee"
                  defaultValue={draft.assignee ?? ""}
                  placeholder="e.g. Ama Mensah"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">
                  Priority
                </span>
                <select
                  name="priority"
                  defaultValue={draft.priority}
                  className={inputClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Trade</span>
                <select
                  name="trade"
                  defaultValue={draft.trade ?? "Other"}
                  className={inputClass}
                >
                  {TRADE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                name="notes"
                defaultValue={draft.notes ?? ""}
                className={inputClass}
              />
            </label>
            <Button type="submit" variant="accent" className="w-full sm:w-auto">
              Create job and continue to capture
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
