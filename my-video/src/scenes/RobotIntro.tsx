import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const WIDTH = 1920;
const HEIGHT = 1080;

const RUN_END = 75; // 2.5s @ 30fps
const CRASH_END = 90; // 3.0s
const TOTAL = 120; // 4.0s

const RUN_START_X = 260;
const CRASH_X = 1640;
const GROUND_Y = 760;

const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Deterministic PRNG so star/smoke positions stay stable across frame renders.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const Starfield = ({ frame }: { frame: number }) => {
  const random = mulberry32(7);
  const stars = Array.from({ length: 90 }).map((_, i) => {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const r = 1 + random() * 1.8;
    const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.12 + i);
    return { x, y, r, twinkle };
  });
  return (
    <>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4f8ff" opacity={0.25 + 0.55 * s.twinkle} />
      ))}
    </>
  );
};

const Robot = ({
  x,
  y,
  scale,
  legPhase,
  armPhase,
  squashX,
  squashY,
}: {
  x: number;
  y: number;
  scale: number;
  legPhase: number;
  armPhase: number;
  squashX: number;
  squashY: number;
}) => {
  const legSwing = Math.sin(legPhase) * 22;
  const armSwing = Math.sin(armPhase) * 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * squashX} ${scale * squashY})`}>
      <rect x={-34} y={40} width={26} height={90} rx={13} fill="#c7d2e0" transform={`translate(${legSwing} 0)`} />
      <rect x={8} y={40} width={26} height={90} rx={13} fill="#c7d2e0" transform={`translate(${-legSwing} 0)`} />
      <rect x={-46} y={-70} width={92} height={130} rx={26} fill="url(#robotBody)" />
      <circle cx={0} cy={-5} r={14} fill="#3fd2ff" opacity={0.9} />
      <rect
        x={-78}
        y={-55}
        width={24}
        height={80}
        rx={12}
        fill="#c7d2e0"
        transform={`rotate(${-14 + armSwing} -66 -15)`}
      />
      <rect
        x={54}
        y={-55}
        width={24}
        height={80}
        rx={12}
        fill="#c7d2e0"
        transform={`rotate(${14 - armSwing} 66 -15)`}
      />
      <circle cx={0} cy={-108} r={40} fill="url(#robotBody)" />
      <ellipse cx={8} cy={-112} rx={20} ry={13} fill="#2fb6ff" opacity={0.9} />
      <line x1={0} y1={-148} x2={0} y2={-166} stroke="#c7d2e0" strokeWidth={4} />
      <circle cx={0} cy={-170} r={6} fill="#ff5d5d" />
    </g>
  );
};

const EXPLOSION_PARTS = [
  { dx: -140, dy: -260, rot: -260, shape: <circle r={40} fill="#c7d2e0" /> },
  { dx: 40, dy: -180, rot: 200, shape: <rect x={-46} y={-65} width={92} height={130} rx={26} fill="#c7d2e0" /> },
  { dx: -220, dy: -60, rot: -320, shape: <rect x={-12} y={-40} width={24} height={80} rx={12} fill="#c7d2e0" /> },
  { dx: 230, dy: -40, rot: 300, shape: <rect x={-12} y={-40} width={24} height={80} rx={12} fill="#c7d2e0" /> },
  { dx: -160, dy: 140, rot: -180, shape: <rect x={-13} y={-45} width={26} height={90} rx={13} fill="#c7d2e0" /> },
  { dx: 170, dy: 160, rot: 220, shape: <rect x={-13} y={-45} width={26} height={90} rx={13} fill="#c7d2e0" /> },
];

const ExplosionParts = ({ p, cx, cy }: { p: number; cx: number; cy: number }) => {
  const e = easeOut(p);
  return (
    <>
      {EXPLOSION_PARTS.map((part, i) => {
        const x = cx + part.dx * e;
        const y = cy + part.dy * e + 260 * p * p;
        const rot = part.rot * p;
        const opacity = interpolate(p, [0, 0.55, 1], [1, 1, 0]);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
            {part.shape}
          </g>
        );
      })}
    </>
  );
};

const Smoke = ({ p, cx, cy }: { p: number; cx: number; cy: number }) => {
  const random = mulberry32(99);
  const puffs = Array.from({ length: 40 }).map(() => {
    const angle = random() * Math.PI * 2;
    const dist = (140 + random() * 520) * easeOut(p);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist - 420 * p;
    const r = (60 + random() * 160) * (0.4 + 1.4 * p);
    return { x, y, r };
  });

  // Blend from a warm explosion tone into the dark navy tone of the source video's background.
  const r = Math.round(interpolate(p, [0, 1], [180, 6]));
  const g = Math.round(interpolate(p, [0, 1], [150, 8]));
  const b = Math.round(interpolate(p, [0, 1], [140, 20]));
  const color = `rgb(${r},${g},${b})`;

  return (
    <>
      {puffs.map((puff, i) => (
        <circle
          key={i}
          cx={puff.x}
          cy={puff.y}
          r={puff.r}
          fill={color}
          opacity={interpolate(p, [0, 0.3, 1], [0, 0.55, 0.92])}
          filter="url(#smokeBlur)"
        />
      ))}
    </>
  );
};

export const RobotIntro = () => {
  const frame = useCurrentFrame();

  let content: React.ReactNode = null;
  let screenFade = 0;

  if (frame < RUN_END) {
    const p = frame / RUN_END;
    const x = RUN_START_X + (CRASH_X - RUN_START_X) * easeInOut(p);
    const bounce = Math.abs(Math.sin(frame * 0.5)) * 14;
    content = (
      <Robot
        x={x}
        y={GROUND_Y - bounce}
        scale={0.85}
        legPhase={frame * 0.9}
        armPhase={frame * 0.9 + Math.PI}
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
        legPhase={frame * 0.9}
        armPhase={frame * 0.9 + Math.PI}
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
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="55%" r="60%">
            <stop offset="0%" stopColor="#131634" />
            <stop offset="45%" stopColor="#0a0b1f" />
            <stop offset="100%" stopColor="#020208" />
          </radialGradient>
          <radialGradient id="robotBody" cx="40%" cy="25%" r="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#dbe6f5" />
            <stop offset="100%" stopColor="#93a6bd" />
          </radialGradient>
          <filter id="smokeBlur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#bgGlow)" />
        <Starfield frame={frame} />
        {content}
        <rect width={WIDTH} height={HEIGHT} fill="#05060f" opacity={screenFade} />
      </svg>
    </AbsoluteFill>
  );
};
