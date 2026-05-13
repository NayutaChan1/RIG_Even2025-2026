mod serial;
mod network;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(serial::SerialManager::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            network::pc_get_lan_ipv4,
            network::pc_list_ipv4_adapters,
            serial::serial_list_ports,
            serial::serial_connect_ch340,
            serial::serial_disconnect,
            serial::serial_send_line,
            serial::serial_send_pc_lan_ip
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
