mod cli;
mod worktree;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize CLI manager
            app.manage(cli::ClaudeManager::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cli::start_thread,
            cli::send_message,
            cli::stop_thread,
            cli::approve_permission,
            worktree::create_worktree,
            worktree::remove_worktree,
            pick_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running prism");
}

/// Open a native folder picker dialog
#[tauri::command]
async fn pick_directory() -> Option<String> {
    // Use native macOS folder picker via shell
    let output = tokio::process::Command::new("osascript")
        .args([
            "-e",
            r#"POSIX path of (choose folder with prompt "Select project folder")"#,
        ])
        .output()
        .await
        .ok()?;

    if output.status.success() {
        let path = String::from_utf8(output.stdout).ok()?;
        Some(path.trim().trim_end_matches('/').to_string())
    } else {
        None
    }
}
