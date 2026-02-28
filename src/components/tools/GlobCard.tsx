import { FolderSearch } from "lucide-react";
import { ToolCard } from "./ToolCard";
import { type ToolCall } from "../../stores/projectStore";

interface Props { toolCall: ToolCall; projectId: string; threadId: string; messageId: string; }

export function GlobCard({ toolCall, projectId, threadId, messageId }: Props) {
  const pattern = String(toolCall.input.pattern ?? "");
  const files = toolCall.output?.split("\n").filter(Boolean) ?? [];
  return (
    <ToolCard toolCall={toolCall} projectId={projectId} threadId={threadId} messageId={messageId}
      icon={<FolderSearch size={13} />} title="Glob" subtitle={pattern}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {files.length > 0 ? (
          <>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: 3 }}>
              {files.length} file{files.length !== 1 ? "s" : ""} matched
            </div>
            <div style={{
              background: "var(--bg-overlay)", borderRadius: "var(--radius-sm)", padding: "5px 9px",
              maxHeight: 160, overflow: "auto", display: "flex", flexDirection: "column", gap: 1,
            }}>
              {files.slice(0, 80).map((f, i) => (
                <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{f}</span>
              ))}
              {files.length > 80 && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>+{files.length - 80} more</span>}
            </div>
          </>
        ) : (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>No files matched</span>
        )}
      </div>
    </ToolCard>
  );
}
