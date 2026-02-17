import { NextRequest, NextResponse } from "next/server";
import { captionImage } from "@/lib/ai";

/**
 * POST: body = { imageDataUrl } (base64 data URL) or { imageUrl }.
 * Returns { caption, suggestedLabel, description }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageDataUrl = body.imageDataUrl as string | undefined;
    const imageUrl = body.imageUrl as string | undefined;
    const url = imageDataUrl || imageUrl;
    if (!url) {
      return NextResponse.json({ error: "Missing imageDataUrl or imageUrl" }, { status: 400 });
    }
    const result = await captionImage(url);
    return NextResponse.json(result);
  } catch (e) {
    console.error("caption", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
