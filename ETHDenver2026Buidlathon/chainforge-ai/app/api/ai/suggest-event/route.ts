import { NextRequest, NextResponse } from "next/server";
import { suggestEvent } from "@/lib/ai";

/**
 * POST: body = { supportLabels: string[], userDescription: string }.
 * Returns { eventType, summary, narrative? }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supportLabels = (body.supportLabels as string[]) || [];
    const userDescription = (body.userDescription as string) || "";
    const result = await suggestEvent(supportLabels, userDescription);
    return NextResponse.json(result);
  } catch (e) {
    console.error("suggest-event", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
