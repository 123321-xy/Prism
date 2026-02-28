import { useState } from "react";
import { motion } from "framer-motion";
import { X, GitBranch, FolderOpen } from "lucide-react";
import { useProjectStore, type Project } from "../../stores/projectStore";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  project: Project;
  onClose: () => void;
}

export function NewThreadDialog({ project, onClose }: Props) {
  const { createThread, setActiveThread } = useProjectStore();
  const [title, setTitle] = useState("");
  const [useWorktree, setUseWorktree] = useState(false);
  const [branch, setBranch] = useState("");
  const [customDir, setCustomDir] = useState("");
  const [useCustomDir, setUseCustomDir] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) { setError("Thread title is required"); return; }
    setLoading(true);
    setError("");

    try {
      let workDir = project.workDir;
      let finalBranch: string | undefined;

      if (useWorktree && branch.trim()) {
        // Ask Rust to create a git worktree
        const result = await invoke<{ worktreePath: string; branch: string }>("create_worktree", {
          projectId: project.id,
          repoPath: project.workDir,
          branch: branch.trim(),
        });
        workDir = result.worktreePath;
        finalBranch = result.branch;
      } else if (useCustomDir && customDir.trim()) {
        workDir = customDir.trim();
      }

      const threadId = createThread(project.id, title.trim(), workDir, {
        branch: finalBranch,
        hasWorktree: useWorktree && !!finalBranch,
      });

      setActiveThread(threadId);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const suggestedBranch = title.trim()
    ? "thread/" + title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    : "";

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 200 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 440,
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
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              New Thread
            </h2>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
              in {project.name}
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={16} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Thread title */}
          <Field label="Thread Title">
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (useWorktree && !branch) {
                  setBranch("thread/" + e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Implement auth flow"
              style={inputStyle}
            />
          </Field>

          {/* Working directory option */}
          <div style={{
            background: "var(--bg-overlay)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            border: "1px solid var(--border-subtle)",
          }}>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
              Working Directory
            </p>

            {/* Option: use project dir */}
            <label style={radioLabelStyle}>
              <input
                type="radio"
                checked={!useWorktree && !useCustomDir}
                onChange={() => { setUseWorktree(false); setUseCustomDir(false); }}
                style={{ accentColor: "var(--color-brand-500)" }}
              />
              <div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>Project folder</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{project.workDir}</div>
              </div>
            </label>

            {/* Option: git worktree */}
            <label style={{ ...radioLabelStyle, marginTop: 10 }}>
              <input
                type="radio"
                checked={useWorktree}
                onChange={() => { setUseWorktree(true); setUseCustomDir(false); if (!branch && suggestedBranch) setBranch(suggestedBranch); }}
                style={{ accentColor: "var(--color-brand-500)" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>
                  <GitBranch size={13} /> Git worktree (isolated)
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 1 }}>
                  Creates a separate git worktree — changes won't conflict
                </div>
                {useWorktree && (
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder={suggestedBranch || "thread/my-feature"}
                    style={{ ...inputStyle, marginTop: 8, fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}
                  />
                )}
              </div>
            </label>

            {/* Option: custom dir */}
            <label style={{ ...radioLabelStyle, marginTop: 10 }}>
              <input
                type="radio"
                checked={useCustomDir}
                onChange={() => { setUseCustomDir(true); setUseWorktree(false); }}
                style={{ accentColor: "var(--color-brand-500)" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>
                  <FolderOpen size={13} /> Custom directory
                </div>
                {useCustomDir && (
                  <input
                    value={customDir}
                    onChange={(e) => setCustomDir(e.target.value)}
                    placeholder="/path/to/directory"
                    style={{ ...inputStyle, marginTop: 8, fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}
                  />
                )}
              </div>
            </label>
          </div>

          {error && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-error-500)", margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleCreate} disabled={loading} style={{ ...createBtnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Creating…" : "Start Thread"}
          </button>
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

const radioLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  cursor: "pointer",
};

const closeBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: "none",
  background: "var(--bg-overlay)", color: "var(--text-tertiary)",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px", borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-default)", background: "transparent",
  color: "var(--text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer",
};
const createBtnStyle: React.CSSProperties = {
  padding: "8px 20px", borderRadius: "var(--radius-md)", border: "none",
  background: "var(--color-brand-500)", color: "white",
  fontSize: "var(--text-sm)", fontWeight: 500, cursor: "pointer",
};
