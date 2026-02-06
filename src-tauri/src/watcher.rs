use notify::RecursiveMode;
use notify_debouncer_mini::new_debouncer;
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub fn start_watcher(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let home = match dirs::home_dir() {
            Some(h) => h,
            None => return,
        };
        let watch_path = home.join(".claude").join("projects");

        if !watch_path.exists() {
            return;
        }

        let (tx, rx) = mpsc::channel();
        let mut debouncer = match new_debouncer(Duration::from_secs(5), tx) {
            Ok(d) => d,
            Err(_) => return,
        };

        if debouncer
            .watcher()
            .watch(&watch_path, RecursiveMode::Recursive)
            .is_err()
        {
            return;
        }

        loop {
            match rx.recv() {
                Ok(Ok(events)) => {
                    let has_jsonl = events.iter().any(|e| {
                        e.path
                            .extension()
                            .map(|ext| ext == "jsonl")
                            .unwrap_or(false)
                    });
                    if has_jsonl {
                        let _ = app_handle.emit("usage-data-changed", ());
                    }
                }
                Ok(Err(_)) | Err(_) => break,
            }
        }
    });
}
