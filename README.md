# 🚀 Galaxy Gate – Setup Guide

## ไฟล์ในระบบ

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | **หน้าเว็บหลัก** แสดงบน **ทีวีจอสัมผัส** (Start → Scan → Video → วนรอบ) — ทำงานครบจบในตัว |
| `HelloWorld-v4.mp4` | วิดีโออินโทรที่เล่นหลังสแกนเสร็จ |
| `sound-1.mp3` / `sound-2.mp3` | เสียงตอนวาร์ป / ตอนสแกน |
| `websocket-server.js` | Bridge server เชื่อม ทีวี → จอ LED (**เส้นทางเสริม** สำหรับงานจริง ปัจจุบันปิดอยู่) |

> หมายเหตุ: เวอร์ชันก่อนหน้าเคยแยกเป็น `ipad-interface.html` และ `led-display.html`
> ปัจจุบัน **รวมเข้าเป็น `index.html` ไฟล์เดียว** แล้ว

---

## วิธีติดตั้งและรัน

### 1. เปิดหน้าเว็บหลัก (ใช้งานปกติ)
`index.html` ทำงานแบบ standalone ได้เลย ไม่จำเป็นต้องมี server

วิธีที่ง่ายสุด: เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์ตรง ๆ
หรือ serve ผ่าน local web server (แนะนำ เพราะวิดีโอ/เสียงโหลดได้ชัวร์กว่า):
```bash
npx http-server . -p 8080
# แล้วเปิด http://localhost:8080/
```

### 2. เปิดบนทีวีจอสัมผัส (อุปกรณ์หน้างาน)
1. เปิดเบราว์เซอร์บนทีวีจอสัมผัส ไปที่ URL ของหน้าเว็บ
   - ใช้งานจริงออนไลน์: `https://kagenokami9.github.io/ssr/`
   - หรือ local: `http://<IP-ของเครื่อง-server>:8080/`
2. สั่งให้เต็มจอ (fullscreen)
3. ใช้งานด้วยการ **แตะจอ** ตามขั้นตอน (Start → วางมือสแกน) — flow เหมือนเดิม เพราะทีวีเป็นจอสัมผัส

### 3. (เสริม) รัน WebSocket server เมื่อจะต่อจอ LED จริง
เส้นทางนี้ปิดอยู่โดยค่าเริ่มต้น (`DEMO_MODE = true`) รันเฉพาะเมื่อจะให้จอ LED เล่นเอฟเฟกต์พร้อมกัน:
```bash
npm install ws
node websocket-server.js
```
เซิร์ฟเวอร์จะ listen:
- `ws://localhost:3001`  — WebSocket
- `http://localhost:3000` — HTTP REST API

จากนั้นเปิดหน้าจอ LED ที่ลงทะเบียน role `led_display` บนคอมพิวเตอร์ที่ต่อกับจอ LED (เต็มจอ)

---

## 🔌 จุดที่ต้องแก้ไขเพื่อใช้งานจริง (ต่อจอ LED)

แก้ที่ออบเจกต์ `CONFIG` ใน `index.html` (ประมาณบรรทัด 1080):

```js
const CONFIG = {
  WS_URL:      'ws://192.168.1.100:3001',              // ← IP ของเครื่อง server
  LED_API_URL: 'http://192.168.1.100:3000/api/trigger',// ← HTTP fallback
  USE_WEBSOCKET: true,
  DEMO_MODE:   false,   // ← ตั้งเป็น false เมื่อพร้อมต่อ server/LED จริง
};
```

- `DEMO_MODE = true` (ค่าเริ่มต้น) = ไม่ยิง network จริง แค่จำลอง — เว็บก็เล่นครบวงจรได้
- ตั้ง `DEMO_MODE = false` และแก้ `WS_URL` / `LED_API_URL` เป็น IP จริง เมื่อจะใช้กับจอ LED

---

## Network Setup

```
ทีวี (จอสัมผัส) ──── WiFi ────► [Server: 192.168.1.100]
                                     │
                              WebSocket :3001
                                     │
                              [คอมพิวเตอร์ + จอ LED]
```

ทุกอุปกรณ์ต้องอยู่ใน WiFi network เดียวกัน

---

## ทดสอบ LED effect โดยไม่ต้องมีทีวี
เปิด `index.html` บนคอมแล้วทำครบขั้นตอน (Start → แตะสแกน) เพื่อทริกเกอร์สัญญาณได้เลย

---

## API Reference

### WebSocket Messages

| Direction | Type | Payload |
|---|---|---|
| Client → Server | `REGISTER` | `{ role: 'led_display' \| 'ipad' }` (role `ipad` = อุปกรณ์ทีวี) |
| ทีวี → Server | `SCAN_COMPLETE` | `{ timestamp }` |
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

## พัฒนาโดย นายธารินทร ไผ่ล้อมทำเล
