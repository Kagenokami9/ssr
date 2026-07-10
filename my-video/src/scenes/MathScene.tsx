import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Robot, SceneStage, SubjectLabel } from "../components/RobotKit";

const ROBOT_X = 760;
const GROUND_Y = 760;
const BUBBLE_X = 1200;
const BUBBLE_Y = 360;

// สูตรที่จะเด้งออกมาทีละอันในลูกโป่งความคิด
const FORMULAS = ["a² + b² = c²", "E = mc²", "∫ f(x) dx"];

// easing เด้งเกินนิดๆ ให้สูตร "ป๊อป" ออกมา
const popEase = Easing.bezier(0.34, 1.56, 0.64, 1);

// จุดฟองไล่จากหัวหุ่นขึ้นไปลูกโป่ง
const ThoughtDots = () => (
  <>
    <circle cx={ROBOT_X + 120} cy={GROUND_Y - 210} r={12} fill="#dbe6f5" opacity={0.5} />
    <circle cx={ROBOT_X + 220} cy={GROUND_Y - 300} r={18} fill="#dbe6f5" opacity={0.6} />
    <circle cx={ROBOT_X + 330} cy={GROUND_Y - 400} r={26} fill="#dbe6f5" opacity={0.7} />
  </>
);

// ลูกโป่งความคิด (กลุ่มวงกลมซ้อน)
const Cloud = () => {
  const blobs = [
    { x: -180, y: 20, r: 90 },
    { x: -70, y: -40, r: 110 },
    { x: 70, y: -50, r: 115 },
    { x: 190, y: 10, r: 95 },
    { x: 60, y: 70, r: 100 },
    { x: -80, y: 75, r: 95 },
  ];
  return (
    <g>
      {blobs.map((b, i) => (
        <circle key={i} cx={BUBBLE_X + b.x} cy={BUBBLE_Y + b.y} r={b.r} fill="#f2f6ff" opacity={0.95} />
      ))}
    </g>
  );
};

export const MathScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  // หุ่นเอียงหัวคิด + แขนขยับเบาๆ
  const headTilt = Math.sin(frame * 0.12 * rate) * 4;

  // แบ่งเวลาเป็นช่วงเท่าๆ กันตามจำนวนสูตร แต่ละช่วงสูตรจะป๊อปเข้า-ออก
  const seg = 1 / FORMULAS.length;
  const idx = Math.min(Math.floor(p / seg), FORMULAS.length - 1);
  const localP = (p - idx * seg) / seg;
  const popIn = popEase(interpolate(localP, [0, 0.28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const popOut = interpolate(localP, [0.82, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const formulaScale = 0.2 + 0.8 * popIn;
  const formulaOpacity = popIn * popOut;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={5}>
      <SubjectLabel text="คณิตศาสตร์" color="#5aa9ff" p={p} />

      <g transform={`rotate(${headTilt} ${ROBOT_X} ${GROUND_Y - 170})`}>
        <Robot x={ROBOT_X} y={GROUND_Y} scale={0.85} legPhase={0} armPhase={frame * 0.5 * rate} />
      </g>

      <ThoughtDots />
      <Cloud />

      <g
        transform={`translate(${BUBBLE_X} ${BUBBLE_Y}) scale(${formulaScale})`}
        opacity={formulaOpacity}
      >
        <text
          x={0}
          y={16}
          textAnchor="middle"
          fontSize={64}
          fontWeight={800}
          fill="#1b2a4a"
          style={{ fontFamily: "sans-serif" }}
        >
          {FORMULAS[idx]}
        </text>
      </g>
    </SceneStage>
  );
};
