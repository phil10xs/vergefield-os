import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check in" };

export default function HomePage() {
  redirect("/request");
}
