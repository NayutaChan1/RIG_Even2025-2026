use serde::Serialize;
use std::{
    convert::TryFrom,
    ffi::CStr,
    net::{IpAddr, Ipv4Addr},
};

fn is_private_rfc1918(ip: Ipv4Addr) -> bool {
    let [a, b, ..] = ip.octets();
    a == 10 || (a == 172 && (16..=31).contains(&b)) || (a == 192 && b == 168)
}

fn looks_virtual_adapter(name_or_desc: &str) -> bool {
    let s = name_or_desc.to_ascii_lowercase();
    [
        "vmware",
        "virtualbox",
        "hyper-v",
        "veth",
        "vethernet",
        "wsl",
        "loopback",
        "tunnel",
        "tap",
        "tun",
        "hamachi",
        "zerotier",
        "tailscale",
        "wireguard",
    ]
    .iter()
    .any(|k| s.contains(k))
}

#[derive(Debug, Clone, Serialize)]
pub struct Ipv4AdapterInfo {
    pub friendly_name: String,
    pub description: String,
    pub dns_suffix: Option<String>,
    pub ipv4: Vec<String>,
    pub gateways: Vec<String>,
}

#[cfg(target_os = "windows")]
fn list_ipv4_adapters_windows() -> Result<Vec<Ipv4AdapterInfo>, String> {
    use windows_sys::Win32::Foundation::{ERROR_BUFFER_OVERFLOW, ERROR_SUCCESS};
    use windows_sys::Win32::NetworkManagement::IpHelper::{
        GetAdaptersAddresses, IP_ADAPTER_ADDRESSES_LH, IP_ADAPTER_GATEWAY_ADDRESS_LH,
        IP_ADAPTER_UNICAST_ADDRESS_LH, GAA_FLAG_INCLUDE_GATEWAYS, GAA_FLAG_INCLUDE_PREFIX,
    };
    use windows_sys::Win32::Networking::WinSock::{AF_UNSPEC, SOCKET_ADDRESS};

    unsafe fn wide_ptr_to_string(ptr: *const u16) -> Option<String> {
        if ptr.is_null() {
            return None;
        }
        let mut len = 0usize;
        while *ptr.add(len) != 0 {
            len += 1;
        }
        if len == 0 {
            return None;
        }
        let slice = std::slice::from_raw_parts(ptr, len);
        let s = String::from_utf16_lossy(slice);
        let s = s.trim().to_string();
        if s.is_empty() { None } else { Some(s) }
    }

    unsafe fn socket_address_to_ipaddr(socket_address: &SOCKET_ADDRESS) -> Option<IpAddr> {
        let (_, sockaddr) = socket2::SockAddr::try_init(|storage, length| {
            if socket_address.lpSockaddr.is_null() {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "null sockaddr pointer",
                ));
            }

            let sockaddr_length = usize::try_from(socket_address.iSockaddrLength).map_err(|_| {
                std::io::Error::new(std::io::ErrorKind::InvalidData, "invalid sockaddr length")
            })?;

            let max = std::mem::size_of_val(&storage.read_unaligned());
            if sockaddr_length > max {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "sockaddr length too large",
                ));
            }

            let dst: *mut u8 = storage.cast();
            let src: *const u8 = socket_address.lpSockaddr.cast();
            dst.copy_from_nonoverlapping(src, sockaddr_length);
            std::ptr::write_unaligned(length, socket_address.iSockaddrLength);
            Ok(())
        })
        .ok()?;

        sockaddr.as_socket().map(|s| s.ip())
    }

    unsafe fn collect_unicast_ipv4(mut ptr: *mut IP_ADAPTER_UNICAST_ADDRESS_LH) -> Vec<Ipv4Addr> {
        let mut out = Vec::new();
        while !ptr.is_null() {
            let entry = ptr.read_unaligned();
            if let Some(IpAddr::V4(v4)) = socket_address_to_ipaddr(&entry.Address) {
                if !v4.is_loopback() && !v4.is_link_local() && !v4.is_unspecified() && !v4.is_multicast() {
                    out.push(v4);
                }
            }
            ptr = entry.Next;
        }
        out
    }

    unsafe fn collect_gateways_ipv4(mut ptr: *mut IP_ADAPTER_GATEWAY_ADDRESS_LH) -> Vec<Ipv4Addr> {
        let mut out = Vec::new();
        while !ptr.is_null() {
            let entry = ptr.read_unaligned();
            if let Some(IpAddr::V4(v4)) = socket_address_to_ipaddr(&entry.Address) {
                if !v4.is_loopback() && !v4.is_link_local() && !v4.is_unspecified() {
                    out.push(v4);
                }
            }
            ptr = entry.Next;
        }
        out
    }

    let mut buf_len: u32 = 16 * 1024;
    let mut buffer: Vec<u8> = Vec::new();

    let mut result = ERROR_BUFFER_OVERFLOW;
    while result == ERROR_BUFFER_OVERFLOW {
        buffer.resize(buf_len as usize, 0);
        result = unsafe {
            GetAdaptersAddresses(
                AF_UNSPEC as u32,
                (GAA_FLAG_INCLUDE_GATEWAYS | GAA_FLAG_INCLUDE_PREFIX) as u32,
                std::ptr::null_mut(),
                buffer.as_mut_ptr() as *mut IP_ADAPTER_ADDRESSES_LH,
                &mut buf_len as *mut u32,
            )
        };
    }

    if result != ERROR_SUCCESS {
        return Err(format!("GetAdaptersAddresses failed with status {}", result));
    }

    let mut out: Vec<Ipv4AdapterInfo> = Vec::new();
    let mut ptr = buffer.as_mut_ptr() as *mut IP_ADAPTER_ADDRESSES_LH;

    while !ptr.is_null() {
        let ad = unsafe { ptr.read_unaligned() };

        let friendly_name = unsafe { wide_ptr_to_string(ad.FriendlyName).unwrap_or_default() };
        let description = unsafe { wide_ptr_to_string(ad.Description).unwrap_or_default() };
        let dns_suffix = unsafe { wide_ptr_to_string(ad.DnsSuffix) };

        let ipv4: Vec<String> = unsafe { collect_unicast_ipv4(ad.FirstUnicastAddress) }
            .into_iter()
            .map(|v4| v4.to_string())
            .collect();

        let gateways: Vec<String> = unsafe { collect_gateways_ipv4(ad.FirstGatewayAddress) }
            .into_iter()
            .map(|v4| v4.to_string())
            .collect();

        let mut friendly_name = friendly_name;
        let mut description = description;
        if friendly_name.is_empty() || description.is_empty() {
            if !ad.AdapterName.is_null() {
                let c = unsafe { CStr::from_ptr(ad.AdapterName.cast()) };
                if let Ok(s) = c.to_str() {
                    if friendly_name.is_empty() {
                        friendly_name = s.to_string();
                    }
                    if description.is_empty() {
                        description = s.to_string();
                    }
                }
            }
        }

        out.push(Ipv4AdapterInfo {
            friendly_name,
            description,
            dns_suffix,
            ipv4,
            gateways,
        });

        ptr = ad.Next;
    }

    Ok(out)
}

