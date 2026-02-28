import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, ChevronRight, ChevronDown, Trash2, MoreHorizontal } from "lucide-react";
import { useProjectStore, type Project } from "../../stores/projectStore";
import { NewProjectDialog } from "./NewProjectDialog";

export function ProjectSidebar() {
  const { projects, activeProjectId, activeThreadId, setActiveProject, setActiveThread, deleteProject } = useProjectStore();
  const [showNew, setShowNew] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div
      style={{
        width: 240,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 12px 10px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
          Projects
        </span>
        <button
          onClick={() => setShowNew(true)}
          title="New Project"
          style={iconActionStyle}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Project list */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 0" }}>
        {projects.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            No projects yet.
            <br />
            <button
              onClick={() => setShowNew(true)}
              style={{ color: "var(--text-brand)", background: "none", border: "none", cursor: "pointer", marginTop: 8, fontSize: "var(--text-sm)" }}
            >
              + Create one
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              isCollapsed={collapsed.has(project.id)}
              activeThreadId={activeThreadId}
              onSelect={() => {
                setActiveProject(project.id);
                setActiveThread(null);
              }}
              onToggle={() => toggle(project.id)}
              onSelectThread={(tid) => {
                setActiveProject(project.id);
                setActiveThread(tid);
              }}
              onDelete={() => deleteProject(project.id)}
              menuOpen={menuFor === project.id}
              onMenuToggle={(open) => setMenuFor(open ? project.id : null)}
            />
          ))
        )}
      </div>

      {showNew && <NewProjectDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

interface ProjectRowProps {
  project: Project;
  isActive: boolean;
  isCollapsed: boolean;
  activeThreadId: string | null;
  onSelect: () => void;
  onToggle: () => void;
  onSelectThread: (threadId: string) => void;
  onDelete: () => void;
  menuOpen: boolean;
  onMenuToggle: (open: boolean) => void;
}

function ProjectRow({
  project,
  isActive,
  isCollapsed,
  activeThreadId,
  onSelect,
  onToggle,
  onSelectThread,
  onDelete,
  menuOpen,
  onMenuToggle,
}: ProjectRowProps) {
  const runningCount = project.threads.filter((t) => t.status === "running").length;

  return (
    <div>
      {/* Project header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 8px 6px 10px",
          margin: "1px 4px",
          borderRadius: 6,
          cursor: "pointer",
          background: isActive && !activeThreadId ? "var(--bg-active)" : "transparent",
          transition: "background var(--transition-base)",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!(isActive && !activeThreadId))
            (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          const menu = e.currentTarget.querySelector(".proj-menu") as HTMLElement;
          if (menu) menu.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          if (!(isActive && !activeThreadId))
            (e.currentTarget as HTMLElement).style.background = "transparent";
          if (!menuOpen) {
            const menu = e.currentTarget.querySelector(".proj-menu") as HTMLElement;
            if (menu) menu.style.opacity = "0";
          }
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 2, display: "flex" }}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Name + icon */}
        <div
          onClick={onSelect}
          style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}
        >
          <FolderOpen size={13} color={isActive ? "var(--text-brand)" : "var(--text-tertiary)"} />
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: isActive ? "var(--text-brand)" : "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {project.name}
          </span>
        </div>

        {/* Running badge */}
        {runningCount > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: "var(--color-brand-500)",
              color: "white",
              borderRadius: 99,
              padding: "1px 5px",
              marginRight: 4,
              flexShrink: 0,
            }}
          >
            {runningCount}
          </span>
        )}

        {/* Context menu btn */}
        <button
          className="proj-menu"
          onClick={(e) => { e.stopPropagation(); onMenuToggle(!menuOpen); }}
          style={{ ...iconBtnStyle, opacity: 0, flexShrink: 0 }}
        >
          <MoreHorizontal size={13} />
        </button>

        {/* Context menu */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              right: 4,
              top: "calc(100% + 2px)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: 4,
              zIndex: 100,
              minWidth: 130,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <button
              onClick={() => { onDelete(); onMenuToggle(false); }}
              style={{ ...menuItemStyle, color: "var(--color-error-500)" }}
            >
              <Trash2 size={12} /> Delete project
            </button>
          </div>
        )}
      </div>

      {/* Thread list */}
      <AnimatePresence initial={false}>
        {!isCollapsed && project.threads.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            {project.threads.map((thread) => {
              const isActiveThread = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    width: "calc(100% - 8px)",
                    margin: "1px 4px",
                    padding: "5px 10px 5px 28px",
                    border: "none",
                    borderRadius: 6,
                    background: isActiveThread ? "var(--bg-active)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background var(--transition-base)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveThread) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveThread) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Status dot */}
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: {
                        idle: "var(--color-gray-500)",
                        running: "var(--color-brand-500)",
                        done: "var(--color-success-500)",
                        error: "var(--color-error-500)",
                      }[thread.status],
                      flexShrink: 0,
                      animation: thread.status === "running" ? "pulse 1.5s ease infinite" : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color: isActiveThread ? "var(--text-brand)" : "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {thread.title}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const iconActionStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "none",
  background: "var(--color-brand-500)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconBtnStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 4,
  border: "none",
  background: "transparent",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  border: "none",
  background: "transparent",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
  borderRadius: 6,
};
