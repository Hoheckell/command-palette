use chrono::Utc;
use regex::Regex;
use rusqlite::{params, Connection};
use std::env;
use std::fs;
use std::process::Command;
use std::sync::Mutex;

struct AppState {
    terminal_window: Mutex<String>,
}

fn get_connection() -> Connection {
    let conn = Connection::open("command_palette.db").unwrap();

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS commands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command TEXT NOT NULL,
            base_command TEXT NOT NULL,
            help TEXT,
            created_at TEXT NOT NULL,
            favorite INTEGER DEFAULT 0,
            source TEXT NOT NULL
        )
        ",
        [],
    )
    .unwrap();

    conn
}

#[tauri::command]
fn delete_saved_command(id: i64)
-> Result<(), String> {

    let conn = get_connection();

    conn.execute("DELETE FROM commands WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn save_command(command: String, help: String, source: String) -> Result<(), String> {
    let conn = get_connection();

    let base_command = command.split(' ').next().unwrap_or("").to_string();

    let now = Utc::now().to_rfc3339();

    conn.execute(
        "
        INSERT INTO commands (
            command,
            base_command,
            help,
            created_at,
            source
        )
        VALUES (?1, ?2, ?3, ?4, ?5)
        ",
        params![command, base_command, help, now, source],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn save_history(commands: Vec<String>) -> Result<(), String> {
    let conn = get_connection();

    let now = Utc::now().to_rfc3339();

    for command in commands {
        let base_command = command.split(' ').next().unwrap_or("").to_string();

        conn.execute(
            "
            INSERT INTO commands (
                command,
                base_command,
                help,
                created_at,
                source
            )
            VALUES (?1, ?2, ?3, ?4, ?5)
            ",
            params![command, base_command, "", now, "history"],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_saved_history() -> Result<Vec<(i64, String)>, String> {
    let conn = get_connection();

    let mut stmt = conn
        .prepare(
            "
        SELECT id, command
        FROM commands
        WHERE source = 'history'
        ORDER BY id DESC
        ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut results = vec![];

    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

#[tauri::command]
fn get_saved_commands()
-> Result<Vec<(i64, String)>, String> {

    let conn = get_connection();

    let mut stmt = conn.prepare(
        "
        SELECT id, command
        FROM commands
        ORDER BY id DESC
        "
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {

        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?
        ))

    }).map_err(|e| e.to_string())?;

    let mut results = vec![];

    for row in rows {

        results.push(
            row.map_err(|e| e.to_string())?
        );
    }

    Ok(results)
}

#[tauri::command]
fn get_history() -> Vec<String> {
    let home = env::var("HOME").unwrap_or_default();

    if home.is_empty() {
        return vec![];
    }

    let path = format!("{}/.bash_history", home);

    let content = fs::read_to_string(path).unwrap_or_default();

    content
        .lines()
        .filter(|line| {
            let line = line.trim();

            !line.is_empty() && !line.starts_with("set ")
        })
        .map(|s| s.to_string())
        .collect()
}

#[tauri::command]
fn has_tldr() -> bool {
    let output = Command::new("tldr").arg("ls").output();

    match output {
        Ok(result) => result.status.success(),

        Err(_) => false,
    }
}

#[tauri::command]
fn get_tldr(command: String) -> Result<String, String> {
    let output = Command::new("tldr")
        .arg(&command)
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();

    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(stderr);
    }

    let ansi_regex = Regex::new(r"\x1B\[[0-9;]*[mK]").unwrap();

    let cleaned = ansi_regex.replace_all(&stdout, "");

    let filtered = cleaned
        .lines()
        .filter(|line| {
            let line = line.trim();

            !line.starts_with("◇")
                && !line.contains("injected env")
                && !line.contains("vestauth")
                && !line.is_empty()
        })
        .collect::<Vec<_>>()
        .join("\n");

    Ok(filtered)
}

#[tauri::command]
fn install_tldr() -> Result<(), String> {
    let install = Command::new("pkexec")
        .args(["npm", "install", "-g", "tldr"])
        .output()
        .map_err(|e| e.to_string())?;

    if !install.status.success() {
        let err = String::from_utf8_lossy(&install.stderr).to_string();

        return Err(err);
    }

    let update = Command::new("tldr")
        .arg("--update")
        .output()
        .map_err(|e| e.to_string())?;

    if !update.status.success() {
        let err = String::from_utf8_lossy(&update.stderr).to_string();

        return Err(err);
    }

    Ok(())
}

#[tauri::command]
fn run_command(command: String, state: tauri::State<AppState>) -> Result<(), String> {
    let window_id = state.terminal_window.lock().unwrap();

    if window_id.is_empty() {
        return Err("Nenhum terminal conectado".into());
    }

    Command::new("xdotool")
        .args(["windowactivate", "--sync", &window_id])
        .output()
        .map_err(|e| e.to_string())?;

    Command::new("xdotool")
        .args(["type", "--delay", "1", &command])
        .output()
        .map_err(|e| e.to_string())?;

    Command::new("xdotool")
        .args(["key", "Return"])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn run_saved_command(index: usize, state: tauri::State<AppState>) -> Result<(), String> {
    let conn = get_connection();

    let mut stmt = conn
        .prepare("SELECT command FROM commands ORDER BY id DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut commands: Vec<String> = vec![];

    for row in rows {
        commands.push(row.map_err(|e| e.to_string())?);
    }

    let command = commands.get(index).ok_or("Comando não encontrado")?;

    let window_id = state.terminal_window.lock().unwrap();

    if window_id.is_empty() {
        return Err("Nenhum terminal conectado".into());
    }

    Command::new("xdotool")
        .args(["windowactivate", "--sync", &window_id])
        .output()
        .map_err(|e| e.to_string())?;

    Command::new("xdotool")
        .args(["type", "--delay", "1", command])
        .output()
        .map_err(|e| e.to_string())?;

    Command::new("xdotool")
        .args(["key", "Return"])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn save_terminal_window(state: tauri::State<AppState>) -> Result<String, String> {
    let output = Command::new("xdotool")
        .arg("getactivewindow")
        .output()
        .map_err(|e| e.to_string())?;

    let window_id = String::from_utf8_lossy(&output.stdout).trim().to_string();

    let mut stored = state.terminal_window.lock().unwrap();

    *stored = window_id.clone();

    Ok(window_id)
}

#[tauri::command]
fn disconnect_terminal(state: tauri::State<AppState>) -> Result<(), String> {
    let mut stored = state.terminal_window.lock().unwrap();

    *stored = String::new();

    Ok(())
}

#[tauri::command]
fn get_saved_helps() -> Result<Vec<(String, String)>, String> {
    let conn = get_connection();

    let mut stmt = conn
        .prepare(
            "
        SELECT command, help
        FROM commands
        WHERE help != ''
        ORDER BY id DESC
        ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;

    let mut results = vec![];

    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}


#[tauri::command]
fn toggle_favorite(id: i64) -> Result<(), String> {

    let conn = get_connection();

    let mut stmt = conn
        .prepare(
            "
        SELECT favorite FROM commands WHERE id = ?1
        "
        )
        .map_err(|e| e.to_string())?;

    let favorite = stmt.query_row([id], |row| row.get::<_, i64>(0))
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "
        update commands set favorite = ?1 where id = ?2
        "
        )
        .map_err(|e| e.to_string())?;

    let new_fav = if favorite == 1 {
        0
    } else {
        1
    };

    stmt.execute([new_fav, id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            terminal_window: Mutex::new(String::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_history,
            run_command,
            run_saved_command,
            save_terminal_window,
            disconnect_terminal,
            has_tldr,
            install_tldr,
            get_tldr,
            save_command,
            save_history,
            get_saved_commands,
            get_saved_helps,
            get_saved_history,
            delete_saved_command,
            toggle_favorite,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
