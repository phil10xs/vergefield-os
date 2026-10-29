import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Snag list" };

export default function SnagsPage() {
  redirect("/track?view=list");
}
