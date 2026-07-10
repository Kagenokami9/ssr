import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Smoke, SceneStage, SubjectLabel, mulberry32 } from "../components/RobotKit";

const PAD_X = 960;
const PAD_Y = 940;

const accel = Easing.bezier(0.5, 0, 0.9, 0.6); // ค่อยๆ เร่งขึ้น เหมือนจรวดออกตัว

// เปลวไฟท้ายจรวด กระพริบ
const Flame = ({ x, y, flick }: { x: number; y: number; flick: number }) => {
  const len = 70 + flick * 60;
  return (
    <g>
      <path d={`M ${x - 26} ${y} L ${x + 26} ${y} L ${x} ${y + len} Z`} fill="#ffd23f" opacity={0.95} />
      <path d={`M ${x - 16} ${y} L ${x + 16} ${y} L ${x} ${y + len * 0.7} Z`} fill="#ff7a1a" />
      <path d={`M ${x - 8} ${y} L ${x + 8} ${y} L ${x} ${y + len * 0.4} Z`} fill="#fff3c4" />
    </g>
  );
};

const Rocket = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    {/* ครีบ */}
    <path d="M -26 40 L -60 90 L -26 78 Z" fill="#ff5d5d" />
    <path d="M 26 40 L 60 90 L 26 78 Z" fill="#ff5d5d" />
    {/* ลำตัว */}
    <rect x={-28} y={-70} width={56} height={150} rx={26} fill="url(#robotBody)" />
    {/* หัวจรวด */}
    <path d="M -28 -60 Q 0 -140 28 -60 Z" fill="#ff5d5d" />
    {/* หน้าต่าง */}
    <circle cx={0} cy={-10} r={16} fill="#3fd2ff" stroke="#1b2a4a" strokeWidth={3} />
  </g>
);

export const ScienceScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  // 0-0.18 ตั้งลำสั่นสะเทือน จากนั้นทะยานขึ้น
  const liftP = interpolate(p, [0.18, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ry = interpolate(accel(liftP), [0, 1], [PAD_Y - 120, -360]);
  const shake = p < 0.18 ? Math.sin(frame * 1.4 * rate) * 6 : 0;
  const rx = PAD_X + shake;
  const flick = 0.5 + 0.5 * Math.sin(frame * 0.9 * rate);

  // ควันขยายตัวต่อเนื่องที่ฐานปล่อย (ซ้อนหลายชั้นให้ดูเยอะ)
  const smokeP = Math.min(p * 1.5, 1);

  return (
    <SceneStage frame={frame} rate={rate} starSeed={33}>
      <SubjectLabel text="วิทยาศาสตร์" color="#ffb703" p={p} />

      {/* ควันฐานปล่อย — สองชั้นให้ฟุ้งเยอะ ใช้โทนเทาสว่างให้ควันคงเห็นชัด (ไม่กลืนกับพื้นหลัง) */}
      <Smoke p={smokeP} cx={PAD_X - 40} cy={PAD_Y} seed={7} count={44} rise={120} warm={false} endTone={[150, 160, 180]} />
      <Smoke p={smokeP} cx={PAD_X + 60} cy={PAD_Y + 10} seed={71} count={44} rise={90} warm endTone={[170, 150, 140]} />

      <Flame x={rx} y={ry + 80} flick={flick} />
      <Rocket x={rx} y={ry} />

      {/* ประกายไอเสียเล็กๆ ปลิวจากฐาน */}
      {Array.from({ length: 18 }).map((_, i) => {
        const rnd = mulberry32(i + 200);
        const a = rnd() * Math.PI * 2;
        const d = (40 + rnd() * 300) * smokeP;
        return (
          <circle
            key={i}
            cx={PAD_X + Math.cos(a) * d}
            cy={PAD_Y + Math.sin(a) * d * 0.5}
            r={2 + rnd() * 4}
            fill="#ffd23f"
            opacity={(1 - smokeP) * 0.8}
          />
        );
      })}
    </SceneStage>
  );
};
