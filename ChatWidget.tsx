"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { track } from "@/lib/posthog";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "Which products should I reorder right now?",
  "Where am I losing money due to overstock?",
  "Why did my sales drop recently?",
];

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    track("chat_message_sent");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL}/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ message: text, session_id: sessionId }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full rounded-xl bg-panel backdrop-blur border border-line p-4">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-sm px-3 py-1.5 rounded-full border border-signal-teal/40 text-signal-teal hover:bg-signal-teal/10 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              m.role === "user"
                ? "ml-auto bg-signal-teal text-foreground"
                : "bg-panel2 text-foreground"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="text-muted text-sm">Thinking…</div>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about reorders, trends, promotions…"
          className="flex-1 bg-panel2 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 ring-signal-teal"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-signal-teal text-ink font-medium text-sm hover:opacity-90 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
