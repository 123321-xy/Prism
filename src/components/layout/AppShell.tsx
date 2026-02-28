import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BarChart3, Settings } from "lucide-react";
import { ProjectSidebar } from "../sidebar/ProjectSidebar";
import { ProjectOverview } from "../project/ProjectOverview";
import { ThreadView } from "../chat/ThreadView";
import { TokenDashboard } from "../analytics/TokenDashboard";
import { SettingsPanel } from "./SettingsPanel";
import { useProjectStore } from "../../stores/projectStore";

type Tab = "projects" | "analytics" | "settings";

const NAV: { id: Tab; Icon: React.FC<{ size: number }>; label: string }[] = [
  { id: "projects", Icon: LayoutDashboard as React.FC<{ size: number }>, label: "Projects" },
  { id: "analytics", Icon: BarChart3 as React.FC<{ size: number }>, label: "Analytics" },
  { id: "settings", Icon: Settings as React.FC<{ size: number }>, label: "Settings" },
];

export function AppShell() {
  const [tab, setTab] = useState<Tab>("projects");
  const { activeThreadId } = useProjectStore();

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      {/* Narrow nav rail */}
      <nav
        style={{
          width: 52,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 0",
          gap: 2,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        {/* Prism logo mark */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, #0866FF 0%, #00C6FF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(8,102,255,0.4)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 15,13 1,13" stroke="white" strokeWidth="1.5" fill="none" />
            <line x1="8" y1="1" x2="8" y2="13" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="4.5" y1="7" x2="11.5" y2="7" stroke="white" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>

        {NAV.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            title={label}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: tab === id ? "var(--bg-active)" : "transparent",
              color: tab === id ? "var(--text-brand)" : "var(--text-tertiary)",
              transition: "all var(--transition-base)",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (tab !== id) {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== id) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }
            }}
          >
            <Icon size={17} />
            {tab === id && (
              <motion.div
                layoutId="nav-pip"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 18,
                  borderRadius: "0 2px 2px 0",
                  background: "var(--color-brand-500)",
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Project sidebar (only in projects tab) */}
      <AnimatePresence initial={false}>
        {tab === "projects" && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <ProjectSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          {tab === "projects" && !activeThreadId && (
            <motion.div key="overview" {...fade} style={{ flex: 1, overflow: "hidden" }}>
              <ProjectOverview />
            </motion.div>
          )}

          {tab === "projects" && activeThreadId && (
            <motion.div key="thread" {...fade} style={{ flex: 1, overflow: "hidden" }}>
              <ThreadView />
            </motion.div>
          )}

          {tab === "analytics" && (
            <motion.div key="analytics" {...slideUp} style={{ flex: 1, overflow: "auto", padding: 28 }}>
              <TokenDashboard />
            </motion.div>
          )}

          {tab === "settings" && (
            <motion.div key="settings" {...slideUp} style={{ flex: 1, overflow: "auto", padding: 28 }}>
              <SettingsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};
