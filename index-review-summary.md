# สรุปผลตรวจ `index.html` เทียบกับ `README (1).md`

วันที่ตรวจ: 2026-07-01

## ภาพรวม

อ่าน `README (1).md` แล้วพบว่าเอกสารอธิบายระบบ WebSocket Bridge Server:

- iPad ส่งคำสั่ง `SCAN_COMPLETE`
- Server รับที่ WebSocket port `3001`
- Server broadcast ต่อไปยัง LED display
- มี HTTP fallback ที่ `POST /api/trigger` port `3000`
- มี health check ที่ `GET /health`

ตรวจ `index.html` แล้วหน้า UI หลักเปิดได้และ render หน้าแรกได้ปกติทั้ง desktop และหน้าจอแคบ แต่การเชื่อมต่อจริงกับ server ยังไม่ทำงานในค่า config ปัจจุบัน เพราะเปิด `DEMO_MODE: true`

## สิ่งที่ทดสอบแล้ว

1. ตรวจ syntax ของ JavaScript ใน `index.html`
   - ผล: ผ่าน

2. ตรวจ syntax ของ `websocket-server.js`
   - คำสั่ง: `node --check websocket-server.js`
   - ผล: ผ่าน

3. ตรวจ dependency `ws`
   - ผล: มีติดตั้งอยู่ใน environment นี้

4. รัน `websocket-server.js`
   - ผล: เปิด server ได้ที่:
     - `ws://localhost:3001`
     - `http://localhost:3000`

5. ทดสอบ `GET /health`
   - ผล: ตอบกลับ `{"status":"ok", ...}`

6. ทดสอบ WebSocket flow แบบจำลอง
   - LED จำลองส่ง `REGISTER` role `led_display`
   - iPad จำลองส่ง `REGISTER` role `ipad`
   - iPad จำลองส่ง `SCAN_COMPLETE`
   - ผล: LED ได้รับ `SCAN_COMPLETE` และ iPad ได้รับ `ACK` พร้อม `deliveredTo: 1`

7. ทดสอบ HTTP fallback
   - ส่ง `POST /api/trigger`
   - ผล: LED จำลองได้รับ `SCAN_COMPLETE` และ HTTP response เป็น `{"ok":true,"deliveredTo":1}`

8. เปิด `index.html` ด้วย Firefox headless
   - ผล: หน้าแรก render ได้ปกติ

## Bug / จุดที่ต้องแก้ก่อนใช้งานจริง

### 1. `index.html` ยังอยู่ใน DEMO MODE

ตำแหน่ง: `index.html` บรรทัด 736

```js
DEMO_MODE: true
```

ผลกระทบ:

- หน้าเว็บเล่น animation ได้ แต่ไม่เชื่อม WebSocket
- ไม่ส่ง HTTP fallback
- เมื่อ scan เสร็จจะขึ้นสถานะ `DEMO MODE`
- LED จริงจะไม่ถูก trigger

ถ้าจะใช้งานจริงต้องเปลี่ยนเป็น:

```js
DEMO_MODE: false
```

### 2. URL ถูก hardcode เป็น `192.168.1.100`

ตำแหน่ง: `index.html` บรรทัด 731-732

```js
WS_URL:      'ws://192.168.1.100:3001'
LED_API_URL: 'http://192.168.1.100:3000/api/trigger'
```

ผลกระทบ:

- ใช้ได้เฉพาะเมื่อเครื่อง server ใช้ IP นี้จริง
- ถ้าทดสอบบนเครื่องเดียวกันควรเป็น `localhost` หรือ `127.0.0.1`
- ถ้าใช้ iPad จริง ต้องเปลี่ยนเป็น IP ของเครื่องที่รัน `websocket-server.js`

### 3. `index.html` ไม่ส่ง `REGISTER` role `ipad`

ตำแหน่งเกี่ยวข้อง: `index.html` บรรทัด 1078-1084

ตอนเปิด WebSocket มีแค่เชื่อมต่อ แต่ไม่ได้ส่ง:

```json
{ "type": "REGISTER", "role": "ipad" }
```

ผลกระทบ:

- ไม่ตรงกับ flow ใน `README (1).md`
- `/health` จะไม่เห็นจำนวน iPad จริง
- server จะเก็บ client ไว้ในกลุ่ม `unknown`
- ปัจจุบัน `SCAN_COMPLETE` ยังส่งผ่านได้ เพราะ server ไม่บังคับ role แต่ถือว่า implementation ยังไม่ครบตามเอกสาร

### 4. หน้า iPad แสดง success โดยไม่รอ ACK จาก server

ตำแหน่ง: `index.html` บรรทัด 1048-1052

เมื่อ WebSocket เปิดอยู่ โค้ดส่ง `SCAN_COMPLETE` แล้วตั้งสถานะ `SIGNAL SENT` ทันที:

```js
ws.send(JSON.stringify({ type: 'SCAN_COMPLETE', ...payload }));
setDot('connected', 'SIGNAL SENT ✓');
return;
```

ผลกระทบ:

- ถ้าไม่มี LED ต่ออยู่ server จะ ACK กลับ `deliveredTo: 0`
- แต่หน้า iPad ยังแสดงว่าส่งสำเร็จ
- ผู้ใช้จะเข้าใจผิดว่า LED ได้รับแล้ว

ควรเพิ่ม `ws.onmessage` เพื่ออ่าน `ACK` และเช็ค `deliveredTo`

### 5. ถ้า port ถูกใช้หรือเปิดไม่ได้ server จะ crash

ตอนทดสอบใน sandbox พบ error `listen EPERM` แล้ว process crash เพราะ `wss` ไม่มี error handler สำหรับกรณี listen ไม่สำเร็จ

ผลกระทบ:

- ถ้า port 3001/3000 ถูกใช้ หรือ permission/network มีปัญหา server จะปิดทันที
- ไม่มีข้อความ error แบบควบคุมได้สำหรับ operator

ควรเพิ่ม error handler ให้ WebSocket server และ HTTP server

### 6. เอกสาร setup อื่นใน repo ใช้ชื่อ `ipad-interface.html` แต่ไฟล์จริงคือ `index.html`

พบใน `README.md` แต่ไฟล์ใน repo ไม่มี `ipad-interface.html`

ผลกระทบ:

- คนติดตั้งตามเอกสารอาจเปิดไฟล์ผิดหรือหาไฟล์ไม่เจอ
- ควรแก้เอกสารให้ใช้ `index.html` หรือ rename/copy file ให้ตรงกัน

## สรุปสถานะ

`index.html` ใช้งานเป็นหน้า animation demo ได้ และ server/backend ตาม `README (1).md` ทำงานได้จากการทดสอบจริง แต่ระบบ end-to-end จาก `index.html` ไป LED ยังไม่พร้อมใช้งานจริงในค่า config ปัจจุบัน เพราะ `DEMO_MODE` เปิดอยู่ และหน้า iPad ยังไม่ `REGISTER` ตาม flow ที่ README ระบุ

ข้อแก้ไขขั้นต่ำก่อนใช้งานจริง:

1. เปลี่ยน `DEMO_MODE` เป็น `false` (ตอนนี้อยู่ช่วงทดลองใช้ true / โค้ดอยู่บรรทัดที่ 736)
2. ตั้ง `WS_URL` และ `LED_API_URL` ให้ตรงกับ IP เครื่อง server
3. เพิ่มการส่ง `REGISTER` role `ipad` เมื่อ WebSocket เปิด
4. เพิ่มการอ่าน `ACK` เพื่อแสดงผลสำเร็จ/ล้มเหลวตามจำนวน LED ที่รับจริง
