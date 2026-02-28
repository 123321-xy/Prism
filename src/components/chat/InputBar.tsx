import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Square, Paperclip } from "lucide-react";
import { useSessionStore } from "../../stores/sessionStore";
import { sendMessage } from "../../lib/tauri";

interface InputBarProps {
  sessionId: string;
}

export function InputBar({ sessionId }: InputBarProps) {
  const [text, setText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isStreaming, setStreaming, addMessage } = useSessionStore();

  const handleSubmit = useCallback(async () => {
    const content = text.trim();
    if (!content || isStreaming) return;

    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add user message to store
    addMessage(sessionId, {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    });

    setStreaming(true);

    try {
      await sendMessage(sessionId, content);
    } catch (err) {
      console.error("Failed to send message:", err);
      setStreaming(false);
    }
  }, [text, isStreaming, sessionId, addMessage, setStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const paths = files.map((f) => f.name).join(", ");
    setText((prev) => prev + (prev ? "\n" : "") + `Files: ${paths}`);
  };

  return (
    <div
      style={{
        padding: "12px 16px 16px",
        background: "var(--bg-base)",
        borderTop: "1px solid var(--border-subtle)",
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <motion.div
        animate={{
          borderColor: isDragOver
            ? "var(--color-brand-500)"
            : "var(--border-default)",
          boxShadow: isDragOver ? "var(--shadow-brand)" : "none",
        }}
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
          transition: "all var(--transition-base)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude Code... (Shift+Enter for new line)"
          rows={1}
          disabled={isStreaming}
          style={{
            width: "100%",
            resize: "none",
            border: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: "var(--text-base)",
            lineHeight: 1.6,
            padding: "12px 16px",
            outline: "none",
            fontFamily: "var(--font-sans)",
            minHeight: 48,
            maxHeight: 200,
            overflow: "auto",
            opacity: isStreaming ? 0.5 : 1,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 10px",
            gap: 6,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {/* Attach */}
          <button
            title="Attach file"
            style={{
              ...actionBtnStyle,
              marginRight: "auto",
            }}
          >
            <Paperclip size={15} />
          </button>

          {/* Char count */}
          {text.length > 0 && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              {text.length}
            </span>
          )}

          {/* Send / Stop */}
          <button
            onClick={isStreaming ? () => setStreaming(false) : handleSubmit}
            disabled={!isStreaming && !text.trim()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "none",
              background: isStreaming
                ? "var(--color-error-500)"
                : text.trim()
                ? "var(--color-brand-500)"
                : "var(--bg-active)",
              color: "white",
              cursor: text.trim() || isStreaming ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--transition-base)",
              opacity: !isStreaming && !text.trim() ? 0.4 : 1,
            }}
          >
            {isStreaming ? <Square size={12} /> : <Send size={13} />}
          </button>
        </div>
      </motion.div>

      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textAlign: "center", marginTop: 6 }}>
        Claude can make mistakes. Review tool calls before approving.
      </p>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all var(--transition-base)",
};
