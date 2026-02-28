import { FilePenLine, Plus, Minus } from "lucide-react";
import { ToolCard } from "./ToolCard";
import { type ToolCall } from "../../stores/projectStore";

interface Props { toolCall: ToolCall; projectId: string; threadId: string; messageId: string; }

export function EditCard({ toolCall, projectId, threadId, messageId }: Props) {
  const filePath = String(toolCall.input.file_path ?? "");
  const fileName = filePath.split("/").pop() ?? filePath;
  const oldStr = String(toolCall.input.old_string ?? "");
  const newStr = String(toolCall.input.new_string ?? "");

  return (
    <ToolCard toolCall={toolCall} projectId={projectId} threadId={threadId} messageId={messageId}
      icon={<FilePenLine size={13} />} title="Edit" subtitle={fileName}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{filePath}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <DiffPanel lines={oldStr.split("\n")} type="remove" label="Before" />
          <DiffPanel lines={newStr.split("\n")} type="add" label="After" />
        </div>
        {toolCall.output && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{toolCall.output}</div>}
      </div>
    </ToolCard>
  );
}

function DiffPanel({ lines, type, label }: { lines: string[]; type: "add" | "remove"; label: string }) {
  const color = type === "add" ? "var(--color-success-500)" : "var(--color-error-500)";
  const bg = type === "add" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)";
  const border = type === "add" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
  const Icon = type === "add" ? Plus : Minus;
  return (
    <div style={{ background: bg, borderRadius: "var(--radius-sm)", border: `1px solid ${border}`, overflow: "hidden" }}>
      <div style={{ padding: "3px 7px", display: "flex", alignItems: "center", gap: 4, borderBottom: `1px solid ${border}` }}>
        <Icon size={10} color={color} />
        <span style={{ fontSize: "var(--text-xs)", color, fontWeight: 500 }}>{label}</span>
      </div>
      <pre style={{
        fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)",
        padding: 7, overflow: "auto", maxHeight: 160, lineHeight: 1.5,
        whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
      }}>
        {lines.slice(0, 50).join("\n")}{lines.length > 50 && "\n…"}
      </pre>
    </div>
  );
}
