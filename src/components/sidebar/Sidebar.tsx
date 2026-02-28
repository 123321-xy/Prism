import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { useSessionStore } from "../../stores/sessionStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { SessionItem } from "./SessionItem";

export function Sidebar() {
  const { sessions, activeSessionId, createSession, setActiveSession } = useSessionStore();
  const { defaultWorkDir } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group sessions by workDir
  const grouped = useMemo(() => {
    const visible = sessions.filter(
      (s) =>
        !s.archived &&
        (searchQuery === "" ||
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.workDir.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const map = new Map<string, typeof sessions>();
    for (const s of visible) {
      const dir = s.workDir;
      if (!map.has(dir)) map.set(dir, []);
      map.get(dir)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions, searchQuery]);

  const toggleGroup = (dir: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  };

  const handleNewSession = () => {
    createSession(defaultWorkDir || "~");
  };

  return (
    <div
      style={{
        width: 260,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 12px 10px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Sessions
          </span>
          <button
            onClick={handleNewSession}
            title="New Session"
            style={{
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
              transition: "opacity var(--transition-base)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            style={{
              width: "100%",
              padding: "5px 8px 5px 26px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {grouped.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
            }}
          >
            {searchQuery ? "No sessions found" : "No sessions yet.\nClick + to start."}
          </div>
        ) : (
          grouped.map(([dir, dirSessions]) => {
            const isCollapsed = collapsedGroups.has(dir);
            const dirName = dir.split("/").filter(Boolean).pop() || dir;

            return (
              <div key={dir}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(dir)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    transition: "color var(--transition-base)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)")}
                >
                  {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                  <Folder size={11} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dirName}
                  </span>
                  <span style={{ marginLeft: "auto", opacity: 0.6 }}>{dirSessions.length}</span>
                </button>

                {/* Sessions in group */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      {dirSessions.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          onSelect={() => setActiveSession(session.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
