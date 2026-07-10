import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot, SceneStage, WIDTH, HEIGHT } from "../components/RobotKit";

const GROUND_Y = 780;
const FOLD_STEP = 80; // ระยะห่างรอยจีบผ้าม่าน

export const CurtainScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  // หุ่นเดินจากขอบขวา (นอกจอ) ไปทางซ้าย ลากขอบม่านตามไป
  const robotX = interpolate(p, [0.05, 0.95], [WIDTH + 60, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // ขอบซ้ายของม่าน = ตำแหน่งหุ่น (หุ่นถือขอบนำ) ม่านคลุมจาก robotX ถึงขอบขวาจอ
  const leftEdge = Math.max(0, robotX - 40);

  // รอยจีบผ้าม่าน (อิงตำแหน่ง x สัมบูรณ์ให้จีบนิ่ง) วาดเฉพาะส่วนที่ถูกคลุมแล้ว
  const folds: React.ReactNode[] = [];
  for (let x = 0; x < WIDTH; x += FOLD_STEP) {
    if (x < leftEdge) continue;
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

  const curtainW = WIDTH - leftEdge;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={3}>
      <defs>
        <linearGradient id="curtainRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a0d16" />
          <stop offset="45%" stopColor="#c81a25" />
          <stop offset="100%" stopColor="#8a0f18" />
        </linearGradient>
      </defs>

      {/* ผืนม่านสีแดง */}
      <rect x={leftEdge} y={0} width={curtainW} height={HEIGHT} fill="url(#curtainRed)" />
      {folds}
      {/* คิ้วม่านด้านบน (valance) */}
      <rect x={leftEdge} y={0} width={curtainW} height={90} fill="#5e0a12" opacity={0.9} />
      {/* ขอบนำผ้าม่านด้านซ้าย เน้นเงา */}
      <rect x={leftEdge} y={0} width={26} height={HEIGHT} fill="#000000" opacity={0.35} />

      {/* หุ่นเดินลากม่าน (อยู่หน้าขอบนำ) */}
      <Robot
        x={robotX}
        y={GROUND_Y}
        scale={0.85}
        legPhase={frame * 0.9 * rate}
        armPhase={frame * 0.9 * rate + Math.PI}
      />
    </SceneStage>
  );
};
