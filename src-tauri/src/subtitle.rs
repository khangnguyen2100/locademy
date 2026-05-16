use std::fs;
use std::path::Path;

pub const SUBTITLE_EXTENSIONS: &[&str] = &["vtt", "srt", "ass", "ssa"];

/// Returns the path of the first matching subtitle file for the given video,
/// searching for files with the same stem in the same directory.
#[tauri::command]
pub fn find_subtitle(video_path: String) -> Option<String> {
    let video = Path::new(&video_path);
    let stem = video.file_stem()?.to_str()?;
    let parent = video.parent()?;
    for ext in SUBTITLE_EXTENSIONS {
        let candidate = parent.join(format!("{}.{}", stem, ext));
        if candidate.is_file() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }
    None
}

/// Reads a subtitle file and returns its content as a VTT string,
/// converting SRT / ASS / SSA to VTT on the fly.
#[tauri::command]
pub fn read_subtitle_as_vtt(subtitle_path: String) -> Result<String, String> {
    let path = Path::new(&subtitle_path);
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "vtt" => Ok(content),
        "srt" => Ok(srt_to_vtt(&content)),
        "ass" | "ssa" => Ok(ass_to_vtt(&content)),
        _ => Err(format!("Unsupported subtitle format: {}", ext)),
    }
}

// ── Format converters ────────────────────────────────────────────────────────

fn srt_to_vtt(srt: &str) -> String {
    let mut vtt = String::from("WEBVTT\n\n");
    let normalized = srt.replace("\r\n", "\n").replace('\r', "\n");
    for line in normalized.lines() {
        if line.contains("-->") {
            // SRT:  00:00:01,000 --> 00:00:04,000
            // VTT:  00:00:01.000 --> 00:00:04.000
            vtt.push_str(&line.replace(',', "."));
        } else {
            vtt.push_str(line);
        }
        vtt.push('\n');
    }
    vtt
}

fn ass_to_vtt(ass: &str) -> String {
    let mut vtt = String::from("WEBVTT\n\n");
    let mut in_events = false;
    // Standard ASS column order: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
    // We parse the Format line so non-standard orderings still work.
    let mut start_col: usize = 1;
    let mut end_col: usize = 2;
    let mut text_col: usize = 9;
    let mut counter: u32 = 0;

    let normalized = ass.replace("\r\n", "\n").replace('\r', "\n");
    for line in normalized.lines() {
        let line = line.trim();
        if line.eq_ignore_ascii_case("[Events]") {
            in_events = true;
            continue;
        }
        if line.starts_with('[') {
            in_events = false;
            continue;
        }
        if !in_events {
            continue;
        }
        if line.starts_with("Format:") {
            let cols: Vec<&str> = line["Format:".len()..].split(',').map(str::trim).collect();
            for (i, col) in cols.iter().enumerate() {
                match col.to_lowercase().as_str() {
                    "start" => start_col = i,
                    "end" => end_col = i,
                    "text" => text_col = i,
                    _ => {}
                }
            }
            continue;
        }
        if line.starts_with("Dialogue:") {
            let rest = &line["Dialogue:".len()..];
            // text_col must be the highest index so splitn preserves embedded commas in text.
            // If not (non-standard Format), skip rather than panic or corrupt text.
            if start_col >= text_col || end_col >= text_col {
                continue;
            }
            let max_cols = text_col + 1;
            let parts: Vec<&str> = rest.splitn(max_cols, ',').collect();
            if parts.len() < max_cols {
                continue;
            }
            let start = ass_time_to_vtt(parts[start_col].trim());
            let end = ass_time_to_vtt(parts[end_col].trim());
            let text = strip_ass_tags(parts[text_col].trim());
            if text.is_empty() {
                continue;
            }
            counter += 1;
            vtt.push_str(&format!("{}\n{} --> {}\n{}\n\n", counter, start, end, text));
        }
    }
    vtt
}

/// ASS time `H:MM:SS.cc` (centiseconds) → VTT `HH:MM:SS.mmm`
fn ass_time_to_vtt(t: &str) -> String {
    let parts: Vec<&str> = t.splitn(3, ':').collect();
    if parts.len() != 3 {
        return "00:00:00.000".to_string();
    }
    let h: u32 = parts[0].parse().unwrap_or(0);
    let m: u32 = parts[1].parse().unwrap_or(0);
    let sec_parts: Vec<&str> = parts[2].splitn(2, '.').collect();
    let s: u32 = sec_parts[0].parse().unwrap_or(0);
    let cs: u32 = sec_parts.get(1).and_then(|v| v.parse().ok()).unwrap_or(0);
    format!("{:02}:{:02}:{:02}.{:03}", h, m, s, cs * 10)
}

/// Strip `{override}` blocks and convert `\N` / `\n` to real newlines.
fn strip_ass_tags(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut in_tag = false;
    let mut chars = text.chars().peekable();
    while let Some(ch) = chars.next() {
        match ch {
            '{' => in_tag = true,
            '}' => in_tag = false,
            '\\' if !in_tag => match chars.peek() {
                Some('N') | Some('n') => {
                    chars.next();
                    out.push('\n');
                }
                _ => out.push('\\'),
            },
            _ if !in_tag => out.push(ch),
            _ => {}
        }
    }
    out
}
