import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, GitBranch, FolderOpen, Circle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { MessageThread } from "./MessageThread";
import { ThreadInputBar } from "./ThreadInputBar";
import { PermissionCard } from "../tools/PermissionCard";
import { formatTokens } from "../../lib/parser";

export function ThreadView() {
  const { activeProjectId, activeThreadId, getActiveThread, getActiveProject, setActiveThread, pendingPermission } = useProjectStore();
  const thread = getActiveThread();
  const project = getActiveProject();

  if (!thread || !project || !activeProjectId) return null;

  const statusConfig = {
    idle:    { color: "var(--color-gray-400)",    Icon: Circle,       label: "Idle" },
    running: { color: "var(--color-brand-500)",   Icon: Loader2,      label: "Running" },
    done:    { color: "var(--color-success-500)", Icon: CheckCircle2, label: "Done" },
    error:   { color: "var(--color-error-500)",   Icon: AlertCircle,  label: "Error" },
  }[thread.status];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Back to overview */}
        <button
          onClick={() => setActiveThread(null)}
          title="Back to project"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "none",
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all var(--transition-base)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-active)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}
        >
          <ArrowLeft size={15} />
        </button>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{project.name}</span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>/</span>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
            {thread.title}
          </span>
        </div>

        {/* Status chip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 9px",
          borderRadius: 99,
          background: `${statusConfig.color}18`,
          border: `1px solid ${statusConfig.color}40`,
        }}>
          <statusConfig.Icon
            size={11}
            color={statusConfig.color}
            style={{ animation: thread.status === "running" ? "spin 1s linear infinite" : "none" }}
          />
          <span style={{ fontSize: "var(--text-xs)", color: statusConfig.color, fontWeight: 500 }}>
            {statusConfig.label}
          </span>
        </div>

        {/* Work dir / branch info */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {thread.branch && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-tertiary)" }}>
              <GitBranch size={12} />
              <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>{thread.branch}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-tertiary)" }}>
            <FolderOpen size={12} />
            <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {thread.workDir}
            </span>
          </div>

          {/* Token count */}
          {(thread.totalInputTokens + thread.totalOutputTokens) > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              <TokenChip label="↑" count={thread.totalInputTokens} />
              <TokenChip label="↓" count={thread.totalOutputTokens} />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <MessageThread thread={thread} />

        {/* Permission overlay */}
        <AnimatePresence>
          {pendingPermission && pendingPermission.threadId === thread.id && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(560px, calc(100% - 32px))",
                zIndex: 50,
              }}
            >
              <PermissionCard
                tool={pendingPermission.tool}
                threadId={thread.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <ThreadInputBar
          projectId={activeProjectId}
          threadId={activeThreadId!}
        />
      </div>
    </div>
  );
}

function TokenChip({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span style={{ fontSize: 9, color: "var(--text-tertiary)", lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
        {formatTokens(count)}
      </span>
    </div>
  );
}
