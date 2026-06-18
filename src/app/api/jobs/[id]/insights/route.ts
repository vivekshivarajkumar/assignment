import { NextRequest, NextResponse } from "next/server";
import {
  getOrFetchInsights,
  refreshInsights,
} from "@/lib/insights/web-search";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const refresh = req.nextUrl.searchParams.get("refresh") === "true";

    const insights = refresh
      ? await refreshInsights(id)
      : await getOrFetchInsights(id);

    return NextResponse.json(insights);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Insights failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
