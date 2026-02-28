/**
 * cli.rs — Claude Code CLI process management
 *
 * Each thread maps to one Claude Code process.
 * Communication protocol: `claude --output-format stream-json`
 * Events are emitted to the frontend via Tauri events.
 */

use std::collections::HashMap;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin};
use tokio::sync::Mutex;
use tauri::{AppHandle, Emitter};
use serde::Serialize;

/// A running Claude process for one thread
struct ThreadProcess {
    stdin: ChildStdin,
    #[allow(dead_code)]
    child: Child,
}

/// Shared state: thread_id → process
pub struct ClaudeManager {
    processes: Arc<Mutex<HashMap<String, ThreadProcess>>>,
}

impl ClaudeManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FrontendEvent {
    TextDelta { text: String },
    ToolStart { id: String, name: String, input: serde_json::Value },
    ToolResult { id: String, result: String },
    Usage { input_tokens: u64, output_tokens: u64 },
    MessageStop,
    #[allow(dead_code)]
    PermissionRequest { tool_id: String, tool_name: String, input: serde_json::Value },
    #[allow(dead_code)]
    Error { message: String },
    ProcessExit { code: i32 },
}

#[derive(Serialize, Clone)]
pub struct ClaudeEventPayload {
    thread_id: String,
    event: FrontendEvent,
}

/// Start a Claude Code CLI process for a thread
#[tauri::command]
pub async fn start_thread(
    app: AppHandle,
    state: tauri::State<'_, ClaudeManager>,
    thread_id: String,
    work_dir: String,
    claude_path: Option<String>,
) -> Result<(), String> {
    let claude = claude_path.unwrap_or_else(|| "claude".to_string());

    let mut child = tokio::process::Command::new(&claude)
        .args(["--output-format", "stream-json", "--print", "--dangerously-skip-permissions"])
        .current_dir(&work_dir)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start claude: {e}"))?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stdin = child.stdin.take().ok_or("No stdin")?;

    // Spawn a task to read stdout and emit events
    let app_clone = app.clone();
    let tid = thread_id.clone();
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();

        while let Ok(Some(line)) = lines.next_line().await {
            if line.trim().is_empty() { continue; }

            if let Some(event) = parse_stream_line(&line) {
                let _ = app_clone.emit("claude-event", ClaudeEventPayload {
                    thread_id: tid.clone(),
                    event,
                });
            }
        }

        let _ = app_clone.emit("claude-event", ClaudeEventPayload {
            thread_id: tid,
            event: FrontendEvent::ProcessExit { code: 0 },
        });
    });

    let proc = ThreadProcess { stdin, child };
    state.processes.lock().await.insert(thread_id, proc);

    Ok(())
}

/// Send a message to Claude
#[tauri::command]
pub async fn send_message(
    state: tauri::State<'_, ClaudeManager>,
    thread_id: String,
    message: String,
) -> Result<(), String> {
    let mut processes = state.processes.lock().await;
    let proc = processes.get_mut(&thread_id)
        .ok_or_else(|| format!("No process for thread {thread_id}"))?;

    // Claude Code reads from stdin line by line
    let payload = format!("{}\n", message);
    proc.stdin.write_all(payload.as_bytes()).await
        .map_err(|e| format!("Failed to write to stdin: {e}"))?;
    proc.stdin.flush().await
        .map_err(|e| format!("Failed to flush stdin: {e}"))?;

    Ok(())
}

/// Stop a Claude process
#[tauri::command]
pub async fn stop_thread(
    state: tauri::State<'_, ClaudeManager>,
    thread_id: String,
) -> Result<(), String> {
    let mut processes = state.processes.lock().await;
    if let Some(mut proc) = processes.remove(&thread_id) {
        let _ = proc.child.kill().await;
    }
    Ok(())
}

/// Respond to a permission request (y/n written to stdin)
#[tauri::command]
pub async fn approve_permission(
    state: tauri::State<'_, ClaudeManager>,
    thread_id: String,
    _tool_id: String,
    approved: bool,
) -> Result<(), String> {
    let mut processes = state.processes.lock().await;
    let proc = processes.get_mut(&thread_id)
        .ok_or_else(|| format!("No process for thread {thread_id}"))?;

    let response = if approved { "y\n" } else { "n\n" };
    proc.stdin.write_all(response.as_bytes()).await
        .map_err(|e| format!("Failed to write permission response: {e}"))?;
    proc.stdin.flush().await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ─── Stream JSON parser ────────────────────────────────────────────────────

fn parse_stream_line(line: &str) -> Option<FrontendEvent> {
    let obj: serde_json::Value = serde_json::from_str(line).ok()?;
    let type_str = obj["type"].as_str()?;

    match type_str {
        "message_start" => {
            let input_tokens = obj["message"]["usage"]["input_tokens"].as_u64().unwrap_or(0);
            Some(FrontendEvent::Usage { input_tokens, output_tokens: 0 })
        }

        "content_block_start" => {
            let block = &obj["content_block"];
            if block["type"].as_str() == Some("tool_use") {
                let id = block["id"].as_str()?.to_string();
                let name = block["name"].as_str()?.to_string();
                Some(FrontendEvent::ToolStart { id, name, input: serde_json::Value::Null })
            } else {
                None
            }
        }

        "content_block_delta" => {
            let delta = &obj["delta"];
            match delta["type"].as_str() {
                Some("text_delta") => {
                    let text = delta["text"].as_str()?.to_string();
                    Some(FrontendEvent::TextDelta { text })
                }
                _ => None,
            }
        }

        "message_delta" => {
            let output_tokens = obj["usage"]["output_tokens"].as_u64().unwrap_or(0);
            Some(FrontendEvent::Usage { input_tokens: 0, output_tokens })
        }

        "message_stop" => Some(FrontendEvent::MessageStop),

        "tool_result" => {
            let id = obj["tool_use_id"].as_str()?.to_string();
            let result = if obj["content"].is_array() {
                obj["content"].as_array()?
                    .iter()
                    .filter_map(|c| c["text"].as_str())
                    .collect::<Vec<_>>()
                    .join("")
            } else {
                obj["content"].as_str().unwrap_or("").to_string()
            };
            Some(FrontendEvent::ToolResult { id, result })
        }

        _ => None,
    }
}
