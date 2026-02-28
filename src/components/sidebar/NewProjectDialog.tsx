import { useState } from "react";
import { motion } from "framer-motion";
import { X, FolderOpen } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  onClose: () => void;
}

export function NewProjectDialog({ onClose }: Props) {
  const { createProject } = useProjectStore();
  const [name, setName] = useState("");
  const [workDir, setWorkDir] = useState("");
  const [error, setError] = useState("");

  const pickFolder = async () => {
    try {
      // Use Tauri dialog to pick folder
      const selected = await invoke<string | null>("pick_directory");
      if (selected) {
        setWorkDir(selected);
        if (!name) {
          setName(selected.split("/").filter(Boolean).pop() ?? "New Project");
        }
      }
    } catch {
      // Fallback: just let user type
    }
  };

  const handleCreate = () => {
    if (!name.trim()) { setError("Project name is required"); return; }
    if (!workDir.trim()) { setError("Work directory is required"); return; }
    createProject(name.trim(), workDir.trim());
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
        }}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xl)",
          padding: 24,
          zIndex: 201,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
            New Project
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Project Name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="My Project"
              style={inputStyle}
            />
          </Field>

          <Field label="Work Directory">
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={workDir}
                onChange={(e) => setWorkDir(e.target.value)}
                placeholder="/Users/me/my-project"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={pickFolder} title="Browse" style={browseBtnStyle}>
                <FolderOpen size={15} />
              </button>
            </div>
          </Field>

          {error && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-error-500)", margin: 0 }}>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleCreate} style={createBtnStyle}>Create</button>
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "var(--text-sm)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const closeBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "none",
  background: "var(--bg-overlay)",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const browseBtnStyle: React.CSSProperties = {
  padding: "0 10px",
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-default)",
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
};

const createBtnStyle: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: "var(--radius-md)",
  border: "none",
  background: "var(--color-brand-500)",
  color: "white",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  cursor: "pointer",
};
