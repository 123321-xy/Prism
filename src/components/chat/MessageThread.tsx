import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { type Thread } from "../../stores/projectStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { MessageBubble } from "./MessageBubble";

interface MessageThreadProps {
  thread: Thread;
}

export function MessageThread({ thread }: MessageThreadProps) {
  const { autoScroll } = useSettingsStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [thread.messages.length, autoScroll]);

  if (thread.messages.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary)",
          fontSize: "var(--text-sm)",
        }}
      >
        Send a message to start this thread
      </div>
    );
  }

  return (
    <div
      className="selectable"
      style={{
        height: "100%",
        overflow: "auto",
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <AnimatePresence initial={false}>
        {thread.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            projectId={thread.projectId}
            threadId={thread.id}
          />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
