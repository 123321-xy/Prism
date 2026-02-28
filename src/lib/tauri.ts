import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface StartThreadOptions {
  threadId: string;
  workDir: string;
  claudePath: string;
}

export interface ClaudeEventPayload {
  threadId: string;
  event: StreamEvent;
}

export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; result: string }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "message_stop" }
  | { type: "permission_request"; toolId: string; toolName: string; input: Record<string, unknown> }
  | { type: "error"; message: string }
  | { type: "process_exit"; code: number };

/** Start a Claude Code process for a thread */
export async function startThread(opts: StartThreadOptions): Promise<void> {
  await invoke("start_thread", opts as unknown as Record<string, unknown>);
}

/** Send user message to a running thread */
export async function sendMessage(threadId: string, message: string): Promise<void> {
  await invoke("send_message", { threadId, message });
}

/** Approve or deny a permission request */
export async function approvePermission(threadId: string, toolId: string, approved: boolean): Promise<void> {
  await invoke("approve_permission", { threadId, toolId, approved });
}

/** Stop the Claude process for a thread */
export async function stopThread(threadId: string): Promise<void> {
  await invoke("stop_thread", { threadId });
}

/** Create an isolated git worktree for a thread */
export async function createWorktree(params: {
  projectId: string;
  repoPath: string;
  branch: string;
}): Promise<{ worktreePath: string; branch: string }> {
  return await invoke("create_worktree", params);
}

/** Remove a worktree when thread is done */
export async function removeWorktree(worktreePath: string): Promise<void> {
  await invoke("remove_worktree", { worktreePath });
}

/** Open a folder picker dialog, returns selected path */
export async function pickDirectory(): Promise<string | null> {
  return await invoke("pick_directory");
}

/** Listen for streaming events from Claude */
export function onClaudeEvent(handler: (payload: ClaudeEventPayload) => void): Promise<UnlistenFn> {
  return listen<ClaudeEventPayload>("claude-event", (e) => handler(e.payload));
}
