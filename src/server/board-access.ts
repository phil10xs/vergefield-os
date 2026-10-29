import type { Job } from "@/db/schema";

// Public-repo stub. The real magic-link board logic lives only on the
// local internal-VergeSnag branch and is never pushed.
const HIDDEN =
  "Tracker board links are not included in the public repo build.";

export async function requestBoardLink(
  _jobId: string,
  _email: string,
): Promise<{ url: string; emailed: boolean }> {
  throw new Error(HIDDEN);
}

export async function getBoardJob(
  _token: string,
): Promise<Job | undefined> {
  return undefined;
}
