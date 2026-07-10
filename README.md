# 🚀 Galaxy Gate – Setup Guide

## ไฟล์ในระบบ

| ไฟล์ | หน้าที่ |
|---|---|
| `ipad-interface.html` | หน้าแสดงบน iPad (Start → Scan → Complete) |
| `led-display.html` | หน้าแสดงบนจอ LED (space effects) |
| `websocket-server.js` | Bridge server เชื่อม iPad → LED |

---

## วิธีติดตั้งและรัน

### 1. ติดตั้ง Node.js dependencies
```bash
npm install ws
```

### 2. รัน WebSocket server
```bash
node websocket-server.js
```
เซิร์ฟเวอร์จะ listen:
- `ws://localhost:3001`  — WebSocket
- `http://localhost:3000` — HTTP REST API

### 3. เปิด LED Display บนคอมพิวเตอร์ที่ต่อกับจอ LED
เปิดไฟล์ `led-display.html` ด้วย browser เต็มจอ (F11)

### 4. เปิด iPad Interface
เปิดไฟล์ `ipad-interface.html` บน iPad Safari หรือ serve ผ่าน local web server

---

## 🔌 จุดที่ต้องแก้ไขเพื่อใช้งานจริง

### A. แก้ IP ใน `ipad-interface.html`
```js
const CONFIG = {
  WS_URL:      'ws://192.168.1.100:3001',        // ← IP ของคอมพิวเตอร์ server
  LED_API_URL: 'http://192.168.1.100:3000/api/trigger',
  DEMO_MODE:   false,  // ← ตั้งเป็น false เมื่อพร้อม
};
```

### B. แก้ IP ใน `led-display.html`
```js
const CONFIG = {
  WS_URL:    'ws://192.168.1.100:3001',  // ← IP เดียวกับ server
  LOGO_TEXT: 'ชื่องานของคุณ',             // ← เปลี่ยนชื่องาน
  LOGO_SUB:  'IDENTITY CONFIRMED',
};
```

### C. ใส่โลโก้งานจริง (ใน `led-display.html`)
```html
<!-- แทนที่ข้อความ LOGO_TEXT ด้วย <img> -->
<div id="logo-wrap">
  <img src="your-logo.png" style="width: 400px; filter: drop-shadow(0 0 40px #00f5ff)">
  <div class="logo-sub">IDENTITY CONFIRMED</div>
</div>
```

---

## Network Setup

```
iPad ──── WiFi ────► [Server: 192.168.1.100]
                           │
                    WebSocket :3001
                           │
                    [คอมพิวเตอร์ + จอ LED]
                    led-display.html
```

ทุกอุปกรณ์ต้องอยู่ใน WiFi network เดียวกัน

---

## Serve ไฟล์ HTML แบบง่าย

```bash
# ติดตั้ง http-server (ครั้งเดียว)
npm install -g http-server

# รันจากโฟลเดอร์ไฟล์
http-server . -p 8080

# เปิดบน iPad: http://192.168.1.100:8080/ipad-interface.html
# เปิดบนคอม:  http://localhost:8080/led-display.html
```

---

## ทดสอบ LED effect โดยไม่ต้องมี iPad
กด **SPACE** บนหน้า `led-display.html` เพื่อ trigger effect ได้ทันที

---

## API Reference

### WebSocket Messages

| Direction | Type | Payload |
|---|---|---|
| Client → Server | `REGISTER` | `{ role: 'led_display' \| 'ipad' }` |
| iPad → Server | `SCAN_COMPLETE` | `{ timestamp }` |
| Server → LED | `SCAN_COMPLETE` | `{ type, timestamp, source }` |
| Any → Server | `PING` | – |

### HTTP Endpoints

```
GET  /health       → { status, uptime, clients }
POST /api/trigger  → fires LED effect (fallback)
```
---

# ลิ้งค์เปิดงานสัปดาห์วิทยาศาสตร์ 

```
 https://kagenokami9.github.io/ssr/
```