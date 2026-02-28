import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Square } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { sendMessage } from "../../lib/tauri";

interface Props {
  projectId: string;
  threadId: string;
}

export function ThreadInputBar({ projectId, threadId }: Props) {
  const [text, setText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isStreaming, setStreaming, addMessage, setThreadStatus } = useProjectStore();

  const handleSubmit = useCallback(async () => {
    const content = text.trim();
    if (!content || isStreaming) return;

    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    addMessage(projectId, threadId, {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    });

    setStreaming(true);
    setThreadStatus(projectId, threadId, "running");

    try {
      await sendMessage(threadId, content);
    } catch (err) {
      console.error("send failed:", err);
      setStreaming(false);
      setThreadStatus(projectId, threadId, "error");
    }
  }, [text, isStreaming, projectId, threadId, addMessage, setStreaming, setThreadStatus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  return (
    <div
      style={{ padding: "10px 16px 14px", background: "var(--bg-base)", borderTop: "1px solid var(--border-subtle)" }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files).map((f) => f.name).join(", ");
        setText((p) => p + (p ? "\n" : "") + `Files: ${files}`);
      }}
    >
      <motion.div
        animate={{
          borderColor: isDragOver ? "var(--color-brand-500)" : "var(--border-default)",
          boxShadow: isDragOver ? "var(--shadow-brand)" : "none",
        }}
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude Code…  (Shift+Enter for new line)"
          rows={1}
          disabled={isStreaming}
          style={{
            width: "100%", resize: "none", border: "none",
            background: "transparent", color: "var(--text-primary)",
            fontSize: "var(--text-base)", lineHeight: 1.6,
            padding: "11px 14px", outline: "none",
            fontFamily: "var(--font-sans)", minHeight: 46,
            maxHeight: 200, overflow: "auto",
            opacity: isStreaming ? 0.5 : 1,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", padding: "5px 8px", gap: 6, borderTop: "1px solid var(--border-subtle)" }}>
          {text.length > 0 && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginRight: "auto" }}>
              {text.length} chars
            </span>
          )}
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={isStreaming ? () => { setStreaming(false); setThreadStatus(projectId, threadId, "idle"); } : handleSubmit}
              disabled={!isStreaming && !text.trim()}
              style={{
                width: 30, height: 30, borderRadius: 9, border: "none",
                background: isStreaming ? "var(--color-error-500)" : text.trim() ? "var(--color-brand-500)" : "var(--bg-active)",
                color: "white", cursor: text.trim() || isStreaming ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all var(--transition-base)",
                opacity: !isStreaming && !text.trim() ? 0.4 : 1,
              }}
            >
              {isStreaming ? <Square size={11} /> : <Send size={12} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
