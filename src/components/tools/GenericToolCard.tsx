import { Wrench } from "lucide-react";
import { ToolCard } from "./ToolCard";
import { type ToolCall } from "../../stores/projectStore";

interface Props { toolCall: ToolCall; projectId: string; threadId: string; messageId: string; }

export function GenericToolCard({ toolCall, projectId, threadId, messageId }: Props) {
  return (
    <ToolCard toolCall={toolCall} projectId={projectId} threadId={threadId} messageId={messageId}
      icon={<Wrench size={13} />} title={toolCall.name}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Section label="Input">
          <pre style={codeStyle}>{JSON.stringify(toolCall.input, null, 2)}</pre>
        </Section>
        {toolCall.output && (
          <Section label="Output">
            <pre style={codeStyle}>{toolCall.output}</pre>
          </Section>
        )}
      </div>
    </ToolCard>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)",
  background: "var(--bg-overlay)", borderRadius: "var(--radius-sm)", padding: "6px 8px",
  overflow: "auto", maxHeight: 110, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
};
