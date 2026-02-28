import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type ToolCall, useProjectStore } from "../../stores/projectStore";

interface ToolCardProps {
  toolCall: ToolCall;
  projectId: string;
  threadId: string;
  messageId: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-gray-500)",
  running: "var(--color-brand-500)",
  success: "var(--color-success-500)",
  error:   "var(--color-error-500)",
};

const STATUS_BG: Record<string, string> = {
  pending: "rgba(82,82,94,0.08)",
  running: "rgba(8,102,255,0.08)",
  success: "rgba(34,197,94,0.08)",
  error:   "rgba(239,68,68,0.08)",
};

export function ToolCard({ toolCall, projectId, threadId, messageId, icon, title, subtitle, children }: ToolCardProps) {
  const { toggleToolCall } = useProjectStore();
  const color = STATUS_COLORS[toolCall.status] ?? STATUS_COLORS.pending;
  const bg    = STATUS_BG[toolCall.status] ?? STATUS_BG.pending;
  const isRunning = toolCall.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: "1px solid var(--border-subtle)",
        borderLeft: `2px solid ${color}`,
        borderRadius: "var(--radius-md)",
        background: bg,
        overflow: "hidden",
        fontSize: "var(--text-sm)",
      }}
    >
      <button
        onClick={() => toggleToolCall(projectId, threadId, messageId, toolCall.id)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 11px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          transition: "background var(--transition-base)",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <span style={{ color, display: "flex", flexShrink: 0 }}>
          {isRunning ? (
            <span style={{
              width: 13, height: 13, borderRadius: "50%",
              border: `2px solid ${color}`, borderTopColor: "transparent",
              display: "inline-block", animation: "spin 0.8s linear infinite",
            }} />
          ) : icon}
        </span>

        <span style={{ fontWeight: 500, color: "var(--text-primary)", flexShrink: 0 }}>{title}</span>

        {subtitle && (
          <span style={{
            color: "var(--text-tertiary)", fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {subtitle}
          </span>
        )}

        <span style={{ color: "var(--text-tertiary)", marginLeft: "auto", flexShrink: 0 }}>
          {toolCall.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {toolCall.expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "9px 11px" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
