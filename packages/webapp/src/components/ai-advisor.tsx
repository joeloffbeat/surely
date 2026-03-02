"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiAdvisorProps {
  policyContext: string;
}

export default function AiAdvisor({ policyContext }: AiAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I can help you understand this policy, its trigger conditions, and coverage details. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          context: policyContext,
        }),
      });

      const data = (await response.json()) as { text: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I could not process that request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-primary">AI Advisor</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${
              msg.role === "user"
                ? "ml-8 rounded-lg bg-secondary p-3 text-primary"
                : "mr-8 rounded-lg bg-muted p-3 text-muted-fg"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="mr-8 rounded-lg bg-muted p-3 text-sm text-dim">
            Thinking...
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this policy..."
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-primary p-2 text-background transition-opacity disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
