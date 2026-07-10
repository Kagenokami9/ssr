import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { WIDTH, HEIGHT, mulberry32, easeOut, easeInOut, Ufo } from "../components/RobotKit";

// Times are seconds into this 11s overlay window (local timeline).
const SHOOTING_STARS = [
  { start: 0.4, x: 1750, y: 140, len: 260, hue: "#8cf6ff" },
  { start: 2.1, x: 220, y: 620, len: 220, hue: "#d6a4ff" },
  { start: 4.0, x: 1600, y: 860, len: 300, hue: "#ffffff" },
  { start: 6.2, x: 300, y: 160, len: 240, hue: "#89ffca" },
  { start: 8.4, x: 1800, y: 700, len: 260, hue: "#fff1a6" },
  { start: 9.8, x: 150, y: 900, len: 220, hue: "#75b9ff" },
];

const ShootingStar = ({
  frame,
  fps,
  startSec,
  x,
  y,
  len,
  hue,
}: {
  frame: number;
  fps: number;
  startSec: number;
  x: number;
  y: number;
  len: number;
  hue: string;
}) => {
  const localFrame = frame - startSec * fps;
  const durationFrames = 0.8 * fps;
  if (localFrame < 0 || localFrame > durationFrames) return null;
  const p = localFrame / durationFrames;
  const e = easeOut(p);
  const dx = x - 640 * e;
  const dy = y + 220 * e;
  const opacity = Math.sin(Math.PI * p);
  return (
    <g opacity={opacity} style={{ mixBlendMode: "screen" }}>
      <line x1={dx} y1={dy} x2={dx + len} y2={dy - len * 0.32} stroke={hue} strokeWidth={5} strokeLinecap="round" />
      <line
        x1={dx + 14}
        y1={dy - 4}
        x2={dx + len + 90}
        y2={dy - len * 0.32 - 32}
        stroke="#ffffff"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.85}
      />
    </g>
  );
};

const NebulaGlow = ({ frame, rate }: { frame: number; rate: number }) => {
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.02 * rate);
  return (
    <>
      <circle cx={280} cy={220} r={260 + 20 * pulse} fill="#5a4fd9" opacity={0.1 + 0.05 * pulse} style={{ mixBlendMode: "screen" }} />
      <circle
        cx={1680}
        cy={880}
        r={300 + 24 * pulse}
        fill="#2f7dd6"
        opacity={0.09 + 0.05 * (1 - pulse)}
        style={{ mixBlendMode: "screen" }}
      />
    </>
  );
};

const SpaceDust = ({ frame, rate }: { frame: number; rate: number }) => {
  const random = mulberry32(555);
  const dust = Array.from({ length: 46 }).map((_, i) => {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const r = 1 + random() * 2.6;
    const speed = 0.4 + random() * 0.6;
    const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.05 * rate * speed + i);
    return { x, y, r, twinkle };
  });
  return (
    <>
      {dust.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#bff7ff" opacity={0.06 + 0.16 * d.twinkle} style={{ mixBlendMode: "screen" }} />
      ))}
    </>
  );
};

const LensFlare = ({ frame, rate }: { frame: number; rate: number }) => {
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.03 * rate);
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={0.16 + 0.08 * pulse}>
      <circle cx={1780} cy={120} r={140} fill="#fff6d8" />
      <circle cx={1780} cy={120} r={280} fill="#fff6d8" opacity={0.4} />
      <line x1={1780} y1={120} x2={200} y2={640} stroke="#fff6d8" strokeWidth={2} opacity={0.3} />
    </g>
  );
};

// Alien flyby: subtle, distant, timed to sit between the two title cards rather than
// synced to a hand-raise (the source footage has no such gesture at 1s sampling).
const UFO_START = 4.6;
const UFO_END = 6.6;

const UfoFlyby = ({ frame, fps }: { frame: number; fps: number }) => {
  const startFrame = UFO_START * fps;
  const endFrame = UFO_END * fps;
  if (frame < startFrame || frame > endFrame) return null;
  const p = (frame - startFrame) / (endFrame - startFrame);
  const e = easeInOut(p);
  const x = 1780 - 1560 * e;
  const y = 190 + Math.sin(p * Math.PI * 2) * 18;
  const opacity = Math.sin(Math.PI * p);
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity * 0.85}>
      <Ufo />
    </g>
  );
};

export const SpaceEffectsOverlay = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = 30 / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <NebulaGlow frame={frame} rate={rate} />
        <SpaceDust frame={frame} rate={rate} />
        <LensFlare frame={frame} rate={rate} />
        {SHOOTING_STARS.map((s, i) => (
          <ShootingStar key={i} frame={frame} fps={fps} startSec={s.start} x={s.x} y={s.y} len={s.len} hue={s.hue} />
        ))}
        <UfoFlyby frame={frame} fps={fps} />
      </svg>
    </AbsoluteFill>
  );
};
