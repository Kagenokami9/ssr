import { AbsoluteFill, Easing, interpolate } from "remotion";

// ============================================================
// ค่าคงที่ขนาดฉาก (ตรงกับ Composition 1920x1080)
// ============================================================
export const WIDTH = 1920;
export const HEIGHT = 1080;

// ============================================================
// PRNG แบบกำหนดค่าได้ (deterministic) — ตำแหน่งดาว/ควันคงที่ทุกเฟรมที่เรนเดอร์
// ============================================================
export function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// Easing presets ที่ใช้ร่วมกันทุกฉาก
// ============================================================
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// ============================================================
// SvgDefs — gradient/filter ที่ทุกฉากต้องมีใน <defs> เพื่อให้ url(#..) ทำงาน
// ============================================================
export const SvgDefs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="55%" r="60%">
      <stop offset="0%" stopColor="#131634" />
      <stop offset="45%" stopColor="#0a0b1f" />
      <stop offset="100%" stopColor="#020208" />
    </radialGradient>
    <radialGradient id="robotBody" cx="40%" cy="25%" r="85%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="55%" stopColor="#dbe6f5" />
      <stop offset="100%" stopColor="#93a6bd" />
    </radialGradient>
    <filter id="smokeBlur" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>
);

// ============================================================
// Starfield — ฉากดาวพื้นหลัง (rate = 30/fps เพื่อคงความเร็วกระพริบเดิมที่จูนไว้ 30fps)
// ============================================================
export const Starfield = ({
  frame,
  rate = 1,
  seed = 7,
  count = 90,
}: {
  frame: number;
  rate?: number;
  seed?: number;
  count?: number;
}) => {
  const random = mulberry32(seed);
  const stars = Array.from({ length: count }).map((_, i) => {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const r = 1 + random() * 1.8;
    const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.12 * rate + i);
    return { x, y, r, twinkle };
  });
  return (
    <>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4f8ff" opacity={0.25 + 0.55 * s.twinkle} />
      ))}
    </>
  );
};

