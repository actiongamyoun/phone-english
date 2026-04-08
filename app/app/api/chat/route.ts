import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, topic, level } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are a warm, encouraging English tutor in a phone English app.
Topic: "${topic}" (${level}).
Return ONLY valid JSON, no markdown:
{"english":"<natural reply>","korean":"<Korean translation>","tip":"<1 Korean correction tip or empty string>"}`,
    messages,
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  let parsed;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { english: text, korean: "", tip: "" };
  }

  return Response.json(parsed);
}