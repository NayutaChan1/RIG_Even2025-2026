use base64::{engine::general_purpose::STANDARD, Engine as _};
use tauri::Manager;

/// Save a PPTX file (sent from the frontend as base64) and return the absolute
/// path. The frontend fetches the binary from the NuxtJS proxy, base64-encodes
/// it, and hands it here so we avoid shipping a huge JSON number array across the
/// IPC boundary.
///
/// If `target_path` is provided (e.g. chosen via a Save-As dialog), the file is
/// written exactly there. Otherwise it falls back to the user's Downloads folder
/// with collision-avoiding " (n)" suffixes.
#[tauri::command]
pub fn save_ppt_file(
    app: tauri::AppHandle,
    filename: String,
    base64_data: String,
    target_path: Option<String>,
) -> Result<String, String> {
    let bytes = STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|e| format!("Gagal decode base64: {e}"))?;

    // Explicit destination from the Save-As dialog: write there verbatim.
    if let Some(p) = target_path.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let target = std::path::PathBuf::from(p);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Gagal membuat folder tujuan: {e}"))?;
        }
        std::fs::write(&target, &bytes).map_err(|e| format!("Gagal menyimpan file: {e}"))?;
        return Ok(target.to_string_lossy().into_owned());
    }

    // No explicit path: default to Downloads (then Documents, then temp).
    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().document_dir())
        .or_else(|_| app.path().temp_dir())
        .map_err(|e| format!("Tidak menemukan folder tujuan: {e}"))?;

    // Sanitize the filename so a malformed Content-Disposition can't escape the dir.
    let safe_name = sanitize_filename(&filename);
    let mut target = dir.join(&safe_name);

    // Avoid clobbering an existing file: append " (n)" before the extension.
    if target.exists() {
        target = next_available_path(&dir, &safe_name);
    }

    std::fs::write(&target, &bytes).map_err(|e| format!("Gagal menyimpan file: {e}"))?;

    Ok(target.to_string_lossy().into_owned())
}

fn sanitize_filename(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect();
    let cleaned = cleaned.trim();
    if cleaned.is_empty() {
        "Briefing.pptx".to_string()
    } else {
        cleaned.to_string()
    }
}

fn next_available_path(dir: &std::path::Path, filename: &str) -> std::path::PathBuf {
    let (stem, ext) = match filename.rsplit_once('.') {
        Some((s, e)) => (s.to_string(), format!(".{e}")),
        None => (filename.to_string(), String::new()),
    };

    for n in 1..1000 {
        let candidate = dir.join(format!("{stem} ({n}){ext}"));
        if !candidate.exists() {
            return candidate;
        }
    }
    dir.join(filename)
}
