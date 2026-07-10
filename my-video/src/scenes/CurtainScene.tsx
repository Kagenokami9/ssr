import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot, SceneStage, WIDTH, HEIGHT } from "../components/RobotKit";

const GROUND_Y = 780;
const FOLD_STEP = 80; // ระยะห่างรอยจีบผ้าม่าน

export const CurtainScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  // หุ่นเดินจากขอบซ้าย (นอกจอ) ไปทางขวา ดึงขอบนำม่านตามไปจนมิดจอ
  // ปลายทาง WIDTH+120 เผื่อ LEAD เพื่อให้ขอบม่านถึงขอบขวาจอพอดี (มิดจอ)
  const robotX = interpolate(p, [0.05, 0.95], [-40, WIDTH + 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // ขอบนำ (ขวา) ของม่านตามหลังหุ่น (LEAD) เพื่อให้เห็นแขนหุ่นยื่นไปจับขอบม่าน
  const LEAD = 80;
  const rightEdge = Math.min(WIDTH, Math.max(0, robotX - LEAD));

  // รอยจีบผ้าม่าน (อิงตำแหน่ง x สัมบูรณ์ให้จีบนิ่ง) วาดเฉพาะส่วนที่ถูกคลุมแล้ว
  const folds: React.ReactNode[] = [];
  for (let x = 0; x < WIDTH; x += FOLD_STEP) {
    if (x > rightEdge) continue;
    const shade = 0.5 + 0.5 * Math.sin((x / FOLD_STEP) * 1.7);
    folds.push(
      <rect
        key={x}
        x={x}
        y={0}
        width={FOLD_STEP}
        height={HEIGHT}
        fill="#000000"
        opacity={0.22 * shade}
      />,
    );
  }

  // ระดับมือทั้งสองข้างที่จับขอบม่าน (บน/ล่าง)
  const handTopY = GROUND_Y - 70;
  const handBotY = GROUND_Y + 20;
  // แขนกลยื่นจากไหล่หุ่นไปจับขอบนำม่าน (ทางซ้ายของหุ่น) — เริ่มจากขอบตัวหุ่น
  const armFromX = robotX - 24;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={3}>
      <defs>
        <linearGradient id="curtainRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a0d16" />
          <stop offset="45%" stopColor="#c81a25" />
          <stop offset="100%" stopColor="#8a0f18" />
        </linearGradient>
      </defs>

      {/* ผืนม่านสีแดง คลุมจากขอบซ้ายจอถึงขอบนำ */}
      <rect x={0} y={0} width={rightEdge} height={HEIGHT} fill="url(#curtainRed)" />
      {folds}
      {/* คิ้วม่านด้านบน (valance) */}
      <rect x={0} y={0} width={rightEdge} height={90} fill="#5e0a12" opacity={0.9} />
      {/* ขอบนำผ้าม่านด้านขวา เน้นเงา */}
      <rect x={Math.max(0, rightEdge - 26)} y={0} width={26} height={HEIGHT} fill="#000000" opacity={0.35} />

      {/* หุ่นเดินดึงม่าน (อยู่หน้าขอบนำ) — แขนหลักไม่แกว่ง (armPhase คงที่) */}
      <Robot
        x={robotX}
        y={GROUND_Y}
        scale={0.85}
        legPhase={frame * 0.9 * rate}
        armPhase={0}
      />

      {/* มือ 2 ข้างของหุ่นยื่นไปจับขอบนำม่าน แล้วออกแรงดึง */}
      <g stroke="#c7d2e0" strokeWidth={16} strokeLinecap="round">
        <line x1={armFromX} y1={handTopY} x2={rightEdge} y2={handTopY} />
        <line x1={armFromX} y1={handBotY} x2={rightEdge} y2={handBotY} />
      </g>
      {/* มือกล (หัวจับ) ที่ปลายแขนแตะขอบม่าน */}
      <circle cx={rightEdge} cy={handTopY} r={14} fill="#eef3fa" />
      <circle cx={rightEdge} cy={handBotY} r={14} fill="#eef3fa" />
    </SceneStage>
  );
};