fn pick_best_ipv4_from_adapters(
    adapters: &[Ipv4AdapterInfo],
    prefer_dns_suffix: Option<&str>,
) -> Option<String> {
    let prefer_dns_suffix = prefer_dns_suffix.map(|s| s.trim()).filter(|s| !s.is_empty());

    let mut best: Option<(i32, String)> = None;

    for ad in adapters {
        let mut adapter_score = 0;

        if !ad.gateways.is_empty() {
            adapter_score += 800;
        }

        let name_l = ad.friendly_name.to_ascii_lowercase();
        if name_l.contains("wi-fi") || name_l.contains("wifi") || name_l.contains("ethernet") {
            adapter_score += 200;
        }

        if looks_virtual_adapter(&ad.friendly_name) || looks_virtual_adapter(&ad.description) {
            adapter_score -= 1200;
        }

        if let Some(pref) = prefer_dns_suffix {
            let matches = ad
                .dns_suffix
                .as_deref()
                .unwrap_or("")
                .eq_ignore_ascii_case(pref)
                || ad
                    .dns_suffix
                    .as_deref()
                    .unwrap_or("")
                    .to_ascii_lowercase()
                    .contains(&pref.to_ascii_lowercase());

            if !matches {
                continue;
            }

            adapter_score += 2000;
        }

        for ip_str in &ad.ipv4 {
            let ip: Ipv4Addr = match ip_str.parse() {
                Ok(v) => v,
                Err(_) => continue,
            };

            let mut score = adapter_score;
            score += if is_private_rfc1918(ip) { 300 } else { 20 };

            match &best {
                None => best = Some((score, ip_str.clone())),
                Some((best_score, _)) if score > *best_score => best = Some((score, ip_str.clone())),
                _ => {}
            }
        }
    }

    best.map(|(_, ip)| ip)
}

