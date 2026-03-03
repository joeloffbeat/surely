import { NextRequest, NextResponse } from "next/server";
import { chatSync } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const { prompt, context } = (await request.json()) as {
    prompt: string;
    context: string;
  };

  try {
    const { text } = await chatSync({
      prompt: `You are an AI insurance advisor for Surely, a parametric insurance protocol. Answer questions about the policy below. Be concise and helpful.

POLICY CONTEXT:
${context}

USER QUESTION: ${prompt}`,
      model: "sonnet",
    });

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({
      text: "The AI advisor is currently unavailable. Please review the policy agreements directly for detailed information.",
    });
  }
}
