import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Board" };

export default function BoardPage() {
  redirect("/track?view=board");
}
