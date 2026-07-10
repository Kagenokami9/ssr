import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Robot, SceneStage, SubjectLabel } from "../components/RobotKit";

const ROBOT_X = 600;
const GROUND_Y = 800;
const MON_X = 1000; // ขอบซ้ายจอ
const MON_Y = 430; // ขอบบนจอ
const MON_W = 620;
const MON_H = 380;

// easing เด้งเกินนิดๆ ให้โค้ด "ป๊อป" ออกจากจอ
const popEase = Easing.bezier(0.34, 1.56, 0.64, 1);

// โค้ดที่จะเด้งออกมาทีละชิ้น (ไล่เวลาเหลื่อมกัน)
const SNIPPETS = [
  { text: "const robot = ai()", color: "#8be9fd" },
  { text: "while (true) {", color: "#50fa7b" },
  { text: "console.log('hi')", color: "#f1fa8c" },
  { text: "return <App />", color: "#ff79c6" },
  { text: "} // ✓ done", color: "#bd93f9" },
];

// บรรทัดโค้ดปลอมในจอ (แถบสีจำลอง syntax) ให้จอดูมีโค้ดรันอยู่
const ScreenCode = ({ frame, rate }: { frame: number; rate: number }) => {
  const rows = [
    { w: 220, c: "#ff79c6", indent: 0 },
    { w: 320, c: "#8be9fd", indent: 40 },
    { w: 180, c: "#50fa7b", indent: 40 },
    { w: 280, c: "#f1fa8c", indent: 80 },
    { w: 140, c: "#bd93f9", indent: 40 },
    { w: 240, c: "#8be9fd", indent: 0 },
  ];
  // เคอร์เซอร์กระพริบท้ายบรรทัดที่กำลังพิมพ์
  const blink = Math.sin(frame * 0.5 * rate) > 0 ? 1 : 0.15;
  return (
    <g>
      {rows.map((r, i) => (
        <rect
          key={i}
          x={MON_X + 30 + r.indent}
          y={MON_Y + 46 + i * 46}
          width={r.w}
          height={16}
          rx={4}
          fill={r.c}
          opacity={0.85}
        />
      ))}
      <rect
        x={MON_X + 30 + rows[3].indent + rows[3].w + 12}
        y={MON_Y + 46 + 3 * 46 - 2}
        width={12}
        height={20}
        fill="#ffffff"
        opacity={blink}
      />
    </g>
  );
};

export const ComputerScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  // แขนหุ่นขยับเร็วๆ เหมือนกำลังพิมพ์คีย์บอร์ด
  const typePhase = frame * 1.6 * rate;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={23}>
      <SubjectLabel text="คอมพิวเตอร์" color="#3fd2ff" p={p} />

      {/* แสงเรืองจากจอสาดออกมา */}
      <ellipse
        cx={MON_X + MON_W / 2}
        cy={MON_Y + MON_H / 2}
        rx={420}
        ry={320}
        fill="#3fd2ff"
        opacity={0.1}
        style={{ filter: "url(#smokeBlur)" }}
      />

      {/* หุ่นยนต์โปรแกรมเมอร์ (แขนขยับพิมพ์) */}
      <Robot x={ROBOT_X} y={GROUND_Y} scale={0.85} legPhase={0} armPhase={typePhase} />

      {/* โต๊ะ + คีย์บอร์ดหน้าหุ่น */}
      <rect x={ROBOT_X - 130} y={GROUND_Y + 40} width={360} height={20} rx={6} fill="#2f4a6b" />
      <rect x={ROBOT_X - 90} y={GROUND_Y + 28} width={240} height={16} rx={4} fill="#3d5f86" />

      {/* จอมอนิเตอร์ */}
      <rect x={MON_X - 16} y={MON_Y - 16} width={MON_W + 32} height={MON_H + 32} rx={18} fill="#0c1524" stroke="#28406a" strokeWidth={3} />
      <rect x={MON_X} y={MON_Y} width={MON_W} height={MON_H} rx={8} fill="#071018" />
      {/* แถบหัวหน้าต่าง editor */}
      <rect x={MON_X} y={MON_Y} width={MON_W} height={30} rx={8} fill="#12203a" />
      <circle cx={MON_X + 20} cy={MON_Y + 15} r={5} fill="#ff5f56" />
      <circle cx={MON_X + 40} cy={MON_Y + 15} r={5} fill="#ffbd2e" />
      <circle cx={MON_X + 60} cy={MON_Y + 15} r={5} fill="#27c93f" />
      {/* ขาตั้งจอ */}
      <rect x={MON_X + MON_W / 2 - 30} y={MON_Y + MON_H + 16} width={60} height={40} fill="#28406a" />
      <rect x={MON_X + MON_W / 2 - 90} y={MON_Y + MON_H + 56} width={180} height={16} rx={6} fill="#28406a" />

      <ScreenCode frame={frame} rate={rate} />

      {/* โค้ดเด้งออกจากขอบบนจอ ลอยขึ้นทางขวาบน — ไล่เวลาเหลื่อมกันแล้ววนซ้ำ */}
      {SNIPPETS.map((snip, i) => {
        const seg = 1 / SNIPPETS.length;
        // เหลื่อมเวลาเริ่มของแต่ละชิ้น แล้ว mod ให้วนตลอดฉาก
        const localP = (p + (1 - i * seg)) % 1;
        const popIn = popEase(
          interpolate(localP, [0, 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        );
        const fade = interpolate(localP, [0.7, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const rise = interpolate(localP, [0, 1], [0, -150]);
        const drift = interpolate(localP, [0, 1], [0, 90]);
        const scale = 0.4 + 0.6 * popIn;
        const opacity = popIn * fade;
        const bx = MON_X + 120 + drift;
        const by = MON_Y - 10 + rise;
        return (
          <g key={i} transform={`translate(${bx} ${by}) scale(${scale})`} opacity={opacity}>
            <rect x={-14} y={-30} width={snip.text.length * 15 + 28} height={44} rx={10} fill="#0d1b30" stroke={snip.color} strokeWidth={2} opacity={0.95} />
            <text
              x={0}
              y={0}
              fontSize={26}
              fontWeight={700}
              fill={snip.color}
              style={{ fontFamily: "monospace" }}
            >
              {snip.text}
            </text>
          </g>
        );
      })}
    </SceneStage>
  );
};
