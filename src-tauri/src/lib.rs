use chrono::Utc;
use regex::Regex;
use rusqlite::{params, Connection};
use serde::Serialize;
use std::{env, fs};
use std::process::Command;
use std::collections::HashMap;
use std::sync::Mutex;
use std::path::PathBuf;
use dirs::cache_dir;

struct AppState {
    terminal_window: Mutex<String>,
    command_help_cache: Mutex<HashMap<String, CommandHelpData>>,
}

#[derive(Debug, Clone, Serialize)]
struct CommandFlag {
    flag: String,
    description: String,
    requires_value: bool,
    example: String,
}

#[derive(Debug, Clone, Serialize)]
struct CommandHelpData {
    command: String,
    help_text: String,
    flags: Vec<CommandFlag>,
}

fn clean_shell_output(raw: &str) -> String {
    let ansi_regex = Regex::new(r"\x1B\[[0-9;]*[mK]").unwrap();
    let cleaned = ansi_regex.replace_all(raw, "");

    let mut filtered_lines: Vec<String> = Vec::new();
    let mut previous_was_empty = false;

    for line in cleaned.lines() {
        let trimmed = line.trim();
        let is_noise = trimmed.starts_with("◇")
            || trimmed.contains("injected env")
            || trimmed.contains("vestauth");

        if is_noise {
            continue;
        }

        if trimmed.is_empty() {
            if previous_was_empty {
                continue;
            }

            previous_was_empty = true;
            filtered_lines.push(String::new());
            continue;
        }

        previous_was_empty = false;
        filtered_lines.push(trimmed.to_string());
    }

    filtered_lines.join("\n").trim().to_string()
}

fn infer_requires_value(flag: &str, description: &str) -> bool {
    let desc = description.to_lowercase();

    if flag.contains('=') {
        return true;
    }

    let requires_tokens = [
        " <",
        "[=",
        "path",
        "file",
        "host",
        "port",
        "name",
        "value",
        "user",
        "dir",
        "directory",
        "image",
        "tag",
    ];

    requires_tokens.iter().any(|token| desc.contains(token))
}

