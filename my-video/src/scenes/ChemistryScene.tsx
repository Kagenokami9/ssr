import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot, Smoke, SceneStage, SubjectLabel, mulberry32, easeOut } from "../components/RobotKit";

const ROBOT_X = 720;
const GROUND_Y = 760;
const FLASK_X = 1200;
const FLASK_Y = 720;

// สีสารเคมีสดใสสำหรับละอองระเบิด
const CHEM_HUES = ["#39ff88", "#ff4fd8", "#ffd23f", "#3fd2ff", "#b06bff"];

// ฟองสารเคมีที่ปุดขึ้นในขวดก่อนระเบิด
const Bubbles = ({ p }: { p: number }) => {
  const random = mulberry32(21);
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => {
        const phase = (p * 3 + random()) % 1;
        const bx = FLASK_X + (random() - 0.5) * 60;
        const by = FLASK_Y - 20 - phase * 90;
        const r = 4 + random() * 7 * (1 - phase);
        return <circle key={i} cx={bx} cy={by} r={r} fill="#8affc0" opacity={0.5 * (1 - phase)} />;
      })}
    </>
  );
};

// ละอองสารเคมีกระเด็นสาดใส่หุ่น
const Splash = ({ p }: { p: number }) => {
  const random = mulberry32(88);
  const e = easeOut(p);
  return (
    <>
      {Array.from({ length: 46 }).map((_, i) => {
        // สาดจากปากขวดพุ่งไปทางหุ่น (ซ้าย) และกระจายขึ้น
        const angle = Math.PI * (0.6 + random() * 0.8); // ประมาณทิศซ้าย-บน
        const dist = (120 + random() * 620) * e;
        const x = FLASK_X + Math.cos(angle) * dist;
        const y = FLASK_Y - 60 + Math.sin(angle) * dist + 260 * p * p;
        const r = (5 + random() * 12) * (1 - p * 0.5);
        const hue = CHEM_HUES[i % CHEM_HUES.length];
        return (
          <circle key={i} cx={x} cy={y} r={r} fill={hue} opacity={interpolate(p, [0, 0.6, 1], [1, 0.9, 0])} />
        );
      })}
    </>
  );
};

const Flask = ({ shake }: { shake: number }) => (
  <g transform={`translate(${FLASK_X + shake} ${FLASK_Y})`}>
    {/* คอขวด */}
    <rect x={-12} y={-70} width={24} height={60} fill="#cfe6ff" opacity={0.5} />
    {/* ตัวขวดทรงกรวย (Erlenmeyer) */}
    <path d="M -12 -14 L -70 90 L 70 90 L 12 -14 Z" fill="#cfe6ff" opacity={0.35} stroke="#9fd0ff" strokeWidth={3} />
    {/* ของเหลวข้างใน */}
    <path d="M -46 40 L -70 90 L 70 90 L 46 40 Z" fill="#39ff88" opacity={0.8} />
    <ellipse cx={0} cy={40} rx={46} ry={8} fill="#7dffb2" opacity={0.9} />
  </g>
);

export const ChemistryScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  const EXPLODE_AT = 0.42;
  const exploded = p >= EXPLODE_AT;
  const ep = exploded ? (p - EXPLODE_AT) / (1 - EXPLODE_AT) : 0;

  // ขวดสั่นก่อนระเบิด
  const shake = exploded ? 0 : Math.sin(frame * 0.9 * rate) * (p / EXPLODE_AT) * 10;
  // หุ่นเอนถอยหลังตอนโดนระเบิด
  const robotTilt = exploded ? interpolate(ep, [0, 0.3, 1], [0, -16, -6]) : 0;
  const robotX = ROBOT_X - (exploded ? interpolate(ep, [0, 0.3, 1], [0, 40, 26]) : 0);
  const flash = exploded ? interpolate(ep, [0, 0.12, 0.4], [0, 1, 0], { extrapolateRight: "clamp" }) : 0;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={12}>
      <SubjectLabel text="เคมี" color="#39ff88" p={p} />

      <g transform={`rotate(${robotTilt} ${robotX} ${GROUND_Y})`}>
        <Robot
          x={robotX}
          y={GROUND_Y}
          scale={0.85}
          legPhase={0}
          armPhase={frame * 0.6 * rate}
        />
      </g>

      {!exploded && (
        <>
          <Flask shake={shake} />
          <Bubbles p={p} />
        </>
      )}

      {exploded && (
        <>
          <circle
            cx={FLASK_X - 40}
            cy={FLASK_Y - 20}
            r={interpolate(ep, [0, 0.4], [20, 300], { extrapolateRight: "clamp" })}
            fill="#eaffef"
            opacity={flash * 0.75}
            filter="url(#smokeBlur)"
          />
          <Splash p={ep} />
          <Smoke p={ep} cx={FLASK_X - 60} cy={FLASK_Y - 20} seed={44} count={26} rise={300} warm={false} />
        </>
      )}
    </SceneStage>
  );
};
