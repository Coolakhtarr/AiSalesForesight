import AppShell from "@/components/layout/AppShell";
import ChatWidget from "@/components/ChatWidget";

export default function ChatPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="font-display text-xl font-semibold">Chat</h1>
        <p className="text-sm text-muted mt-1">
          Ask about reorders, trends, or promotions — answers are grounded in your own data only.
        </p>
      </div>
      <div className="h-[calc(100vh-180px)]">
        <ChatWidget />
      </div>
    </AppShell>
  );
}
