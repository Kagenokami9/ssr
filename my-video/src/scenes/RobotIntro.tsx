import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  WIDTH,
  HEIGHT,
  easeInOut,
  Robot,
  Starfield,
  Smoke,
  ExplosionParts,
  SvgDefs,
} from "../components/RobotKit";

const RUN_START_X = 260;
const CRASH_X = 1640;
const GROUND_Y = 760;

export const RobotIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // rate = 30/fps → คงความเร็วการแกว่งขา/แขน/ดาวที่จูนไว้ตอน 30fps ให้เท่าเดิมทุก fps
  const rate = 30 / fps;

  // จังหวะเวลา (วินาที × fps) แทนเลขเฟรมตายตัว
  const RUN_END = 2.5 * fps;
  const CRASH_END = 3.0 * fps;
  const TOTAL = 4.0 * fps;

  let content: React.ReactNode = null;
  let screenFade = 0;

  if (frame < RUN_END) {
    const p = frame / RUN_END;
    const x = RUN_START_X + (CRASH_X - RUN_START_X) * easeInOut(p);
    const bounce = Math.abs(Math.sin(frame * 0.5 * rate)) * 14;
    content = (
      <Robot
        x={x}
        y={GROUND_Y - bounce}
        scale={0.85}
        legPhase={frame * 0.9 * rate}
        armPhase={frame * 0.9 * rate + Math.PI}
        squashX={1}
        squashY={1}
      />
    );
  } else if (frame < CRASH_END) {
    const p = (frame - RUN_END) / (CRASH_END - RUN_END);
    const x = CRASH_X + 40 * p;
    const squashX = interpolate(p, [0, 0.6, 1], [1, 1.35, 1.1]);
    const squashY = interpolate(p, [0, 0.6, 1], [1, 0.7, 0.9]);
    content = (
      <Robot
        x={x}
        y={GROUND_Y}
        scale={0.85}
        legPhase={frame * 0.9 * rate}
        armPhase={frame * 0.9 * rate + Math.PI}
        squashX={squashX}
        squashY={squashY}
      />
    );
  } else {
    const p = (frame - CRASH_END) / (TOTAL - CRASH_END);
    const flash = interpolate(p, [0, 0.15, 0.4], [0, 1, 0], { extrapolateRight: "clamp" });
    const cx = CRASH_X;
    const cy = GROUND_Y - 40;
    content = (
      <>
        <circle
          cx={cx}
          cy={cy}
          r={interpolate(p, [0, 0.4], [20, 340], { extrapolateRight: "clamp" })}
          fill="#ffd58a"
          opacity={flash * 0.8}
          filter="url(#smokeBlur)"
        />
        <ExplosionParts p={p} cx={cx} cy={cy} />
        <Smoke p={p} cx={cx} cy={cy} />
      </>
    );
    screenFade = interpolate(p, [0.55, 1], [0, 0.7], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#04050d" }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />
        <rect width={WIDTH} height={HEIGHT} fill="url(#bgGlow)" />
        <Starfield frame={frame} rate={rate} />
        {content}
        <rect width={WIDTH} height={HEIGHT} fill="#05060f" opacity={screenFade} />
      </svg>
    </AbsoluteFill>
  );
};
