use serde::Serialize;
use std::{
    io::{Read, Write},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc,
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::Duration,
};
use tauri::{AppHandle, Emitter, State};

use crate::network;

#[derive(Debug, Clone, Serialize)]
pub struct SerialPortEntry {
    pub port_name: String,
    pub display_name: String,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub vid: Option<u16>,
    pub pid: Option<u16>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerialConnectResult {
    pub port_name: String,
    pub baud_rate: u32,
}

#[derive(Debug, Clone, Serialize)]
struct SerialStatusEvent {
    status: String,
    port_name: Option<String>,
    message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct SerialDataEvent {
    port_name: String,
    data: String,
}

pub struct SerialManager {
    inner: Mutex<SerialManagerInner>,
}

#[derive(Default)]
struct SerialManagerInner {
    stop_flag: Option<Arc<AtomicBool>>,
    thread: Option<JoinHandle<()>>,
    tx: Option<mpsc::Sender<Vec<u8>>>,
    port_name: Option<String>,
    baud_rate: Option<u32>,
}

impl Default for SerialManager {
    fn default() -> Self {
        Self {
            inner: Mutex::new(SerialManagerInner::default()),
        }
    }
}

fn port_entry(info: &serialport::SerialPortInfo) -> SerialPortEntry {
    let mut manufacturer: Option<String> = None;
    let mut product: Option<String> = None;
    let mut vid: Option<u16> = None;
    let mut pid: Option<u16> = None;

    if let serialport::SerialPortType::UsbPort(usb) = &info.port_type {
        manufacturer = usb.manufacturer.clone();
        product = usb.product.clone();
        vid = Some(usb.vid);
        pid = Some(usb.pid);
    }

    let display_hint = product
        .clone()
        .or_else(|| manufacturer.clone())
        .unwrap_or_else(|| info.port_name.clone());

    SerialPortEntry {
        port_name: info.port_name.clone(),
        display_name: format!("{} ({})", display_hint, info.port_name),
        manufacturer,
        product,
        vid,
        pid,
    }
}

fn is_ch340(info: &serialport::SerialPortInfo) -> bool {
    const CH340_VID: u16 = 0x1A86;
    const CH340_PIDS: [u16; 3] = [0x7523, 0x5523, 0x55D4];

    if let serialport::SerialPortType::UsbPort(usb) = &info.port_type {
        if usb.vid == CH340_VID {
            return true;
        }
        if CH340_PIDS.contains(&usb.pid) {
            return true;
        }

        let prod = usb.product.as_deref().unwrap_or("").to_ascii_lowercase();
        let manu = usb
            .manufacturer
            .as_deref()
            .unwrap_or("")
            .to_ascii_lowercase();

        return prod.contains("ch340") || manu.contains("ch340");
    }

    false
}

#[tauri::command]
pub fn serial_list_ports() -> Result<Vec<SerialPortEntry>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    Ok(ports.iter().map(port_entry).collect())
}

#[tauri::command]
pub fn serial_connect_ch340(
    app: AppHandle,
    state: State<'_, SerialManager>,
    baud_rate: Option<u32>,
) -> Result<SerialConnectResult, String> {
    let finished_thread = {
        let mut inner = state
            .inner
            .lock()
            .map_err(|_| "Serial state lock poisoned".to_string())?;

        if let Some(handle) = inner.thread.as_ref() {
            if !handle.is_finished() {
                return Err("Serial already connected".to_string());
            }
        }

        inner.stop_flag = None;
        inner.port_name = None;
        inner.baud_rate = None;
        inner.tx = None;
        inner.thread.take()
    };

    if let Some(thread) = finished_thread {
        let _ = thread.join();
    }

    let baud_rate = baud_rate.unwrap_or(115_200);
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let ch340 = ports
        .iter()
        .find(|p| is_ch340(p))
        .ok_or_else(|| "CH340 serial device not found. Pastikan ESP32 (CH340) sudah terpasang.".to_string())?;

    let port_name = ch340.port_name.clone();

    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_flag_thread = Arc::clone(&stop_flag);
    let app_thread = app.clone();
    let port_name_thread = port_name.clone();

    let (tx, rx) = mpsc::channel::<Vec<u8>>();

    let thread = thread::spawn(move || {
        let _ = app_thread.emit(
            "serial-status",
            SerialStatusEvent {
                status: "connecting".into(),
                port_name: Some(port_name_thread.clone()),
                message: Some(format!("Opening {} @ {}", port_name_thread, baud_rate)),
            },
        );

        let mut port = match serialport::new(&port_name_thread, baud_rate)
            .timeout(Duration::from_millis(200))
            .open()
        {
            Ok(p) => p,
            Err(e) => {
                let _ = app_thread.emit(
                    "serial-status",
                    SerialStatusEvent {
                        status: "error".into(),
                        port_name: Some(port_name_thread.clone()),
                        message: Some(e.to_string()),
                    },
                );
                return;
            }
        };

        let _ = app_thread.emit(
            "serial-status",
            SerialStatusEvent {
                status: "connected".into(),
                port_name: Some(port_name_thread.clone()),
                message: None,
            },
        );

        let mut buf = [0u8; 1024];
        let mut line_buf: Vec<u8> = Vec::with_capacity(1024);

        while !stop_flag_thread.load(Ordering::Relaxed) {
            while let Ok(bytes) = rx.try_recv() {
                if let Err(e) = port.write_all(&bytes) {
                    let _ = app_thread.emit(
                        "serial-status",
                        SerialStatusEvent {
                            status: "error".into(),
                            port_name: Some(port_name_thread.clone()),
                            message: Some(format!("Serial write failed: {}", e)),
                        },
                    );
                    break;
                }
            }

            match port.read(&mut buf) {
                Ok(0) => {}
                Ok(n) => {
                    for &b in &buf[..n] {
                        if b == b'\n' {
                            let line = String::from_utf8_lossy(&line_buf)
                                .trim_end_matches(['\r', '\n'])
                                .to_string();
                            line_buf.clear();

                            if !line.is_empty() {
                                let _ = app_thread.emit(
                                    "serial-data",
                                    SerialDataEvent {
                                        port_name: port_name_thread.clone(),
                                        data: line,
                                    },
                                );
                            }
                        } else {
                            line_buf.push(b);
                            if line_buf.len() > 64 * 1024 {
                                let chunk = String::from_utf8_lossy(&line_buf).to_string();
                                line_buf.clear();
                                let _ = app_thread.emit(
                                    "serial-data",
                                    SerialDataEvent {
                                        port_name: port_name_thread.clone(),
                                        data: chunk,
                                    },
                                );
                            }
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                Err(e) => {
                    let _ = app_thread.emit(
                        "serial-status",
                        SerialStatusEvent {
                            status: "error".into(),
                            port_name: Some(port_name_thread.clone()),
                            message: Some(e.to_string()),
                        },
                    );
                    break;
                }
            }
        }

        drop(port);

        let _ = app_thread.emit(
            "serial-status",
            SerialStatusEvent {
                status: "disconnected".into(),
                port_name: Some(port_name_thread.clone()),
                message: None,
            },
        );
    });

    {
        let mut inner = state
            .inner
            .lock()
            .map_err(|_| "Serial state lock poisoned".to_string())?;
        inner.stop_flag = Some(stop_flag);
        inner.thread = Some(thread);
        inner.tx = Some(tx);
        inner.port_name = Some(port_name.clone());
        inner.baud_rate = Some(baud_rate);
    }

    Ok(SerialConnectResult { port_name, baud_rate })
}

#[tauri::command]
pub fn serial_disconnect(state: State<'_, SerialManager>) -> Result<(), String> {
    let (flag, thread) = {
        let mut inner = state
            .inner
            .lock()
            .map_err(|_| "Serial state lock poisoned".to_string())?;
        inner.tx = None;
        (inner.stop_flag.take(), inner.thread.take())
    };

    if let Some(flag) = flag {
        flag.store(true, Ordering::SeqCst);
    }

    if let Some(thread) = thread {
        let _ = thread.join();
    }

    {
        let mut inner = state
            .inner
            .lock()
            .map_err(|_| "Serial state lock poisoned".to_string())?;
        inner.port_name = None;
        inner.baud_rate = None;
    }

    Ok(())
}

#[tauri::command]
pub fn serial_send_line(state: State<'_, SerialManager>, line: String) -> Result<(), String> {
    let tx = {
        let inner = state
            .inner
            .lock()
            .map_err(|_| "Serial state lock poisoned".to_string())?;
        inner
            .tx
            .clone()
            .ok_or_else(|| "Serial not connected".to_string())?
    };

    let mut bytes = line.into_bytes();
    if !bytes.ends_with(b"\n") {
        bytes.push(b'\n');
    }

    tx.send(bytes)
        .map_err(|_| "Failed to send to serial thread".to_string())
}

#[tauri::command]
pub fn serial_send_pc_lan_ip(
    state: State<'_, SerialManager>,
    prefix: Option<String>,
    prefer_dns_suffix: Option<String>,
) -> Result<String, String> {
    let ip = network::get_lan_ipv4_string_with_preference(prefer_dns_suffix.as_deref())?;
    let prefix = prefix.unwrap_or_else(|| "IP:".to_string());
    let line = format!("{}{}", prefix, ip);

    serial_send_line(state, line)?;
    Ok(ip)
}
