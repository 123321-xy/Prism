import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { useSessionStore } from "../../stores/sessionStore";
import { MessageThread } from "./MessageThread";
import { InputBar } from "./InputBar";
import { PermissionCard } from "../tools/PermissionCard";

export function ChatMain() {
  const { activeSessionId, getActiveSession, pendingPermission } = useSessionStore();
  const activeSession = getActiveSession();

  if (!activeSessionId || !activeSession) {
    return (
      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          color: "var(--text-tertiary)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(8,102,255,0.15) 0%, rgba(0,198,255,0.08) 100%)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={28} color="var(--color-brand-400)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
            No session selected
          </p>
          <p style={{ fontSize: "var(--text-sm)" }}>
            Select a session from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
        position: "relative",
      }}
    >
      {/* Session header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {activeSession.title}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {activeSession.workDir}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <TokenBadge
            label="Input"
            count={activeSession.totalInputTokens}
          />
          <TokenBadge
            label="Output"
            count={activeSession.totalOutputTokens}
          />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <MessageThread session={activeSession} />
      </div>

      {/* Permission overlay */}
      <AnimatePresence>
        {pendingPermission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "absolute",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(600px, calc(100% - 40px))",
              zIndex: 50,
            }}
          >
            <PermissionCard tool={pendingPermission} sessionId={activeSessionId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <InputBar sessionId={activeSessionId} />
      </div>
    </div>
  );
}

function TokenBadge({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  const display = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        {display}
      </span>
    </div>
  );
}
