import { useSettingsStore } from "../../stores/settingsStore";
import { Moon, Sun, Monitor } from "lucide-react";

export function SettingsPanel() {
  const { theme, setTheme, claudeCodePath, setClaudeCodePath, defaultWorkDir, setDefaultWorkDir, showTokenCount, toggleShowTokenCount, fontSize, setFontSize } = useSettingsStore();

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 24 }}>
        Settings
      </h1>

      <Section title="Appearance">
        <Field label="Theme">
          <div style={{ display: "flex", gap: 8 }}>
            {([["dark", Moon, "Dark"], ["light", Sun, "Light"]] as const).map(([t, Icon, label]) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid",
                  borderColor: theme === t ? "var(--color-brand-500)" : "var(--border-default)",
                  background: theme === t ? "rgba(8,102,255,0.12)" : "var(--bg-elevated)",
                  color: theme === t ? "var(--text-brand)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  transition: "all var(--transition-base)",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Font Size">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range"
              min={12}
              max={18}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: 140 }}
            />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", minWidth: 40 }}>
              {fontSize}px
            </span>
          </div>
        </Field>
      </Section>

      <Section title="Claude Code">
        <Field label="CLI Path">
          <input
            value={claudeCodePath}
            onChange={(e) => setClaudeCodePath(e.target.value)}
            placeholder="claude"
            style={inputStyle}
          />
        </Field>

        <Field label="Default Work Directory">
          <input
            value={defaultWorkDir}
            onChange={(e) => setDefaultWorkDir(e.target.value)}
            placeholder="~"
            style={inputStyle}
          />
        </Field>
      </Section>

      <Section title="Display">
        <Field label="Show Token Count">
          <Toggle checked={showTokenCount} onChange={toggleShowTokenCount} />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        background: checked ? "var(--color-brand-500)" : "var(--bg-active)",
        cursor: "pointer",
        position: "relative",
        transition: "background var(--transition-base)",
      }}
    >
      <div style={{
        position: "absolute",
        top: 3,
        left: checked ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "white",
        transition: "left var(--transition-base)",
        boxShadow: "var(--shadow-sm)",
      }} />
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  padding: "6px 10px",
  color: "var(--text-primary)",
  fontSize: "var(--text-sm)",
  width: 240,
  outline: "none",
  fontFamily: "var(--font-mono)",
};
