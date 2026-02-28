import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MessageRole = "user" | "assistant" | "tool";
export type ToolStatus = "pending" | "running" | "success" | "error";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: ToolStatus;
  expanded: boolean;
  timestamp: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  inputTokens?: number;
  outputTokens?: number;
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  workDir: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  archived: boolean;
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  isStreaming: boolean;
  pendingPermission: ToolCall | null;

  createSession: (workDir: string) => string;
  deleteSession: (id: string) => void;
  archiveSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, patch: Partial<Message>) => void;
  updateToolCall: (sessionId: string, messageId: string, toolCallId: string, patch: Partial<ToolCall>) => void;
  toggleToolCall: (sessionId: string, messageId: string, toolCallId: string) => void;
  setStreaming: (v: boolean) => void;
  setPendingPermission: (tool: ToolCall | null) => void;
  getActiveSession: () => Session | undefined;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isStreaming: false,
      pendingPermission: null,

      createSession: (workDir) => {
        const id = crypto.randomUUID();
        const dirName = workDir.split("/").filter(Boolean).pop() || workDir;
        const session: Session = {
          id,
          title: `New Session in ${dirName}`,
          workDir,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalInputTokens: 0,
          totalOutputTokens: 0,
          archived: false,
        };
        set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: id }));
        return id;
      },

      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        })),

      archiveSession: (id) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, archived: !sess.archived } : sess
          ),
        })),

      renameSession: (id, title) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, title } : sess
          ),
        })),

      setActiveSession: (id) => set({ activeSessionId: id }),

      addMessage: (sessionId, message) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  messages: [...sess.messages, message],
                  updatedAt: Date.now(),
                  totalInputTokens: sess.totalInputTokens + (message.inputTokens ?? 0),
                  totalOutputTokens: sess.totalOutputTokens + (message.outputTokens ?? 0),
                }
              : sess
          ),
        })),

      updateMessage: (sessionId, messageId, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  messages: sess.messages.map((m) =>
                    m.id === messageId ? { ...m, ...patch } : m
                  ),
                }
              : sess
          ),
        })),

      updateToolCall: (sessionId, messageId, toolCallId, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  messages: sess.messages.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          toolCalls: (m.toolCalls ?? []).map((tc) =>
                            tc.id === toolCallId ? { ...tc, ...patch } : tc
                          ),
                        }
                      : m
                  ),
                }
              : sess
          ),
        })),

      toggleToolCall: (sessionId, messageId, toolCallId) =>
        get().updateToolCall(sessionId, messageId, toolCallId, {
          expanded: !(
            get()
              .sessions.find((s) => s.id === sessionId)
              ?.messages.find((m) => m.id === messageId)
              ?.toolCalls?.find((tc) => tc.id === toolCallId)?.expanded ?? true
          ),
        }),

      setStreaming: (v) => set({ isStreaming: v }),
      setPendingPermission: (tool) => set({ pendingPermission: tool }),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId);
      },
    }),
    {
      name: "prism-sessions",
      partialize: (state) => ({ sessions: state.sessions, activeSessionId: state.activeSessionId }),
    }
  )
);
