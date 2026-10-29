import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Request received" };

export default async function RequestThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  redirect(jobId ? `/request/${jobId}?new=1` : "/request");
}
