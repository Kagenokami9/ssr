# GALAXY GATE -- WebSocket Bridge Server

> เอกสารอธิบายการทำงานของ `websocket-server.js`

## ภาพรวม

Server ตัวนี้ทำหน้าที่เป็น **ตัวกลาง (Bridge)** ระหว่าง

``` text
iPad
   │
   │ ส่งคำสั่ง
   ▼
WebSocket Server
   │
   │ กระจายคำสั่ง
   ▼
LED Display ทุกจอ
```

เปรียบเทียบง่าย ๆ

-   iPad = คนกดรีโมต
-   Server = ศูนย์ควบคุม
-   LED = ทีวีหลายเครื่อง

## เมื่อเปิด Server

รัน

``` bash
node websocket-server.js
```

Server จะเปิดบริการ 2 ส่วนพร้อมกัน

  Service     Port   หน้าที่
  ----------- ------ --------------------------------
  WebSocket   3001   รับการเชื่อมต่อจาก iPad และ LED
  HTTP API    3000   Health Check และ REST Fallback

------------------------------------------------------------------------

## ลำดับการทำงาน

### 1. เปิด Server

เริ่ม WebSocket Server และ HTTP Server

### 2. iPad เชื่อมต่อ

เชื่อมต่อมายัง WebSocket Server และถูกเก็บไว้ใน `clients.unknown`

### 3. LED เชื่อมต่อ

LED ทุกจอเชื่อมต่อเข้ามาและเริ่มต้นอยู่ใน `clients.unknown`

### 4. REGISTER

แต่ละ Client ส่งข้อความ REGISTER เพื่อบอกบทบาทของตัวเอง

-   iPad → `clients.ipad`
-   LED → `clients.led`

### 5. สแกนมือเสร็จ

เมื่อ iPad สแกนมือเสร็จ จะส่ง

``` json
{
  "type": "SCAN_COMPLETE"
}
```

มายัง Server

### 6. Server รับคำสั่ง

Server เข้าสู่ `case 'SCAN_COMPLETE'`

### 7. สร้าง Payload

Server เตรียมข้อมูลสำหรับส่งต่อไปยัง LED

### 8. Broadcast

Server วนส่งข้อมูลไปยัง LED ทุกจอที่เชื่อมต่ออยู่

### 9. LED เริ่มเอฟเฟกต์

LED ทุกจอได้รับ `SCAN_COMPLETE` และเริ่มเล่นเอฟเฟกต์พร้อมกัน

### 10. ACK

Server ส่ง ACK กลับไปยัง iPad พร้อมจำนวน LED ที่ได้รับข้อความ

------------------------------------------------------------------------

## HTTP Fallback

หาก WebSocket ใช้งานไม่ได้

    POST /api/trigger

Server จะ Broadcast ไปยัง LED เหมือนกับ WebSocket

------------------------------------------------------------------------

## Health Check

    GET /health

ใช้ตรวจสอบ

-   สถานะ Server
-   Uptime
-   จำนวน iPad
-   จำนวน LED

------------------------------------------------------------------------

## เมื่อลูกข่ายหลุด

เมื่อ Client ปิดหรืออินเทอร์เน็ตหลุด Server จะลบ Client ออกจากรายการทันที

------------------------------------------------------------------------

## Flow การทำงาน

``` text
เปิด Server
      │
      ▼
iPad เชื่อมต่อ
      │
      ▼
LED เชื่อมต่อ
      │
      ▼
REGISTER
      │
      ▼
Server แยกบทบาท
      │
      ▼
iPad ส่ง SCAN_COMPLETE
      │
      ▼
Server Broadcast
      │
      ▼
LED ทุกจอเริ่มเอฟเฟกต์
      │
      ▼
Server ส่ง ACK กลับ iPad
```

## สรุป

Server ตัวนี้ทำหน้าที่เป็นศูนย์กลางการสื่อสารระหว่าง iPad และ LED Display โดย iPad
ส่งคำสั่งเพียงครั้งเดียว แล้ว Server จะกระจายคำสั่งไปยัง LED ทุกจอ
ทำให้ทุกหน้าจอเริ่มเอฟเฟกต์ได้พร้อมกัน และยังมี HTTP API สำหรับสำรองในกรณีที่ WebSocket
ใช้งานไม่ได้
