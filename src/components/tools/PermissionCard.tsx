import { motion } from "framer-motion";
import { ShieldAlert, Check, X, AlertTriangle } from "lucide-react";
import { type ToolCall, useProjectStore } from "../../stores/projectStore";
import { approvePermission } from "../../lib/tauri";

interface Props {
  tool: ToolCall;
  threadId: string;
}

const HIGH_RISK  = ["Bash", "Write", "Edit"];
const MED_RISK   = ["Read", "Glob", "Grep"];

function riskLevel(name: string): "high" | "medium" | "low" {
  if (HIGH_RISK.includes(name)) return "high";
  if (MED_RISK.includes(name)) return "medium";
  return "low";
}

export function PermissionCard({ tool, threadId }: Props) {
  const { setPendingPermission } = useProjectStore();
  const risk = riskLevel(tool.name);

  const cfg = {
    high:   { color: "var(--color-error-500)",   bg: "var(--color-error-bg)",   label: "High Risk",  Icon: AlertTriangle },
    medium: { color: "var(--color-warning-500)", bg: "var(--color-warning-bg)", label: "Moderate",   Icon: ShieldAlert },
    low:    { color: "var(--color-info-500)",    bg: "var(--color-info-bg)",    label: "Low Risk",   Icon: ShieldAlert },
  }[risk];

  const decide = async (approved: boolean) => {
    try { await approvePermission(threadId, tool.id, approved); } catch {}
    setPendingPermission(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: "var(--bg-elevated)", borderRadius: "var(--radius-xl)",
        border: `1px solid ${cfg.color}40`, padding: 16,
        boxShadow: "var(--shadow-xl)", backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <cfg.Icon size={18} color={cfg.color} />
        </div>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>Permission Required</div>
          <div style={{ fontSize: "var(--text-xs)", color: cfg.color, fontWeight: 500 }}>{cfg.label} · {tool.name}</div>
        </div>
      </div>

      <div style={{ background: "var(--bg-overlay)", borderRadius: "var(--radius-md)", padding: "9px 11px", marginBottom: 12, border: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: 5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Input</div>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 110, overflow: "auto" }}>
          {JSON.stringify(tool.input, null, 2)}
        </pre>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => decide(false)} style={denyStyle}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--color-error-bg)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"}>
          <X size={13} /> Deny
        </button>
        <button onClick={() => decide(true)} style={allowStyle}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          <Check size={13} /> Allow
        </button>
      </div>
    </motion.div>
  );
}

const baseBtn: React.CSSProperties = {
  flex: 1, padding: "8px", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)",
  fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center",
  justifyContent: "center", gap: 6, transition: "all var(--transition-base)",
};
const denyStyle: React.CSSProperties  = { ...baseBtn, border: "1px solid var(--border-default)", background: "var(--bg-overlay)", color: "var(--text-secondary)" };
const allowStyle: React.CSSProperties = { ...baseBtn, border: "none", background: "var(--color-brand-500)", color: "white" };