fn get_lan_ipv4_string_fallback() -> Result<String, String> {
    let ifaces = get_if_addrs::get_if_addrs().map_err(|e| e.to_string())?;

    let mut best: Option<(i32, Ipv4Addr)> = None;

    for iface in ifaces {
        let ip = match iface.ip() {
            std::net::IpAddr::V4(v4) => v4,
            std::net::IpAddr::V6(_) => continue,
        };

        if ip.is_loopback() || ip.is_link_local() || ip.is_unspecified() || ip.is_multicast() {
            continue;
        }

        let mut score = if is_private_rfc1918(ip) { 100 } else { 10 };
        if looks_virtual_adapter(&iface.name) {
            score -= 1000;
        }
        if iface.name.to_ascii_lowercase().contains("wi-fi")
            || iface.name.to_ascii_lowercase().contains("ethernet")
        {
            score += 20;
        }

        match best {
            None => best = Some((score, ip)),
            Some((best_score, _)) if score > best_score => best = Some((score, ip)),
            _ => {}
        }
    }

    best.map(|(_, ip)| ip.to_string())
        .ok_or_else(|| "No suitable IPv4 LAN address found on this machine".to_string())
}

pub fn get_lan_ipv4_string_with_preference(
    prefer_dns_suffix: Option<&str>,
) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(adapters) = list_ipv4_adapters_windows() {
            if let Some(ip) = pick_best_ipv4_from_adapters(&adapters, prefer_dns_suffix) {
                return Ok(ip);
            }

            if let Some(pref) = prefer_dns_suffix.map(|s| s.trim()).filter(|s| !s.is_empty()) {
                let mut suffixes: Vec<String> = adapters
                    .iter()
                    .filter_map(|a| a.dns_suffix.clone())
                    .filter(|s| !s.trim().is_empty())
                    .collect();
                suffixes.sort();
                suffixes.dedup();

                return Err(format!(
                    "No IPv4 address found for DNS suffix '{}'. Available DNS suffixes: {}",
                    pref,
                    if suffixes.is_empty() {
                        "(none)".to_string()
                    } else {
                        suffixes.join(", ")
                    }
                ));
            }
        }
    }

    get_lan_ipv4_string_fallback()
}

pub fn get_lan_ipv4_string() -> Result<String, String> {
    get_lan_ipv4_string_with_preference(None)
}

#[tauri::command]
pub fn pc_get_lan_ipv4(prefer_dns_suffix: Option<String>) -> Result<String, String> {
    get_lan_ipv4_string_with_preference(prefer_dns_suffix.as_deref())
}

#[tauri::command]
pub fn pc_list_ipv4_adapters() -> Result<Vec<Ipv4AdapterInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        return list_ipv4_adapters_windows();
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(Vec::new())
    }
}
