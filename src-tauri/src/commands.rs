use std::sync::Mutex;

use tauri::State;

use crate::aggregator::build_snapshot;
use crate::models::{AppSettings, UsageSnapshot};

pub struct AppState {
    pub settings: Mutex<AppSettings>,
}

#[tauri::command]
pub fn get_usage_snapshot(state: State<'_, AppState>) -> Result<UsageSnapshot, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(build_snapshot(settings.window_hours))
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_settings(
    state: State<'_, AppState>,
    new_settings: AppSettings,
) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    *settings = new_settings.clone();
    crate::settings::save_settings(&new_settings).map_err(|e| e.to_string())
}
