import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Robot, Ufo, Smoke, ExplosionParts, SceneStage } from "../components/RobotKit";

const START_X = 1720;
const START_Y = 150;
const CRASH_X = 960;
const CRASH_Y = 560;

const accelIn = Easing.bezier(0.4, 0, 1, 0.5); // เร่งเข้าใส่จุดชน

export const UfoCrashScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / durationInFrames;

  const CRASH_AT = 0.6;
  const crashed = p >= CRASH_AT;

  // ช่วงบิน: จาก START → CRASH แบบเร่งความเร็ว + ส่ายเล็กน้อย
  const flyP = accelIn(interpolate(p, [0, CRASH_AT], [0, 1], { extrapolateRight: "clamp" }));
  const ux = interpolate(flyP, [0, 1], [START_X, CRASH_X]);
  const uy = interpolate(flyP, [0, 1], [START_Y, CRASH_Y]) + Math.sin(frame * 0.4 * rate) * 14;
  const tilt = interpolate(flyP, [0, 1], [-8, 18]);

  // ช่วงระเบิดหลังชน
  const ep = crashed ? (p - CRASH_AT) / (1 - CRASH_AT) : 0;
  const flash = crashed ? interpolate(ep, [0, 0.12, 0.4], [0, 1, 0], { extrapolateRight: "clamp" }) : 0;

  return (
    <SceneStage frame={frame} rate={rate} starSeed={9}>
      {!crashed && (
        <g transform={`translate(${ux} ${uy}) rotate(${tilt})`}>
          {/* หุ่น AI นั่งบน UFO */}
          <g transform="translate(0 -18) scale(0.42)">
            <Robot x={0} y={0} scale={1} legPhase={0} armPhase={Math.sin(frame * 0.3 * rate) * 2} />
          </g>
          <Ufo scale={1.1} />
          {/* ลำแสงพลังงานใต้จาน */}
          <path d={`M -60 14 L 60 14 L 30 90 L -30 90 Z`} fill="#8fe9ff" opacity={0.25} />
        </g>
      )}

      {crashed && (
        <>
          <circle
            cx={CRASH_X}
            cy={CRASH_Y}
            r={interpolate(ep, [0, 0.4], [30, 460], { extrapolateRight: "clamp" })}
            fill="#bfefff"
            opacity={flash * 0.85}
            filter="url(#smokeBlur)"
          />
          <ExplosionParts p={ep} cx={CRASH_X} cy={CRASH_Y} />
          <Smoke p={ep} cx={CRASH_X} cy={CRASH_Y} seed={57} count={40} rise={380} warm />
        </>
      )}
    </SceneStage>
  );
};
