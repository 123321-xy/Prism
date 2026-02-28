import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GitBranch, MessageSquare, Wrench, Clock, Loader2, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { useProjectStore, type Thread, type Project } from "../../stores/projectStore";
import { NewThreadDialog } from "./NewThreadDialog";
import { formatTokens } from "../../lib/parser";

export function ProjectOverview() {
  const { activeProjectId, getActiveProject, setActiveThread } = useProjectStore();
  const [showNewThread, setShowNewThread] = useState(false);
  const project = getActiveProject();

  if (!activeProjectId || !project) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--text-tertiary)",
        }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 15,13 1,13" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <p style={{ fontSize: "var(--text-sm)" }}>Select a project from the sidebar</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "28px 32px" }}>
      {/* Project header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.02em" }}>
          {project.name}
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          {project.workDir}
        </p>
        <ProjectStats project={project} />
      </div>

      {/* Threads grid */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-secondary)" }}>
          Threads  <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>({project.threads.length})</span>
        </h2>
        <button
          onClick={() => setShowNewThread(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-brand-500)",
            background: "rgba(8,102,255,0.1)",
            color: "var(--color-brand-400)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(8,102,255,0.18)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(8,102,255,0.1)"}
        >
          <Plus size={14} />
          New Thread
        </button>
      </div>

      {project.threads.length === 0 ? (
        <EmptyThreads onNew={() => setShowNewThread(true)} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          <AnimatePresence>
            {project.threads.map((thread, i) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                index={i}
                onOpen={() => setActiveThread(thread.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {showNewThread && (
        <NewThreadDialog project={project} onClose={() => setShowNewThread(false)} />
      )}
    </div>
  );
}

function ProjectStats({ project }: { project: Project }) {
  const running = project.threads.filter((t) => t.status === "running").length;
  const done = project.threads.filter((t) => t.status === "done").length;
  const totalTokens = project.threads.reduce(
    (sum, t) => sum + t.totalInputTokens + t.totalOutputTokens, 0
  );

  return (
    <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
      {[
        { label: "Total threads", value: project.threads.length },
        { label: "Running", value: running, highlight: running > 0 },
        { label: "Completed", value: done },
        { label: "Tokens used", value: totalTokens > 0 ? formatTokens(totalTokens) : "—" },
      ].map(({ label, value, highlight }) => (
        <div key={label}>
          <div style={{
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: highlight ? "var(--color-brand-400)" : "var(--text-primary)",
            lineHeight: 1.2,
          }}>
            {value}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

interface ThreadCardProps {
  thread: Thread;
  index: number;
  onOpen: () => void;
}

function ThreadCard({ thread, index, onOpen }: ThreadCardProps) {
  const statusConfig = {
    idle:    { color: "var(--color-gray-400)",    bg: "rgba(113,113,125,0.06)", Icon: Circle,       label: "Idle" },
    running: { color: "var(--color-brand-500)",   bg: "rgba(8,102,255,0.08)",  Icon: Loader2,      label: "Running" },
    done:    { color: "var(--color-success-500)", bg: "rgba(34,197,94,0.06)",  Icon: CheckCircle2, label: "Done" },
    error:   { color: "var(--color-error-500)",   bg: "rgba(239,68,68,0.06)", Icon: AlertCircle,  label: "Error" },
  }[thread.status];

  const lastMsg = thread.messages.at(-1);
  const preview = lastMsg?.content?.slice(0, 80) ?? "No messages yet";
  const totalTokens = thread.totalInputTokens + thread.totalOutputTokens;
  const toolCallCount = thread.messages.reduce((sum, m) => sum + (m.toolCalls?.length ?? 0), 0);
  const elapsed = Date.now() - thread.createdAt;
  const elapsedStr = elapsed < 3_600_000
    ? `${Math.floor(elapsed / 60_000)}m ago`
    : `${Math.floor(elapsed / 3_600_000)}h ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={onOpen}
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid var(--border-subtle)`,
        borderTop: `2px solid ${statusConfig.color}`,
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all var(--transition-base)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        userSelect: "none",
      }}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        borderColor: "var(--border-strong)",
      }}
    >
      {/* Top row: status + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div
          style={{
            marginTop: 2,
            padding: 4,
            borderRadius: 6,
            background: statusConfig.bg,
            display: "flex",
            flexShrink: 0,
          }}
        >
          <statusConfig.Icon
            size={12}
            color={statusConfig.color}
            style={{ animation: thread.status === "running" ? "spin 1s linear infinite" : "none" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}>
            {thread.title}
          </div>
          {thread.branch && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <GitBranch size={10} color="var(--text-tertiary)" />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                {thread.branch}
              </span>
            </div>
          )}
        </div>
        <span style={{
          fontSize: "var(--text-xs)",
          color: statusConfig.color,
          fontWeight: 500,
          background: statusConfig.bg,
          padding: "2px 7px",
          borderRadius: 99,
          flexShrink: 0,
        }}>
          {statusConfig.label}
        </span>
      </div>

      {/* Preview */}
      <p style={{
        fontSize: "var(--text-xs)",
        color: "var(--text-tertiary)",
        lineHeight: 1.5,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        margin: 0,
      }}>
        {preview}
      </p>

      {/* Footer stats */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderTop: "1px solid var(--border-subtle)",
        paddingTop: 8,
      }}>
        <Stat icon={<MessageSquare size={11} />} value={thread.messages.length} />
        <Stat icon={<Wrench size={11} />} value={toolCallCount} />
        {totalTokens > 0 && (
          <Stat icon={<span style={{ fontSize: 10 }}>T</span>} value={formatTokens(totalTokens)} />
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, color: "var(--text-tertiary)" }}>
          <Clock size={10} />
          <span style={{ fontSize: "var(--text-xs)" }}>{elapsedStr}</span>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number | string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-tertiary)" }}>
      {icon}
      <span style={{ fontSize: "var(--text-xs)" }}>{value}</span>
    </div>
  );
}

function EmptyThreads({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      border: "2px dashed var(--border-default)",
      borderRadius: "var(--radius-xl)",
      padding: "48px 32px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: "var(--bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Plus size={20} color="var(--text-tertiary)" />
      </div>
      <div>
        <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
          No threads yet
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Create a thread to start a parallel Claude Code session
        </p>
      </div>
      <button
        onClick={onNew}
        style={{
          marginTop: 4,
          padding: "8px 20px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--color-brand-500)",
          color: "white",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        + New Thread
      </button>
    </div>
  );
}