fn parse_command_flags(help_text: &str) -> Vec<CommandFlag> {
    let mut flags: Vec<CommandFlag> = Vec::new();
    let single_flag = Regex::new(r"--?[A-Za-z0-9][A-Za-z0-9\-]*").unwrap();

    // Pattern 1: "  -X, --xarg  description" (2+ spaces between flags and desc)
    // Also handles: "  -p PORT     description" and "  -o <file>    description"
    let spaced_desc = Regex::new(
        r"^\s*((?:(?:--?[\w-]+)(?:[,|]\s*(?:--?[\w-]+))*(?:\s(?:<[^>]+>|\[[^\]]+\]|[A-Za-z_][\w-]*))?))\s{2,}(.*)"
    ).unwrap();

    // Pattern 2: bracket content like "[-X arg]" or "[-v | --version]" or "[--output=<file>]"
    let bracket_raw = Regex::new(r"\[([^\]]*)\]").unwrap();

    // Check if bracket content after flags contains a value placeholder (not another flag)
    fn bracket_has_value(content: &str) -> bool {
        // Check if after any `-flag` or `--flag` there's a non-flag token
        // that looks like a value: <...>, [...], ARG, or =something
        let value_pattern = Regex::new(r"--?[\w-]+\s+(<[^>]+>|\[[^\]]+\]|[A-Za-z_][\w-]*|[=-])").unwrap();
        value_pattern.is_match(content)
    }

    for line in help_text.lines() {
        // Try spaced description format first
        if let Some(caps) = spaced_desc.captures(line) {
            let raw = caps.get(1).unwrap().as_str().trim().to_string();
            let desc = caps.get(2).unwrap().as_str().trim().to_string();

            for m in single_flag.find_iter(&raw) {
                let flag = m.as_str().to_string();
                if !flags.iter().any(|f| f.flag == flag) {
                    flags.push(CommandFlag {
                        requires_value: infer_requires_value(&raw, &desc),
                        flag,
                        description: desc.clone(),
                        example: String::new(),
                    });
                }
            }
        }

        // Try bracket notation format (ssh style, git usage, etc.)
        for caps in bracket_raw.captures_iter(line) {
            let inner = caps.get(1).unwrap().as_str();
            let needs_arg = bracket_has_value(inner);

            // Extract all flags from inside the brackets
            for m in single_flag.find_iter(inner) {
                let flag = m.as_str().to_string();

                if flags.iter().any(|f| f.flag == flag) {
                    continue;
                }

                // Expand bundled single-char flags like -46AaC into -4 -6 -A -a -C
                if flag.starts_with('-') && flag.len() > 2 && !flag.starts_with("--") && !needs_arg {
                    for ch in flag[1..].chars() {
                        let single = format!("-{ch}");
                        if !flags.iter().any(|f| f.flag == single) {
                            flags.push(CommandFlag {
                                requires_value: false,
                                flag: single,
                                description: String::new(),
                                example: String::new(),
                            });
                        }
                    }
                    continue;
                }

                flags.push(CommandFlag {
                    requires_value: needs_arg || flag.contains('='),
                    flag,
                    description: String::new(),
                    example: String::new(),
                });
            }
        }
    }

    flags
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ssh_style_brackets() {
        let help = "ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [-b bind_address]
           [-c cipher_spec] [-D [bind_address:]port] [-E log_file]
           [-e escape_char] [-F configfile] [-I pkcs11] [-i identity_file]
           [-J destination] [-L address] [-l login_name] [-m mac_spec]
           [-O ctl_cmd] [-o option] [-P tag] [-p port] [-R address]
           [-S ctl_path] [-W host:port] [-w local_tun[:remote_tun]]
           destination [command [argument ...]]";

        let parsed = parse_command_flags(help);
        assert!(parsed.len() > 20, "expected many flags, got {}", parsed.len());

        let flag_names: Vec<&str> = parsed.iter().map(|f| f.flag.as_str()).collect();
        assert!(flag_names.contains(&"-p"), "should contain -p");
        assert!(flag_names.contains(&"-i"), "should contain -i");
        assert!(flag_names.contains(&"-v"), "should contain -v from bundle expansion");

        let p_flag = parsed.iter().find(|f| f.flag == "-p").unwrap();
        assert!(p_flag.requires_value, "-p should require value");

        let v_flag = parsed.iter().find(|f| f.flag == "-v").unwrap();
        assert!(!v_flag.requires_value, "-v should not require value");
    }

    #[test]
    fn test_parse_git_style_usage() {
        let help = "usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager]";

        let parsed = parse_command_flags(help);
        assert!(parsed.len() > 5, "expected many flags, got {}", parsed.len());

        let flag_names: Vec<&str> = parsed.iter().map(|f| f.flag.as_str()).collect();
        assert!(flag_names.contains(&"-v"), "should contain -v");
        assert!(flag_names.contains(&"--version"), "should contain --version");
        assert!(flag_names.contains(&"-C"), "should contain -C");

        let c_flag = parsed.iter().find(|f| f.flag == "-C").unwrap();
        assert!(c_flag.requires_value, "-C should require value");
    }

    #[test]
    fn test_parse_spaced_flag_description() {
        let help = "  -p, --port PORT     Port number to connect to
  -v, --verbose       Enable verbose output
  -o file             Write output to file";

        let parsed = parse_command_flags(help);
        assert_eq!(parsed.len(), 5);

        let p_flag = parsed.iter().find(|f| f.flag == "-p").unwrap();
        assert!(p_flag.requires_value);
        assert_eq!(p_flag.description, "Port number to connect to");

        let port_flag = parsed.iter().find(|f| f.flag == "--port").unwrap();
        assert!(port_flag.requires_value);
        assert_eq!(port_flag.description, "Port number to connect to");

        let v_flag = parsed.iter().find(|f| f.flag == "-v").unwrap();
        assert!(!v_flag.requires_value);
        assert_eq!(v_flag.description, "Enable verbose output");
    }
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
fn get_tldr(
    command: String
) -> Result<String, String> {

    let cache_dir =
        get_tldr_cache_dir();

    let cache_file =
        cache_dir.join(
            format!("{}.md", command)
        );

    if cache_file.exists() {

        return fs::read_to_string(
            cache_file
        ).map_err(|e| e.to_string());
    }

    let urls = vec![

        format!(
            "https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/common/{}.md",
            command
        ),

        format!(
            "https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/linux/{}.md",
            command
        )
    ];

    for url in urls {

        let response =
            reqwest::blocking::get(&url);

        if let Ok(resp) = response {

            if resp.status().is_success() {

                let text =
                    resp.text()
                        .map_err(|e| e.to_string())?;

                fs::write(
                    &cache_file,
                    &text
                ).ok();

                return Ok(text);
            }
        }
    }

    Err(
        "Documentação não encontrada"
            .into()
    )
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

fn parse_tldr_flags(command: &str) -> Vec<CommandFlag> {
    let single_flag = Regex::new(r"--?[A-Za-z0-9][A-Za-z0-9\-]*").unwrap();
    let mut flags: Vec<CommandFlag> = Vec::new();

    let output = match Command::new("tldr").arg(command).output() {
        Ok(o) if o.status.success() => o,
        _ => return flags,
    };

    let raw = String::from_utf8_lossy(&output.stdout).to_string();
    let cleaned = clean_shell_output(&raw);
    let mut lines = cleaned.lines().peekable();

    while let Some(line) = lines.next() {
        let trimmed = line.trim();

        // Look for description line starting with "- "
        let desc = match trimmed.strip_prefix("- ") {
            Some(d) => d.trim(),
            None => continue,
        };

        if desc.is_empty() {
            continue;
        }

        // Next indented line should be the example command
        let Some(code_line) = lines.next() else {
            break;
        };

        // TLDR code lines are indented. Trim to get the actual command.
        // Skip placeholder-only lines like "<Enter><~><.>"
        let code = code_line.trim();
        if code.is_empty() || code.starts_with('<') {
            continue;
        }

        let needs_value = desc.contains('<') || desc.contains('[') || desc.to_lowercase().contains("porta")
            || desc.to_lowercase().contains("caminho") || desc.to_lowercase().contains("arquivo")
            || desc.to_lowercase().contains("identidade") || desc.to_lowercase().contains("nome")
            || desc.to_lowercase().contains("usuário") || desc.to_lowercase().contains("comando");

        // Extract flags from the example command line
        for m in single_flag.find_iter(code) {
            let flag = m.as_str().to_string();
            if !flags.iter().any(|f| f.flag == flag) {
                flags.push(CommandFlag {
                    requires_value: needs_value,
                    flag,
                    description: desc.to_string(),
                    example: code.to_string(),
                });
            }
        }
    }

    flags
}

#[tauri::command]
fn get_command_help(
    command: String,
    state: tauri::State<AppState>,
) -> Result<CommandHelpData, String> {

    let command = command.trim().to_string();

    if command.is_empty() {
        return Err("Comando base vazio".into());
    }

    {
        let cache = state.command_help_cache.lock().unwrap();

        if let Some(cached) = cache.get(&command) {
            return Ok(cached.clone());
        }
    }

    // 1. Try TLDR first for rich descriptions
    let tldr_flags = parse_tldr_flags(&command);
    let mut all_flags: Vec<CommandFlag> = Vec::new();
    let mut tldr_help = String::new();

    if !tldr_flags.is_empty() {
        tldr_help = format!("Flags extraídas do TLDR para {}", command);
        // Use TLDR flags as base
        all_flags = tldr_flags.clone();
    }

    // 2. Run --help to get comprehensive flag list
    let mut help_text = String::new();

    if let Ok(output) = Command::new(&command)
        .arg("--help")
        .output()
    {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let merged = format!("{}\n{}", stdout, stderr);
        help_text = clean_shell_output(&merged);

        // Parse flags from --help
        let help_flags = parse_command_flags(&help_text);

        // Merge: TLDR descriptions take priority, add any extra flags from --help
        for hf in help_flags {
            if !all_flags.iter().any(|f| f.flag == hf.flag) {
                all_flags.push(CommandFlag {
                    requires_value: hf.requires_value,
                    flag: hf.flag,
                    description: hf.description,
                    example: String::new(),
                });
            }
        }
    }

    if all_flags.is_empty() {
        return Err(format!(
            "Não foi possível carregar flags de {} (tentei TLDR e --help)",
            command
        ));
    }

    // Use the command's --help output as the main help text, fall back to TLDR
    let final_help = if !help_text.is_empty() {
        help_text
    } else {
        tldr_help
    };

    let data = CommandHelpData {
        command: command.clone(),
        help_text: final_help,
        flags: all_flags,
    };

    {
        let mut cache = state.command_help_cache.lock().unwrap();
        cache.insert(command, data.clone());
    }

    Ok(data)
}

#[tauri::command]
fn has_internet() -> bool {

    reqwest::blocking::get(
        "https://raw.githubusercontent.com"
    ).is_ok()
}

fn get_tldr_cache_dir() -> PathBuf {

    let mut path =
        cache_dir()
            .unwrap_or_else(|| ".".into());

    path.push(
        "hoheckell-command-palette"
    );

    path.push("tldr");

    fs::create_dir_all(&path).ok();

    path
}

#[tauri::command]
fn has_xdotool() -> bool {

    Command::new("which")
        .arg("xdotool")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn install_package(
    package: &str
) -> Result<(), String> {

    let manager =
        detect_package_manager();

    let args: Vec<&str> =
        match manager.as_str() {

            "apt" => vec![
                "apt",
                "install",
                "-y",
                package
            ],

            "dnf" => vec![
                "dnf",
                "install",
                "-y",
                package
            ],

            "zypper" => vec![
                "zypper",
                "install",
                "-y",
                package
            ],

            "pacman" => vec![
                "pacman",
                "-S",
                "--noconfirm",
                package
            ],

            _ => {

                return Err(
                    "Distribuição não suportada"
                        .into()
                );
            }
        };

    let output =
        Command::new("pkexec")
            .args(args)
            .output()
            .map_err(|e| e.to_string())?;

    if !output.status.success() {

        return Err(
            String::from_utf8_lossy(
                &output.stderr
            ).to_string()
        );
    }

    Ok(())
}

#[tauri::command]
fn detect_package_manager() -> String {

    let content =
        std::fs::read_to_string(
            "/etc/os-release"
        ).unwrap_or_default();

    if content.contains("ID=ubuntu")
        || content.contains("ID=debian")
        || content.contains("ID=linuxmint")
    {
        return "apt".into();
    }

    if content.contains("ID=fedora") {

        return "dnf".into();
    }

    if content.contains("ID=opensuse")
        || content.contains("ID=sles")
    {
        return "zypper".into();
    }

    if content.contains("ID=arch")
        || content.contains("ID=manjaro")
    {
        return "pacman".into();
    }

    "unknown".into()
}

#[tauri::command]
fn install_xdotool()
-> Result<(), String> {

    install_package("xdotool")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            terminal_window: Mutex::new(String::new()),
            command_help_cache: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_history,
            run_command,
            run_saved_command,
            save_terminal_window,
            disconnect_terminal,
            get_tldr,
            save_command,
            save_history,
            get_saved_commands,
            get_saved_helps,
            get_saved_history,
            delete_saved_command,
            toggle_favorite,
            get_command_help,
            has_internet,
            has_xdotool,
            install_xdotool,
            detect_package_manager
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