// ============================================================
// Robot — หุ่นยนต์ SVG เวกเตอร์ (ใช้ร่วมทุกฉาก)
// ============================================================
export const Robot = ({
  x,
  y,
  scale,
  legPhase,
  armPhase,
  squashX = 1,
  squashY = 1,
}: {
  x: number;
  y: number;
  scale: number;
  legPhase: number;
  armPhase: number;
  squashX?: number;
  squashY?: number;
}) => {
  const legSwing = Math.sin(legPhase) * 22;
  const armSwing = Math.sin(armPhase) * 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * squashX} ${scale * squashY})`}>
      <rect x={-34} y={40} width={26} height={90} rx={13} fill="#c7d2e0" transform={`translate(${legSwing} 0)`} />
      <rect x={8} y={40} width={26} height={90} rx={13} fill="#c7d2e0" transform={`translate(${-legSwing} 0)`} />
      <rect x={-46} y={-70} width={92} height={130} rx={26} fill="url(#robotBody)" />
      <circle cx={0} cy={-5} r={14} fill="#3fd2ff" opacity={0.9} />
      <rect
        x={-78}
        y={-55}
        width={24}
        height={80}
        rx={12}
        fill="#c7d2e0"
        transform={`rotate(${-14 + armSwing} -66 -15)`}
      />
      <rect
        x={54}
        y={-55}
        width={24}
        height={80}
        rx={12}
        fill="#c7d2e0"
        transform={`rotate(${14 - armSwing} 66 -15)`}
      />
      <circle cx={0} cy={-108} r={40} fill="url(#robotBody)" />
      <ellipse cx={8} cy={-112} rx={20} ry={13} fill="#2fb6ff" opacity={0.9} />
      <line x1={0} y1={-148} x2={0} y2={-166} stroke="#c7d2e0" strokeWidth={4} />
      <circle cx={0} cy={-170} r={6} fill="#ff5d5d" />
    </g>
  );
};

// ============================================================
// ExplosionParts — เศษหุ่นกระเด็นตอนระเบิด (p = 0..1)
// ============================================================
const EXPLOSION_PARTS = [
  { dx: -140, dy: -260, rot: -260, shape: <circle r={40} fill="#c7d2e0" /> },
  { dx: 40, dy: -180, rot: 200, shape: <rect x={-46} y={-65} width={92} height={130} rx={26} fill="#c7d2e0" /> },
  { dx: -220, dy: -60, rot: -320, shape: <rect x={-12} y={-40} width={24} height={80} rx={12} fill="#c7d2e0" /> },
  { dx: 230, dy: -40, rot: 300, shape: <rect x={-12} y={-40} width={24} height={80} rx={12} fill="#c7d2e0" /> },
  { dx: -160, dy: 140, rot: -180, shape: <rect x={-13} y={-45} width={26} height={90} rx={13} fill="#c7d2e0" /> },
  { dx: 170, dy: 160, rot: 220, shape: <rect x={-13} y={-45} width={26} height={90} rx={13} fill="#c7d2e0" /> },
];

export const ExplosionParts = ({ p, cx, cy }: { p: number; cx: number; cy: number }) => {
  const e = easeOut(p);
  return (
    <>
      {EXPLOSION_PARTS.map((part, i) => {
        const x = cx + part.dx * e;
        const y = cy + part.dy * e + 260 * p * p;
        const rot = part.rot * p;
        const opacity = interpolate(p, [0, 0.55, 1], [1, 1, 0]);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
            {part.shape}
          </g>
        );
      })}
    </>
  );
};

// ============================================================
// Smoke — กลุ่มควันฟุ้ง (p = 0..1). warm=true เริ่มโทนอุ่น, false เริ่มโทนขาว/เทา
// ============================================================
export const Smoke = ({
  p,
  cx,
  cy,
  seed = 99,
  count = 40,
  rise = 420,
  warm = true,
  endTone = [6, 8, 20],
}: {
  p: number;
  cx: number;
  cy: number;
  seed?: number;
  count?: number;
  rise?: number;
  warm?: boolean;
  // สีปลายทางที่ควันจะไล่ไปเมื่อ p→1 (default กรมท่าเข้มเพื่อกลืนพื้นหลังตอนระเบิด
  //  ส่งค่าเทาสว่างได้เมื่ออยากให้ควันคงเห็นชัด เช่น ควันจรวด)
  endTone?: [number, number, number];
}) => {
  const random = mulberry32(seed);
  const puffs = Array.from({ length: count }).map(() => {
    const angle = random() * Math.PI * 2;
    const dist = (140 + random() * 520) * easeOut(p);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist - rise * p;
    const r = (60 + random() * 160) * (0.4 + 1.4 * p);
    return { x, y, r };
  });

  // ไล่โทนจากสีเริ่มต้นไปเป็นสีปลายทาง
  const start = warm ? [180, 150, 140] : [210, 220, 235];
  const r = Math.round(interpolate(p, [0, 1], [start[0], endTone[0]]));
  const g = Math.round(interpolate(p, [0, 1], [start[1], endTone[1]]));
  const b = Math.round(interpolate(p, [0, 1], [start[2], endTone[2]]));
  const color = `rgb(${r},${g},${b})`;

  return (
    <>
      {puffs.map((puff, i) => (
        <circle
          key={i}
          cx={puff.x}
          cy={puff.y}
          r={puff.r}
          fill={color}
          opacity={interpolate(p, [0, 0.3, 1], [0, 0.55, 0.92])}
          filter="url(#smokeBlur)"
        />
      ))}
    </>
  );
};

// ============================================================
// Ufo — จานบิน (วาดที่จุด 0,0 ให้ผู้เรียกใช้ครอบ <g transform> เอง)
// ============================================================
export const Ufo = ({ scale = 1 }: { scale?: number }) => (
  <g transform={`scale(${scale})`}>
    <ellipse cx={0} cy={0} rx={80} ry={20} fill="#8fe9ff" />
    <ellipse cx={0} cy={-16} rx={40} ry={26} fill="#c8fff0" opacity={0.85} />
    <circle cx={-40} cy={4} r={7} fill="#fff29a" />
    <circle cx={0} cy={6} r={7} fill="#ff9adf" />
    <circle cx={40} cy={4} r={7} fill="#fff29a" />
  </g>
);

// ============================================================
// SceneStage — เวที SVG มาตรฐาน (พื้นหลังกรมท่า + ดาว + defs) ให้ทุกฉากใช้ร่วม
// ============================================================
export const SceneStage = ({
  frame,
  rate = 1,
  starSeed = 7,
  children,
}: {
  frame: number;
  rate?: number;
  starSeed?: number;
  children: React.ReactNode;
}) => (
  <AbsoluteFill style={{ backgroundColor: "#04050d" }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <SvgDefs />
      <rect width={WIDTH} height={HEIGHT} fill="url(#bgGlow)" />
      <Starfield frame={frame} rate={rate} seed={starSeed} count={70} />
      {children}
    </svg>
  </AbsoluteFill>
);

// ============================================================
// SubjectLabel — ป้ายชื่อวิชา เรืองแสง เด้งเข้าด้านบนจอ (ให้คนดูรู้ว่าฉากนี้คืออะไร)
// ============================================================
export const SubjectLabel = ({
  text,
  color,
  p,
}: {
  text: string;
  color: string;
  p: number;
}) => {
  // เด้งเข้าช่วงต้น จางออกช่วงท้าย
  const appear = interpolate(p, [0, 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const leave = interpolate(p, [0.85, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = appear * leave;
  const y = interpolate(appear, [0, 1], [-40, 0]);
  return (
    <g opacity={opacity} transform={`translate(0 ${y})`}>
      <text
        x={WIDTH / 2}
        y={150}
        textAnchor="middle"
        fontSize={78}
        fontWeight={800}
        fill={color}
        style={{ filter: `drop-shadow(0 0 26px ${color})`, fontFamily: "sans-serif" }}
      >
        {text}
      </text>
    </g>
  );
};
