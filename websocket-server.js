/**
 * ═══════════════════════════════════════════════════════════════
 *  GALAXY GATE – WebSocket Bridge Server
 *  websocket-server.js
 * ───────────────────────────────────────────────────────────────
 *  Bridges:
 *    iPad (ipad-interface.html) → Server → LED (led-display.html)
 *
 *  SETUP:
 *    npm install ws
 *    node websocket-server.js
 *
 *  PORTS:
 *    :3001  WebSocket  (WS client connections)
 *    :3000  HTTP API   (REST fallback + health check)
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const WebSocket = require('ws');

/* ────────────────────────────────────────────────
   CONFIG – แก้ไขค่าเหล่านี้ตามระบบจริง
──────────────────────────────────────────────── */
const CONFIG = {
  WS_PORT:   3001,
  HTTP_PORT: 3000,
  CORS_ORIGIN: '*',         // เปลี่ยนเป็น IP จริงในงาน production
  LOG_VERBOSE: true,
};

/* ────────────────────────────────────────────────
   CLIENT REGISTRY
   เก็บ WebSocket แยกเป็น iPad vs LED display
──────────────────────────────────────────────── */
const clients = {
  ipad:    new Set(),   // iPad scanner instances
  led:     new Set(),   // LED display instances
  unknown: new Set(),   // Not yet registered
};

function registerClient(ws, role) {
  // Remove from unknown first
  clients.unknown.delete(ws);
  clients.ipad.delete(ws);
  clients.led.delete(ws);

  if (role === 'led_display') {
    clients.led.add(ws);
    log(`LED display registered (total: ${clients.led.size})`);
  } else {
    clients.ipad.add(ws);
    log(`iPad registered (total: ${clients.ipad.size})`);
  }
}

function removeClient(ws) {
  clients.ipad.delete(ws);
  clients.led.delete(ws);
  clients.unknown.delete(ws);
}

/* ────────────────────────────────────────────────
   WEBSOCKET SERVER
──────────────────────────────────────────────── */
const wss = new WebSocket.Server({ port: CONFIG.WS_PORT });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  log(`New connection from ${ip}`);
  clients.unknown.add(ws);

  // Send welcome
  ws.send(JSON.stringify({ type: 'WELCOME', server: 'GALAXY_GATE', version: '1.0' }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      log(`[WARN] Non-JSON message from ${ip}`);
      return;
    }

    if (CONFIG.LOG_VERBOSE) log(`[MSG] ${ip} → ${JSON.stringify(msg)}`);

    switch (msg.type) {

      /* ── Client announces its role ── */
      case 'REGISTER':
        registerClient(ws, msg.role);
        ws.send(JSON.stringify({ type: 'REGISTERED', role: msg.role }));
        break;

      /* ─────────────────────────────────────────────
         🔌 SCAN_COMPLETE  – main trigger
            iPad sends this → server broadcasts to all LED displays
      ─────────────────────────────────────────────── */
      case 'SCAN_COMPLETE': {
        const payload = {
          type:      'SCAN_COMPLETE',
          timestamp: msg.timestamp || Date.now(),
          source:    'ipad',
        };

        log(`🚀 SCAN COMPLETE → broadcasting to ${clients.led.size} LED display(s)`);

        let sent = 0;
        clients.led.forEach(led => {
          if (led.readyState === WebSocket.OPEN) {
            led.send(JSON.stringify(payload));
            sent++;
          }
        });

        // Acknowledge back to iPad
        ws.send(JSON.stringify({ type: 'ACK', event: 'SCAN_COMPLETE', deliveredTo: sent }));
        break;
      }

      /* ── Generic ping/pong ── */
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
        break;

      default:
        log(`[WARN] Unknown message type: ${msg.type}`);
    }
  });

  ws.on('close', () => {
    log(`Connection closed from ${ip}`);
    removeClient(ws);
  });

  ws.on('error', (err) => {
    log(`[ERROR] ${ip}: ${err.message}`);
    removeClient(ws);
  });
});

wss.on('listening', () => {
  log(`✅  WebSocket server running on ws://localhost:${CONFIG.WS_PORT}`);
});

/* ────────────────────────────────────────────────
   HTTP SERVER (REST API + health check)
   🔌 iPad ใช้ fallback นี้ถ้า WebSocket ไม่ได้เปิด
──────────────────────────────────────────────── */
const httpServer = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', CONFIG.CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  /* GET /health – server status */
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status:   'ok',
      uptime:   process.uptime(),
      clients: {
        ipad: clients.ipad.size,
        led:  clients.led.size,
      },
    }));
    return;
  }

  /* POST /api/trigger – HTTP fallback from iPad */
  if (req.method === 'POST' && req.url === '/api/trigger') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch { payload = {}; }

      log(`[HTTP] /api/trigger received: ${JSON.stringify(payload)}`);

      // Broadcast to all LED displays
      const broadcast = {
        type:      'SCAN_COMPLETE',
        timestamp: payload.timestamp || Date.now(),
        source:    'http',
      };

      let sent = 0;
      clients.led.forEach(led => {
        if (led.readyState === WebSocket.OPEN) {
          led.send(JSON.stringify(broadcast));
          sent++;
        }
      });

      log(`🚀 HTTP trigger → broadcast to ${sent} LED display(s)`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, deliveredTo: sent }));
    });
    return;
  }

  /* 404 */
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(CONFIG.HTTP_PORT, () => {
  log(`✅  HTTP API server running on http://localhost:${CONFIG.HTTP_PORT}`);
  log(`      GET  /health       – status check`);
  log(`      POST /api/trigger  – fire LED effect`);
});

/* ────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────── */
function log(msg) {
  const ts = new Date().toISOString().replace('T',' ').split('.')[0];
  console.log(`[${ts}] ${msg}`);
}

process.on('SIGTERM', () => { log('Shutting down...'); process.exit(0); });
process.on('SIGINT',  () => { log('Shutting down...'); process.exit(0); });
