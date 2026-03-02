/**
 * AI Service Client
 *
 * All AI inference in this project routes through the Claude Service.
 * Endpoint: CLAUDE_SERVICE_URL (ngrok tunnel to ~/Documents/infra/claude-service)
 * Auth: X-API-Key header with CLAUDE_SERVICE_API_KEY
 *
 * The service wraps Claude CLI and supports streaming JSON responses.
 * For CRE TEE workflows (Gemini inside enclave), use GEMINI_API_KEY directly — that's separate.
 */

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL ||
  "https://innominate-unalleviatingly-yasmin.ngrok-free.dev";
const CLAUDE_SERVICE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

export interface ChatRequest {
  prompt: string;
  sessionId?: string;
  model?: "sonnet" | "opus";
  maxTurns?: number;
  isPlan?: boolean;
  workingDirectory?: string;
}

export interface ChatEvent {
  type:
    | "claude_event"
    | "raw_output"
    | "error"
    | "completion"
    | "context_overflow";
  sessionId: string;
  timestamp: string;
  data: unknown;
}

/**
 * Send a prompt to Claude Service and get a streaming response.
 * Returns an async generator of ChatEvent objects.
 */
export async function* chat(
  request: ChatRequest,
): AsyncGenerator<ChatEvent, void, undefined> {
  const response = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": CLAUDE_SERVICE_API_KEY,
    },
    body: JSON.stringify({
      prompt: request.prompt,
      sessionId: request.sessionId,
      model: request.model ?? "sonnet",
      maxTurns: request.maxTurns ?? 1,
      isPlan: request.isPlan ?? false,
      workingDirectory: request.workingDirectory,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      `Claude Service error: ${(error as { error: string }).error}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line) as ChatEvent;
      } catch {
        // Skip non-JSON lines
      }
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer) as ChatEvent;
    } catch {
      // Skip
    }
  }
}

/**
 * Send a prompt and collect the full text response (non-streaming).
 * Waits for completion and returns the aggregated output.
 */
export async function chatSync(
  request: ChatRequest,
): Promise<{ text: string; sessionId: string }> {
  let text = "";
  let sessionId = "";

  for await (const event of chat(request)) {
    if ("sessionId" in event && event.sessionId) {
      sessionId = event.sessionId;
    }
    if (event.type === "raw_output" && typeof event.data === "string") {
      text += event.data;
    }
    // Extract text from claude_event stream deltas
    if (
      event.type === "claude_event" &&
      typeof event.data === "object" &&
      event.data !== null
    ) {
      const d = event.data as Record<string, unknown>;
      if (d.type === "stream_event") {
        const evt = d.event as Record<string, unknown> | undefined;
        if (evt?.type === "content_block_delta") {
          const delta = evt.delta as Record<string, unknown> | undefined;
          if (delta?.type === "text_delta" && typeof delta.text === "string") {
            text += delta.text;
          }
        }
      }
      // Also extract from assistant message (full text fallback)
      if (d.type === "assistant" && !text) {
        const msg = d.message as Record<string, unknown> | undefined;
        const content = msg?.content as
          | Array<Record<string, unknown>>
          | undefined;
        if (content) {
          for (const block of content) {
            if (block.type === "text" && typeof block.text === "string") {
              text += block.text;
            }
          }
        }
      }
    }
    if (event.type === "error") {
      throw new Error(`Claude error: ${JSON.stringify(event.data)}`);
    }
  }

  return { text: text.trim(), sessionId };
}

/**
 * Health check — verify the Claude Service is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${CLAUDE_SERVICE_URL}/health`);
    const data = (await response.json()) as { status: string };
    return data.status === "OK";
  } catch {
    return false;
  }
}
