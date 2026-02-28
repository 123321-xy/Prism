import { FileText } from "lucide-react";
import { ToolCard } from "./ToolCard";
import { type ToolCall } from "../../stores/projectStore";

interface Props { toolCall: ToolCall; projectId: string; threadId: string; messageId: string; }

export function ReadCard({ toolCall, projectId, threadId, messageId }: Props) {
  const filePath = String(toolCall.input.file_path ?? toolCall.input.path ?? "");
  const fileName = filePath.split("/").pop() ?? filePath;

  return (
    <ToolCard toolCall={toolCall} projectId={projectId} threadId={threadId} messageId={messageId}
      icon={<FileText size={13} />} title="Read" subtitle={fileName}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{filePath}</div>
        {toolCall.output && (
          <pre style={outputStyle}>{toolCall.output.slice(0, 2000)}{toolCall.output.length > 2000 && "\n…"}</pre>
        )}
      </div>
    </ToolCard>
  );
}

const outputStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)",
  background: "var(--bg-overlay)", borderRadius: "var(--radius-sm)", padding: "7px 9px",
  overflow: "auto", maxHeight: 220, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
};
