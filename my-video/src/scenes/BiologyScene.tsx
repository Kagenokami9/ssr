import { useCurrentFrame, useVideoConfig } from "remotion";
import { Robot, SceneStage, SubjectLabel, WIDTH } from "../components/RobotKit";

// จุดอ้างอิงของฉาก (พิกัดบนเวที 1920x1080)
const BED_X = 560; // ขอบซ้ายเตียงผ่าตัด
const BED_W = 900; // ความกว้างเตียง
const BED_Y = 720; // ระดับผิวเตียง (คนไข้นอนบนนี้)
const HEART_X = 1020; // ตำแหน่งช่องผ่าตัด/หัวใจกลางลำตัว
const HEART_Y = 690;
const ROBOT_X = 1360; // หุ่นยืนด้านขวาของเตียง

// รูปหัวใจ (path พื้นฐาน) ให้ผู้เรียกครอบ transform เอง
const Heart = ({ scale, opacity = 1 }: { scale: number; opacity?: number }) => (
  <g transform={`scale(${scale})`} opacity={opacity}>
    <path
      d="M 0 26 C -34 -6 -70 6 -70 -20 C -70 -44 -40 -50 0 -14 C 40 -50 70 -44 70 -20 C 70 6 34 -6 0 26 Z"
      fill="#ff4d6d"
    />
    <path
      d="M -30 -20 q 30 -18 60 0"
      fill="none"
      stroke="#ffd6de"
      strokeWidth={5}
      opacity={0.7}
    />
  </g>
);

// เส้นคลื่นหัวใจ (ECG) วิ่งด้านบนจอ — สร้างจุดเป็น pattern เต้นแล้วเลื่อนไปทางซ้าย
const EcgLine = ({ frame, rate }: { frame: number; rate: number }) => {
  const midY = 300;
  const span = 720; // ความกว้างเส้น ECG
  const startX = WIDTH / 2 - span / 2;
  const scroll = (frame * 6 * rate) % 180; // ระยะเลื่อน pattern
  const pts: string[] = [];
  for (let x = 0; x <= span; x += 6) {
    // ตำแหน่งภายใน 1 คาบ (180px) หัก scroll ให้ pattern วิ่ง
    const t = (x + scroll) % 180;
    let y = 0;
    if (t > 70 && t < 78) y = -6; // Q เล็ก
    else if (t >= 78 && t < 86) y = -70; // R สูง (spike)
    else if (t >= 86 && t < 94) y = 34; // S ต่ำ
    else if (t >= 100 && t < 118) y = -18; // T นูน
    pts.push(`${startX + x},${midY + y}`);
  }
  return (
    <polyline
      points={pts.join(" ")}
      fill="none"
      stroke="#39ff9e"
      strokeWidth={4}
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ filter: "drop-shadow(0 0 8px #39ff9e)" }}
    />
  );
};

// เครื่องมือผ่าตัด (scalpel) ถือโดยแขนกลของหุ่น
const Scalpel = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y}) rotate(35)`}>
    {/* ด้ามจับ */}
    <rect x={-6} y={-70} width={12} height={70} rx={4} fill="#9fb2c9" />
    {/* ใบมีด */}
    <path d="M -6 0 L 6 0 L 2 34 L -6 30 Z" fill="#e8f1ff" stroke="#b8c8dd" strokeWidth={1.5} />
  </g>
);

export const BiologyScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  // หัวใจเต้นเป็นจังหวะ (สองจังหวะต่อรอบ ให้รู้สึกมีชีวิต)
  const beat = 1 + 0.09 * Math.abs(Math.sin(frame * 0.32 * rate));
  // มีดผ่าตัดขยับขึ้นลงเบาๆ เหมือนกำลังลงมือ
  const knifeBob = Math.sin(frame * 0.5 * rate) * 10;
  // แขนหุ่นยื่นเข้าหาช่องผ่าตัด (คงที่ ไม่แกว่งสลับ) — ตั้ง armPhase ให้แขนชี้ลง
  const armPhase = -Math.PI / 2;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={17}>
      <SubjectLabel text="ชีววิทยา" color="#39ff9e" p={p} />

      {/* ไฟส่องผ่าตัดจากด้านบน (แสงวงนุ่ม) */}
      <ellipse
        cx={HEART_X}
        cy={HEART_Y}
        rx={360}
        ry={260}
        fill="#39ff9e"
        opacity={0.08}
        style={{ filter: "url(#smokeBlur)" }}
      />

      <EcgLine frame={frame} rate={rate} />

      {/* เตียงผ่าตัด */}
      <rect x={BED_X} y={BED_Y} width={BED_W} height={26} rx={8} fill="#2f4a6b" />
      <rect x={BED_X} y={BED_Y + 26} width={BED_W} height={120} fill="#1c2f47" />
      <rect x={BED_X + 40} y={BED_Y + 146} width={22} height={90} fill="#16233a" />
      <rect x={BED_X + BED_W - 62} y={BED_Y + 146} width={22} height={90} fill="#16233a" />

      {/* ร่างคนไข้นอนบนเตียง (ผ้าคลุมสีฟ้าอ่อน + หัว) */}
      <ellipse cx={HEART_X - 30} cy={BED_Y - 6} rx={340} ry={54} fill="#cfe0f2" opacity={0.95} />
      <circle cx={BED_X + 70} cy={BED_Y - 20} r={44} fill="#f0d9c4" />

      {/* ช่องผ่าตัดเปิดให้เห็นหัวใจเต้น */}
      <ellipse cx={HEART_X} cy={HEART_Y} rx={92} ry={58} fill="#5c1622" />
      <ellipse cx={HEART_X} cy={HEART_Y} rx={92} ry={58} fill="none" stroke="#ff8fa3" strokeWidth={3} opacity={0.6} />
      <g transform={`translate(${HEART_X} ${HEART_Y})`}>
        <Heart scale={beat} />
      </g>

      {/* หุ่นยนต์ศัลยแพทย์ยืนด้านขวาของเตียง */}
      <Robot x={ROBOT_X} y={BED_Y - 40} scale={0.8} legPhase={0} armPhase={armPhase} />

      {/* มือหุ่นถือ scalpel ทำท่าผ่าตัดเหนือช่องผ่าตัด */}
      <Scalpel x={HEART_X + 120} y={HEART_Y - 40 + knifeBob} />
    </SceneStage>
  );
};
