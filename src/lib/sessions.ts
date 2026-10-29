import type { Job } from "@/db/schema";

export interface VisitGroup {
  day: string;
  label: string;
  sessions: Job[];
}

export interface PropertyGroup {
  address: string;
  visits: VisitGroup[];
  sessionCount: number;
}

function visitLabel(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function sessionAddress(item: Job): string {
  return (
    item.propertyAddress?.trim() || item.siteName?.trim() || "Unassigned site"
  );
}

export function visitDayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatVisitDay(day: string): string {
  return visitLabel(day);
}

export function selectVisitSessions(jobs: Job[], anchor: Job): Job[] {
  const address = sessionAddress(anchor);
  const day = visitDayOf(anchor.createdAt);
  return jobs
    .filter(
      (item) =>
        sessionAddress(item) === address &&
        visitDayOf(item.createdAt) === day,
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function groupSessionsByPropertyVisit(jobs: Job[]): PropertyGroup[] {
  const byProperty = new Map<string, Map<string, Job[]>>();
  for (const item of jobs) {
    const address = sessionAddress(item);
    const day = visitDayOf(item.createdAt);
    let visits = byProperty.get(address);
    if (!visits) {
      visits = new Map();
      byProperty.set(address, visits);
    }
    const list = visits.get(day) ?? [];
    list.push(item);
    visits.set(day, list);
  }
  return [...byProperty.entries()]
    .map(([address, visits]) => {
      const ordered = [...visits.entries()]
        .map(([day, sessions]) => ({
          day,
          label: visitLabel(day),
          sessions: sessions.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          ),
        }))
        .sort((a, b) => (a.day < b.day ? 1 : -1));
      return {
        address,
        visits: ordered,
        sessionCount: ordered.reduce(
          (total, visit) => total + visit.sessions.length,
          0,
        ),
      };
    })
    .sort((a, b) => a.address.localeCompare(b.address));
}

export function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}
