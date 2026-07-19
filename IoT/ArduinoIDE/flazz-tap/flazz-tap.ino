#include <SPI.h>
#include <MFRC522.h>

// Set 1 if you still want ESP32 to POST to the API.
// Set 0 to use Serial-only (recommended when Tauri reads the data).
#define USE_HTTP 0

#if USE_HTTP
#include <WiFi.h>
#include <HTTPClient.h>
#endif

#define SS_PIN 5
#define RST_PIN 22

// PC LAN IP received from the desktop app over serial.
// Desktop sends: "IP:192.168.x.x\n"
String pcIp = "";
String serialRxLine = "";

#if USE_HTTP
const char* ssid = "Binus-Access"; //nama wifi
const char* password = ""; // password

const char* serverUrl = "http://192.168.0.10:3000/api/card"; // ip
#endif

MFRC522 mfrc522(SS_PIN, RST_PIN);

#if USE_HTTP
// ================= FreeRTOS =================
QueueHandle_t rfidQueue;
#endif

unsigned long lastScanTime = 0;
const unsigned long debounceDelay = 500;

// ================= HTTP TASK =================
#if USE_HTTP
void httpTask(void * parameter) {
  String uid;

  for (;;) {
    if (xQueueReceive(rfidQueue, &uid, portMAX_DELAY) == pdTRUE) {

      if (WiFi.status() == WL_CONNECTED) {

        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        String json = "{\"id\":\"" + uid + "\",\"room\":\"" + pcIp + "\"}";
        int httpResponseCode = http.POST(json);

        Serial.print("[HTTP] UID: ");
        Serial.print(uid);
        Serial.print(" -> Response: ");
        Serial.println(httpResponseCode);

        http.end();
      } else {
        Serial.println("[HTTP] WiFi not connected");
      }
    }
  }
}
#endif

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50);

  Serial.println("[ESP32] boot");

#if USE_HTTP
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected  ");
  Serial.println(WiFi.localIP());
#endif

  SPI.begin();
  mfrc522.PCD_Init();

  Serial.println("[ESP32] ready");

#if USE_HTTP
  // Create Queue
  rfidQueue = xQueueCreate(10, sizeof(String));

  // Create HTTP Task (Core 1)
  xTaskCreatePinnedToCore(
    httpTask,
    "HTTP Task",
    10000,
    NULL,
    1,
    NULL,
    1
  );
#endif
}

// ================= LOOP =================
void loop() {

  // Always ingest inbound messages from the desktop app (non-blocking).
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\r') continue;

    if (c == '\n') {
      serialRxLine.trim();
      if (serialRxLine.startsWith("IP:") || serialRxLine.startsWith("IP=")) {
        pcIp = serialRxLine.substring(3);
        pcIp.trim();
      }
      serialRxLine = "";
    } else {
      serialRxLine += c;
      if (serialRxLine.length() > 128) {
        serialRxLine = "";
      }
    }
  }

  unsigned long currentMillis = millis();

  if (currentMillis - lastScanTime < debounceDelay) {
    return;
  }

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String uidStr = "";

  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(mfrc522.uid.uidByte[i], HEX);
  }

  uidStr.toUpperCase();

  // One line per scan (newline-delimited) so Tauri can read it easily.
  // Format matches your previous API body.
  Serial.print("{\"id\":\"");
  Serial.print(uidStr);
  Serial.print("\",\"room\":\"");
  Serial.print(pcIp);
  Serial.println("\"}");

#if USE_HTTP
  // Kirim ke Queue (non blocking)
  xQueueSend(rfidQueue, &uidStr, 0);
#endif

  lastScanTime = currentMillis;

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}