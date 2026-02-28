import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import { type Message, useProjectStore } from "../../stores/projectStore";
import { ReadCard } from "../tools/ReadCard";
import { EditCard } from "../tools/EditCard";
import { BashCard } from "../tools/BashCard";
import { GlobCard } from "../tools/GlobCard";
import { GenericToolCard } from "../tools/GenericToolCard";

interface MessageBubbleProps {
  message: Message;
  projectId: string;
  threadId: string;
}

export function MessageBubble({ message, projectId, threadId }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", padding: "6px 20px", gap: 6 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: isUser ? "var(--color-brand-500)" : "var(--bg-elevated)",
            border: isUser ? "none" : "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isUser ? <User size={13} color="white" /> : <Bot size={13} color="var(--color-brand-400)" />}
        </div>

        {/* Content */}
        {message.content && (
          <div
            style={{
              maxWidth: "70%",
              padding: "9px 13px",
              borderRadius: isUser ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
              background: isUser ? "var(--color-brand-500)" : "var(--bg-elevated)",
              border: isUser ? "none" : "1px solid var(--border-subtle)",
              color: isUser ? "white" : "var(--text-primary)",
              fontSize: "var(--text-base)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {message.content}
          </div>
        )}
      </div>

      {/* Tool calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div style={{ paddingLeft: 36, display: "flex", flexDirection: "column", gap: 5 }}>
          {message.toolCalls.map((tc) => {
            const props = { toolCall: tc, projectId, threadId, messageId: message.id };
            switch (tc.name) {
              case "Read":   return <ReadCard key={tc.id} {...props} />;
              case "Edit":   return <EditCard key={tc.id} {...props} />;
              case "Bash":   return <BashCard key={tc.id} {...props} />;
              case "Glob":   return <GlobCard key={tc.id} {...props} />;
              default:       return <GenericToolCard key={tc.id} {...props} />;
            }
          })}
        </div>
      )}

      {/* Token count */}
      {!isUser && (message.inputTokens || message.outputTokens) && (
        <div style={{ paddingLeft: 36, fontSize: "var(--text-xs)", color: "var(--text-tertiary)", opacity: 0.6 }}>
          {message.inputTokens ? `↑${message.inputTokens}` : ""}
          {message.inputTokens && message.outputTokens ? " · " : ""}
          {message.outputTokens ? `↓${message.outputTokens}` : ""}
          {" tokens"}
        </div>
      )}
    </motion.div>
  );
}
