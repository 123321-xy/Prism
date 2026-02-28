import { Terminal } from "lucide-react";
import { ToolCard } from "./ToolCard";
import { type ToolCall } from "../../stores/projectStore";

interface Props { toolCall: ToolCall; projectId: string; threadId: string; messageId: string; }

export function BashCard({ toolCall, projectId, threadId, messageId }: Props) {
  const command = String(toolCall.input.command ?? "");
  const shortCmd = command.length > 60 ? command.slice(0, 60) + "…" : command;
  const isError = toolCall.output?.startsWith("Error:") || toolCall.output?.startsWith("stderr:");

  return (
    <ToolCard toolCall={toolCall} projectId={projectId} threadId={threadId} messageId={messageId}
      icon={<Terminal size={13} />} title="Bash" subtitle={shortCmd}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{
          background: "var(--bg-overlay)", borderRadius: "var(--radius-sm)",
          padding: "5px 9px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)",
          color: "var(--text-secondary)", border: "1px solid var(--border-subtle)",
        }}>
          <span style={{ color: "var(--color-success-500)", marginRight: 7 }}>$</span>{command}
        </div>
        {toolCall.output && (
          <pre style={{
            fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)",
            color: isError ? "var(--color-error-500)" : "var(--text-secondary)",
            background: "var(--bg-overlay)", borderRadius: "var(--radius-sm)",
            padding: "7px 9px", overflow: "auto", maxHeight: 280, lineHeight: 1.5,
            whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
            border: `1px solid ${isError ? "rgba(239,68,68,0.2)" : "var(--border-subtle)"}`,
          }}>
            {toolCall.output.slice(0, 5000)}{toolCall.output.length > 5000 && "\n… (truncated)"}
          </pre>
        )}
      </div>
    </ToolCard>
  );
}
