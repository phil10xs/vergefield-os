import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { db } from "@/db";
import { siteMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadPath } from "@/server/media-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db.select().from(siteMedia).where(eq(siteMedia.id, id));
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const bytes = await readFile(uploadPath(row.jobId, row.filename));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
