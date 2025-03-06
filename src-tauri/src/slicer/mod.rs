#[tauri::command]
pub fn slicer(name: &str) -> String {
    format!("Hello, {}!", name)
}
