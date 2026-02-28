import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Archive, Trash2, Check, X } from "lucide-react";
import { type Session, useSessionStore } from "../../stores/sessionStore";
import { formatTokens } from "../../lib/parser";

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
}

export function SessionItem({ session, isActive, onSelect }: SessionItemProps) {
  const { renameSession, deleteSession, archiveSession } = useSessionStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalTokens = session.totalInputTokens + session.totalOutputTokens;
  const lastMessage = session.messages.at(-1);
  const preview = lastMessage?.content?.slice(0, 60) ?? "No messages yet";

  const confirmRename = () => {
    if (renameValue.trim()) renameSession(session.id, renameValue.trim());
    setIsRenaming(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: "relative",
        margin: "1px 6px",
        borderRadius: "var(--radius-md)",
        background: isActive ? "var(--bg-active)" : "transparent",
        border: isActive ? "1px solid var(--border-brand)" : "1px solid transparent",
        cursor: "pointer",
        transition: "background var(--transition-base), border-color var(--transition-base)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
        }
        const btn = e.currentTarget.querySelector(".session-menu-btn") as HTMLElement;
        if (btn) btn.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }
        if (!menuOpen) {
          const btn = e.currentTarget.querySelector(".session-menu-btn") as HTMLElement;
          if (btn) btn.style.opacity = "0";
        }
        setMenuOpen(false);
      }}
      onClick={() => !isRenaming && onSelect()}
    >
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isRenaming ? (
            <div style={{ display: "flex", gap: 4, flex: 1 }} onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                style={{
                  flex: 1,
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--color-brand-500)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-sm)",
                  outline: "none",
                }}
              />
              <button onClick={confirmRename} style={iconBtnStyle}>
                <Check size={12} />
              </button>
              <button onClick={() => setIsRenaming(false)} style={iconBtnStyle}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <span
                style={{
                  flex: 1,
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: isActive ? "var(--text-brand)" : "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {session.title}
              </span>

              {/* Menu button */}
              <button
                className="session-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                style={{
                  ...iconBtnStyle,
                  opacity: 0,
                  transition: "opacity var(--transition-base)",
                  flexShrink: 0,
                }}
              >
                <MoreHorizontal size={14} />
              </button>
            </>
          )}
        </div>

        {/* Preview */}
        {!isRenaming && (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            {preview}
          </span>
        )}

        {/* Token count */}
        {!isRenaming && totalTokens > 0 && (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
              opacity: 0.7,
            }}
          >
            {formatTokens(totalTokens)} tokens
          </span>
        )}
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 4,
            top: "calc(100% + 4px)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: 4,
            zIndex: 100,
            minWidth: 140,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {[
            { icon: Pencil, label: "Rename", action: () => { setIsRenaming(true); setMenuOpen(false); } },
            { icon: Archive, label: "Archive", action: () => { archiveSession(session.id); setMenuOpen(false); } },
            { icon: Trash2, label: "Delete", action: () => { deleteSession(session.id); setMenuOpen(false); }, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              onClick={action}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                border: "none",
                background: "transparent",
                color: danger ? "var(--color-error-500)" : "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                borderRadius: 6,
                transition: "background var(--transition-base)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 4,
  border: "none",
  background: "transparent",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
