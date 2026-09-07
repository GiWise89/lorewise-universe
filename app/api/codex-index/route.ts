import { NextResponse } from "next/server";
import { codexEntries } from "@/lib/codex";
import { createCodexIndexEntries } from "@/lib/codexIndex";

export const dynamic = "force-static";

export function GET() {
  const entries = createCodexIndexEntries(codexEntries)
    .sort((first, second) => first.displayTitle.localeCompare(second.displayTitle, "it", { sensitivity: "base" }));
  return NextResponse.json({ entries }, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
