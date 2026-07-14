#include <WiFi.h>
#include "esp_wpa2.h"
#include <HTTPClient.h>
#include "secrets.h"

const int reedPin = 4;

int lastState = -1;

#define PAYLOAD_MAX 64

QueueHandle_t doorQueue;

void httpTask(void* parameter) {
  char payload[PAYLOAD_MAX];

  for (;;) {
    if (xQueueReceive(doorQueue, payload, portMAX_DELAY) == pdTRUE) {
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(SERVER_URL);
        http.addHeader("Content-Type", "application/json");

        int httpResponseCode = http.POST((uint8_t*)payload, strlen(payload));

        Serial.print("[HTTP] ");
        Serial.print(payload);
        Serial.print(" -> ");
        Serial.println(httpResponseCode);

        http.end();
      } else {
        Serial.println("[HTTP] WiFi not connected");
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("[Door] boot");

  Serial.println();
  Serial.print("Connecting to network: ");
  Serial.println(WIFI_SSID);

  WiFi.disconnect(true); // Disconnect from any previous settings
  WiFi.mode(WIFI_STA);   // Set ESP32 to Station mode

  // 2. Initialize WPA2 Enterprise settings
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)WIFI_USN, strlen(WIFI_USN));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)WIFI_USN, strlen(WIFI_USN));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)WIFI_PASS, strlen(WIFI_PASS));
  
  // Set default WPA2 configuration and enable it
  esp_wifi_sta_wpa2_ent_enable();

  // 3. Connect to the network
  WiFi.begin(WIFI_SSID);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // WiFi.begin(WIFI_SSID, WIFI_USERNAME, WIFI_PASS);
  // Serial.print("Connecting WiFi");
  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(300);
  //   Serial.print(".");
  // }
  // Serial.println();
  // Serial.print("Connected, IP: ");
  // Serial.println(WiFi.localIP());

  pinMode(reedPin, INPUT);

  doorQueue = xQueueCreate(10, PAYLOAD_MAX);
  xTaskCreatePinnedToCore(httpTask, "HTTP Task", 10000, NULL, 1, NULL, 1);

  Serial.println("[Door] ready");
}

void loop() {
  int state = digitalRead(reedPin);
  // LOW  = magnet detected → door closed / close
  // HIGH = no magnet       → door open   / open
  // Serial.println(state);

  if (state != lastState) {
    lastState = state;

    const char* stateStr = (state == LOW) ? "close" : "open";

    char payload[PAYLOAD_MAX];
    snprintf(payload, PAYLOAD_MAX, "{\"room\":\"%s\",\"state\":\"%s\"}", ROOM_ID, stateStr);

    Serial.println(payload);
    xQueueSend(doorQueue, &payload, 0);
  }

  delay(50);
}