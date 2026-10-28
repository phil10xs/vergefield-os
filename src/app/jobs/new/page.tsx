import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { StageSteps } from "@/components/jobs/stage-steps";
import { ChatComposer } from "@/components/chat/chat-composer";

export const metadata: Metadata = { title: "New job via chat" };

export default function NewJobPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <PageHeader
        title="New job via chat"
        description="Describe the site job in your own words — or speak it. Confirm the draft, then capture the site."
        backHref="/jobs"
      />
      <StageSteps current="chat" />
      <ChatComposer />
    </main>
  );
}
