use idevice::{pairing_file::PairingFile, provider::TcpProvider};
use isideload::developer_session::DeveloperSession;
use isideload::sideload::sideload_app;
use isideload::{AnisetteConfiguration, AppleAccount, SideloadConfiguration};
use std::net::IpAddr;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::mpsc::RecvTimeoutError;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Listener, Manager, Url, Window};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn install_app(
    handle: AppHandle,
    window: Window,
    pairing_file: String,
    apple_id: String,
    apple_password: String,
    app_path: String,
) -> Result<(), String> {
    let pairing_file =
        PairingFile::from_bytes(pairing_file.as_bytes()).expect("Failed to parse pairing file");
    let addr = IpAddr::from_str("10.7.0.1").expect("Failed to parse IP address");
    let provider = TcpProvider {
        addr,
        pairing_file,
        label: "isideload".to_string(),
    };

    let account = login(&handle, window, apple_id, apple_password)
        .await
        .map_err(|e| format!("Failed to login: {}", e))?;

    let dev_session = DeveloperSession::new(account);

    let config = SideloadConfiguration::default()
        .set_store_dir(handle.path().app_config_dir().map_err(|e| e.to_string())?);

    let app_path_buf = match Url::parse(&app_path) {
        Ok(url) => {
            if let Ok(path_buf) = url.to_file_path() {
                path_buf
            } else {
                return Err("Invalid app path".to_string());
            }
        }
        Err(e) => {
            return Err(format!("Invalid app path (bad uri): {}", e));
        }
    };

    sideload_app(&provider, &dev_session, app_path_buf, config)
        .await
        .map_err(|e| format!("Failed to sideload app: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![install_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub async fn login(
    handle: &AppHandle,
    window: Window,
    apple_id: String,
    apple_pass: String,
) -> Result<Arc<AppleAccount>, String> {
    let appleid_closure =
        || -> Result<(String, String), String> { Ok((apple_id.clone(), apple_pass.clone())) };

    let (tx, rx) = std::sync::mpsc::channel::<String>();
    let window_clone = window.clone();
    let tfa_closure = move || -> Result<String, String> {
        window_clone
            .emit("2fa-required", ())
            .expect("Failed to emit 2fa-required event");

        let tx = tx.clone();
        let handler_id = window_clone.listen("2fa-recieved", move |event| {
            let code = event.payload();
            let _ = tx.send(code.to_string());
        });

        let result = rx.recv_timeout(Duration::from_secs(120));
        window_clone.unlisten(handler_id);

        match result {
            Ok(code) => {
                let code = code.trim_matches('"').to_string();
                Ok(code)
            }
            Err(RecvTimeoutError::Timeout) | Err(RecvTimeoutError::Disconnected) => {
                Err("2FA cancelled or timed out".to_string())
            }
        }
    };

    let config = AnisetteConfiguration::default();
    let config =
        config.set_configuration_path(handle.path().app_config_dir().map_err(|e| e.to_string())?);

    let account = AppleAccount::login(appleid_closure, tfa_closure, config).await;
    if let Err(e) = account {
        return Err(format!("{:?}", e));
    }
    let account = Arc::new(account.unwrap());

    Ok(account)
}
