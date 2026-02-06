use crate::models::AppSettings;
use std::fs;
use std::path::PathBuf;

fn settings_path() -> PathBuf {
    let home = dirs::home_dir().expect("No home dir");
    home.join(".claude").join("claudepulse-settings.json")
}

pub fn load_settings() -> AppSettings {
    let path = settings_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

pub fn save_settings(settings: &AppSettings) -> Result<(), Box<dyn std::error::Error>> {
    let path = settings_path();
    let content = serde_json::to_string_pretty(settings)?;
    fs::write(path, content)?;
    Ok(())
}
