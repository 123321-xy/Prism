/**
 * worktree.rs — Git worktree management
 *
 * Each thread can optionally run in its own isolated git worktree.
 * Worktrees are stored at: ~/.prism/worktrees/{project_id}/{thread_id}/
 */

use std::path::PathBuf;

fn worktrees_base() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"))
        .join(".prism")
        .join("worktrees")
}

/// Create a new git worktree for a thread
#[tauri::command]
pub async fn create_worktree(
    project_id: String,
    repo_path: String,
    branch: String,
) -> Result<serde_json::Value, String> {
    // Path: ~/.prism/worktrees/{project_id}/{branch}/
    let safe_branch = branch.replace('/', "-").replace(' ', "-");
    let worktree_path = worktrees_base()
        .join(&project_id)
        .join(&safe_branch);

    tokio::fs::create_dir_all(&worktree_path)
        .await
        .map_err(|e| format!("Failed to create worktree dir: {e}"))?;

    let worktree_path_str = worktree_path.to_string_lossy().to_string();

    // git worktree add <path> -b <branch>
    let output = tokio::process::Command::new("git")
        .args(["worktree", "add", &worktree_path_str, "-b", &branch])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to run git: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // If branch already exists, try without -b
        if stderr.contains("already exists") {
            let output2 = tokio::process::Command::new("git")
                .args(["worktree", "add", &worktree_path_str, &branch])
                .current_dir(&repo_path)
                .output()
                .await
                .map_err(|e| format!("git worktree add failed: {e}"))?;

            if !output2.status.success() {
                let err2 = String::from_utf8_lossy(&output2.stderr);
                return Err(format!("git worktree add failed: {err2}"));
            }
        } else if !worktree_path.exists() {
            return Err(format!("git worktree add failed: {stderr}"));
        }
    }

    Ok(serde_json::json!({
        "worktreePath": worktree_path_str,
        "branch": branch,
    }))
}

/// Remove a git worktree
#[tauri::command]
pub async fn remove_worktree(worktree_path: String) -> Result<(), String> {
    // git worktree remove --force <path>
    let _ = tokio::process::Command::new("git")
        .args(["worktree", "remove", "--force", &worktree_path])
        .output()
        .await;

    // Also clean up the directory
    let _ = tokio::fs::remove_dir_all(&worktree_path).await;

    Ok(())
}
