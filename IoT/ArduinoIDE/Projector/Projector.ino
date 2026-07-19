#include <WiFi.h>
#include "esp_wpa2.h"
#include <HTTPClient.h>

const char* ssid = "BinusWifi-Staff.2.4Ghz"; 
#define EAP_IDENTITY "MASUKANUSERNAME" 
#define EAP_PASSWORD "MASUKANPASSWORD"

String serverName = "http://10.20.176.199:3000/api/projector"; 

const int ldrPin = 34; 

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.print("Menghubungkan ke: ");
  Serial.println(ssid);

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)EAP_IDENTITY, strlen(EAP_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)EAP_IDENTITY, strlen(EAP_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)EAP_PASSWORD, strlen(EAP_PASSWORD));
  esp_wifi_sta_wpa2_ent_enable();

  WiFi.begin(ssid);

  int counter = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    counter++;
    if(counter > 60){
      Serial.println("\nTimeout! Restarting...");
      ESP.restart();
    }
  }

  Serial.println("");
  Serial.println("SUKSES KONEK WIFI KAMPUS!");
  Serial.print("IP Address ESP32: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;

    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    int nilaiSensor = analogRead(ldrPin); 
    
    String statusProjector = (nilaiSensor < 2000) ? "NYALA" : "MATI";
    
    String payload = "{\"status\": \"" + statusProjector + "\", \"nilai_cahaya\": " + String(nilaiSensor) + "}";

    Serial.print("Kirim ke Server: ");
    Serial.println(payload);
    
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Respon Server: " + response);
    } else {
      Serial.print("Gagal Kirim. Error Code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi Putus! Mencoba reconnect...");
  }

  delay(3000);
}