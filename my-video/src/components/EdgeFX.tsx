import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { WIDTH, HEIGHT, mulberry32 } from "./RobotKit";

// เอฟเฟครอบขอบจอ — เรืองแสง + อนุภาคลอยไล่ขอบ ให้ดูตื่นเต้นตลอดคลิป
// โทนธีมเดียวกับสแกน/อวกาศ (ไซแอน/ม่วง/ทอง), เบลนด์ screen, opacity ต่ำ ไม่บังเนื้อหากลางจอ
const EDGE = 150; // ความหนาแถบเรืองแสงขอบ

export const EdgeFX = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = 30 / fps;

  // จังหวะเต้นของแสงขอบ
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.04 * rate);
  const pulse2 = 0.5 + 0.5 * Math.sin(frame * 0.04 * rate + Math.PI);
  const baseOpacity = 0.28 + 0.14 * pulse;

  // อนุภาคลอยไล่ไปตามเส้นรอบขอบจอ
  const random = mulberry32(321);
  const particles = Array.from({ length: 46 }).map(() => {
    const perim = 2 * (WIDTH + HEIGHT);
    const offset = random() * perim;
    const speed = 40 + random() * 90; // px ต่อวินาที
    const size = 2 + random() * 4;
    const hue = random();
    return { offset, speed, size, hue };
  });

  // แปลงระยะตามเส้นรอบรูป → พิกัด x,y (เดินตามขอบ ตามเข็มนาฬิกา)
  const perimToXY = (d: number) => {
    const perim = 2 * (WIDTH + HEIGHT);
    let t = ((d % perim) + perim) % perim;
    if (t < WIDTH) return { x: t, y: 8 };
    t -= WIDTH;
    if (t < HEIGHT) return { x: WIDTH - 8, y: t };
    t -= HEIGHT;
    if (t < WIDTH) return { x: WIDTH - t, y: HEIGHT - 8 };
    t -= WIDTH;
    return { x: 8, y: HEIGHT - t };
  };

  const timeSec = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="edgeTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="edgeBottom" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7b2fff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#7b2fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="edgeLeft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7b2fff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#7b2fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="edgeRight" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* แถบเรืองแสง 4 ขอบ เต้นสลับจังหวะ */}
        <rect x={0} y={0} width={WIDTH} height={EDGE} fill="url(#edgeTop)" opacity={baseOpacity} />
        <rect x={0} y={HEIGHT - EDGE} width={WIDTH} height={EDGE} fill="url(#edgeBottom)" opacity={0.28 + 0.14 * pulse2} />
        <rect x={0} y={0} width={EDGE} height={HEIGHT} fill="url(#edgeLeft)" opacity={0.24 + 0.12 * pulse2} />
        <rect x={WIDTH - EDGE} y={0} width={EDGE} height={HEIGHT} fill="url(#edgeRight)" opacity={0.24 + 0.12 * pulse} />

        {/* อนุภาคลอยไล่ขอบ */}
        {particles.map((pt, i) => {
          const { x, y } = perimToXY(pt.offset + pt.speed * timeSec);
          const color = pt.hue > 0.66 ? "#ffb703" : pt.hue > 0.33 ? "#00f5ff" : "#b06bff";
          const tw = 0.5 + 0.5 * Math.sin(frame * 0.1 * rate + i);
          return (
            <circle key={i} cx={x} cy={y} r={pt.size} fill={color} opacity={0.35 + 0.5 * tw} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
