/**
 * AI helpers for provenance: image/PDF captioning and event summary generation.
 * Uses OpenAI-compatible API (OpenAI or Grok); set OPENAI_API_KEY or GROK_API_KEY in env.
 */

export interface CaptionResult {
  caption: string;
  suggestedLabel: string;
  description: string;
}

export interface EventSuggestion {
  eventType: string;
  summary: Record<string, unknown>;
  narrative?: string;
}

const CAPTION_SYSTEM =
  "You are an expert art provenance assistant. Analyze the provided image or document and return ONLY a valid JSON object (no markdown, no explanation) with exactly these keys: caption (string), suggestedLabel (string), description (string).";

const EVENT_SYSTEM =
  "You are an expert art provenance assistant. Given a list of support item labels and a short user description, return ONLY a valid JSON object (no markdown) with: eventType (string, e.g. creation, transfer, certification, exhibition), summary (object with relevant keys like from, to, description, location), and optional narrative (short string).";

/**
 * Call OpenAI-compatible chat API. Prefers OPENAI_API_KEY; fallback GROK_API_KEY with Grok endpoint.
 */
async function chat(
  system: string,
  userContent: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("Set OPENAI_API_KEY or GROK_API_KEY for AI features");
  }
  const isGrok = !!process.env.GROK_API_KEY && !process.env.OPENAI_API_KEY;
  const url = isGrok
    ? "https://api.x.ai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const body = {
    model: isGrok ? "grok-2-vision-1212" : "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    max_tokens: 1024,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI API ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");
  return content;
}

/**
 * Parse JSON from model output (strip markdown code block if present).
 */
function parseJson<T>(raw: string): T {
  let s = raw.trim();
  const m = s.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (m) s = m[1].trim();
  return JSON.parse(s) as T;
}

/**
 * Get caption and label for an image (base64 data URL or URL). Call from API route so API key is server-only.
 */
export async function captionImage(imageDataUrlOrUrl: string): Promise<CaptionResult> {
  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: "Describe this image for art provenance: suggest a short caption, a suggestedLabel (one phrase for file naming), and a longer description." },
  ];
  if (imageDataUrlOrUrl.startsWith("data:")) {
    content.push({ type: "image_url", image_url: { url: imageDataUrlOrUrl } });
  } else {
    content.push({ type: "image_url", image_url: { url: imageDataUrlOrUrl } });
  }
  const raw = await chat(CAPTION_SYSTEM, content);
  return parseJson<CaptionResult>(raw);
}

/**
 * Generate event suggestion from support labels and user description. Text-only; call from API route.
 */
export async function suggestEvent(
  supportLabels: string[],
  userDescription: string
): Promise<EventSuggestion> {
  const list = supportLabels.length ? supportLabels.join(", ") : "(none)";
  const userContent = `Supports: ${list}\n\nUser description: ${userDescription}`;
  const raw = await chat(EVENT_SYSTEM, userContent);
  return parseJson<EventSuggestion>(raw);
}
