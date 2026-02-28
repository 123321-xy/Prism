import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MessageRole = "user" | "assistant";
export type ToolStatus = "pending" | "running" | "success" | "error";
export type ThreadStatus = "idle" | "running" | "done" | "error";

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

export interface Thread {
  id: string;
  projectId: string;
  title: string;
  /**
   * The actual working directory Claude Code runs in.
   * - If worktree isolation is enabled: path to the worktree copy
   * - Otherwise: same as the project's workDir
   */
  workDir: string;
  /** Git branch name, set when using worktree isolation */
  branch?: string;
  /** Whether this thread uses an isolated git worktree */
  hasWorktree: boolean;
  status: ThreadStatus;
  messages: Message[];
  totalInputTokens: number;
  totalOutputTokens: number;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  /** User-chosen local folder path */
  workDir: string;
  threads: Thread[];
  createdAt: number;
  updatedAt: number;
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  activeThreadId: string | null;
  isStreaming: boolean;
  pendingPermission: { tool: ToolCall; threadId: string } | null;

  // Project ops
  createProject: (name: string, workDir: string) => string;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  // Thread ops
  createThread: (projectId: string, title: string, workDir: string, opts?: { branch?: string; hasWorktree?: boolean }) => string;
  deleteThread: (projectId: string, threadId: string) => void;
  renameThread: (projectId: string, threadId: string, title: string) => void;
  setActiveThread: (id: string | null) => void;
  setThreadStatus: (projectId: string, threadId: string, status: ThreadStatus) => void;

  // Message ops
  addMessage: (projectId: string, threadId: string, message: Message) => void;
  updateMessage: (projectId: string, threadId: string, messageId: string, patch: Partial<Message>) => void;
  addToolCall: (projectId: string, threadId: string, messageId: string, toolCall: ToolCall) => void;
  updateToolCall: (projectId: string, threadId: string, messageId: string, toolCallId: string, patch: Partial<ToolCall>) => void;
  toggleToolCall: (projectId: string, threadId: string, messageId: string, toolCallId: string) => void;

  // Streaming
  setStreaming: (v: boolean) => void;
  setPendingPermission: (v: { tool: ToolCall; threadId: string } | null) => void;

  // Selectors
  getActiveProject: () => Project | undefined;
  getActiveThread: () => Thread | undefined;
  getThread: (projectId: string, threadId: string) => Thread | undefined;
}

function updateThread(
  projects: Project[],
  projectId: string,
  threadId: string,
  updater: (t: Thread) => Thread
): Project[] {
  return projects.map((p) =>
    p.id !== projectId
      ? p
      : {
          ...p,
          updatedAt: Date.now(),
          threads: p.threads.map((t) => (t.id !== threadId ? t : updater(t))),
        }
  );
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeThreadId: null,
      isStreaming: false,
      pendingPermission: null,

      // ── Projects ──────────────────────────────────────
      createProject: (name, workDir) => {
        const id = crypto.randomUUID();
        set((s) => ({
          projects: [
            { id, name, workDir, threads: [], createdAt: Date.now(), updatedAt: Date.now() },
            ...s.projects,
          ],
          activeProjectId: id,
          activeThreadId: null,
        }));
        return id;
      },

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
          activeThreadId: s.activeProjectId === id ? null : s.activeThreadId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id, activeThreadId: null }),

      // ── Threads ───────────────────────────────────────
      createThread: (projectId, title, workDir, opts = {}) => {
        const id = crypto.randomUUID();
        const thread: Thread = {
          id,
          projectId,
          title,
          workDir,
          branch: opts.branch,
          hasWorktree: opts.hasWorktree ?? false,
          status: "idle",
          messages: [],
          totalInputTokens: 0,
          totalOutputTokens: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id !== projectId
              ? p
              : { ...p, threads: [thread, ...p.threads], updatedAt: Date.now() }
          ),
          activeThreadId: id,
        }));
        return id;
      },

      deleteThread: (projectId, threadId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id !== projectId
              ? p
              : { ...p, threads: p.threads.filter((t) => t.id !== threadId) }
          ),
          activeThreadId: s.activeThreadId === threadId ? null : s.activeThreadId,
        })),

      renameThread: (projectId, threadId, title) =>
        set((s) => ({
          projects: updateThread(s.projects, projectId, threadId, (t) => ({ ...t, title })),
        })),

      setActiveThread: (id) => set({ activeThreadId: id }),

      setThreadStatus: (projectId, threadId, status) =>
        set((s) => ({
          projects: updateThread(s.projects, projectId, threadId, (t) => ({ ...t, status })),
        })),

      // ── Messages ──────────────────────────────────────
      addMessage: (projectId, threadId, message) =>
        set((s) => ({
          projects: updateThread(s.projects, projectId, threadId, (t) => ({
            ...t,
            messages: [...t.messages, message],
            updatedAt: Date.now(),
            totalInputTokens: t.totalInputTokens + (message.inputTokens ?? 0),
            totalOutputTokens: t.totalOutputTokens + (message.outputTokens ?? 0),
          })),
        })),

      updateMessage: (projectId, threadId, messageId, patch) =>
        set((s) => ({
          projects: updateThread(s.projects, projectId, threadId, (t) => ({
            ...t,
            messages: t.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
          })),
        })),

      addToolCall: (projectId, threadId, messageId, toolCall) =>
        set((s) => ({
          projects: updateThread(s.projects, projectId, threadId, (t) => ({
            ...t,
            messages: t.messages.map((m) =>
              m.id === messageId
                ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
                : m
            ),
          })),
        })),

      updateToolCall: (projectId, threadId, messageId, toolCallId, patch) =>
        set((s) => ({
          projects: updateThread(s.projects, projectId, threadId, (t) => ({
            ...t,
            messages: t.messages.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    toolCalls: (m.toolCalls ?? []).map((tc) =>
                      tc.id === toolCallId ? { ...tc, ...patch } : tc
                    ),
                  }
                : m
            ),
          })),
        })),

      toggleToolCall: (projectId, threadId, messageId, toolCallId) => {
        const tc = get()
          .getThread(projectId, threadId)
          ?.messages.find((m) => m.id === messageId)
          ?.toolCalls?.find((tc) => tc.id === toolCallId);
        if (!tc) return;
        get().updateToolCall(projectId, threadId, messageId, toolCallId, {
          expanded: !tc.expanded,
        });
      },

      setStreaming: (v) => set({ isStreaming: v }),
      setPendingPermission: (v) => set({ pendingPermission: v }),

      getActiveProject: () =>
        get().projects.find((p) => p.id === get().activeProjectId),

      getActiveThread: () =>
        get()
          .getActiveProject()
          ?.threads.find((t) => t.id === get().activeThreadId),

      getThread: (projectId, threadId) =>
        get()
          .projects.find((p) => p.id === projectId)
          ?.threads.find((t) => t.id === threadId),
    }),
    {
      name: "prism-projects",
      partialize: (s) => ({
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        activeThreadId: s.activeThreadId,
      }),
    }
  )
);
