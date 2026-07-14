import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Astronaut, SceneStage, WIDTH, HEIGHT, easeOut, easeInOut } from "../components/RobotKit";
import { SpaceEffectsOverlay } from "./SpaceEffectsOverlay";

// ฉากนักบินอวกาศ 7 วิ แบ่งเป็น 3 ช็อต (2.5 + 2 + 2.5) แต่ละช็อตขึ้นข้อความ
// และนักบินขยับ "ลูกเล่นไม่เหมือนกัน" ตามโจทย์ vedo.md
// พื้นหลังอวกาศ + เอฟเฟกต์เดิม (SceneStage + SpaceEffectsOverlay) คงอยู่ตลอดทั้ง 3 ช็อต

// fade ที่ขอบช็อต ~0.25 วิ ให้รอยตัดระหว่างช็อตเนียน (คำนวณจาก frame ภายในช็อต)
const edgeFade = (frame: number, dur: number, fps: number) => {
  const edge = 0.25 * fps;
  const fadeIn = interpolate(frame, [0, edge], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [dur - edge, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return fadeIn * fadeOut;
};

// กล่องข้อความร่วม: วางโซนล่างของจอ (lower third) จัดกึ่งกลาง เผื่อ wrap 2 บรรทัด
// รับ opacity/scale/translateY จากช็อต เพื่อให้ลูกเล่นข้อความต่างกันได้
const Caption = ({
  text,
  glow,
  opacity,
  scale,
  translateY,
}: {
  text: string;
  glow: string;
  opacity: number;
  scale: number;
  translateY: number;
}) => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 130,
      paddingLeft: 90,
      paddingRight: 90,
    }}
  >
    <div
      style={{
        maxWidth: 1560,
        textAlign: "center",
        fontFamily: "sans-serif",
        fontWeight: 800,
        fontSize: 78,
        lineHeight: 1.28,
        color: "#ffffff",
        opacity,
        scale,
        translate: `0px ${translateY}px`,
        textShadow: `0 0 26px ${glow}, 0 4px 18px rgba(0,0,0,0.6)`,
      }}
    >
      {text}
    </div>
  </AbsoluteFill>
);

// เลเยอร์นักบินในแต่ละช็อต — svg แยก (ไม่มี SvgDefs เพราะ SceneStage พื้นหลังจัดให้แล้ว)
const AstronautLayer = ({ opacity, children }: { opacity: number; children: React.ReactNode }) => (
  <AbsoluteFill style={{ opacity }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {children}
    </svg>
  </AbsoluteFill>
);

// ── ช็อต 1: ลอยเข้าจากขวา + บ๊อบเบา ๆ (zero-g) + โบกมือทักทาย ──
const ShotOne = ({ dur }: { dur: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / dur;

  // ลอยเข้าจากขวาเข้าตำแหน่งกลาง แล้วบ๊อบเบา ๆ
  const enter = easeOut(interpolate(p, [0, 0.45], [0, 1], { extrapolateRight: "clamp" }));
  const x = interpolate(enter, [0, 1], [1560, 960]);
  const bob = Math.sin(frame * 0.06 * rate * (fps / 30) + 1) * 16;
  // แขนขวายกขึ้นโบกทักทาย
  const armRight = -78 + Math.sin(frame * 0.3 * rate) * 34;

  const opacity = edgeFade(frame, dur, fps);
  const capIn = interpolate(p, [0.12, 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capY = interpolate(capIn, [0, 1], [42, 0]);

  return (
    <>
      <AstronautLayer opacity={opacity}>
        <Astronaut x={x} y={470} scale={1.05} bob={bob} armRightAngle={armRight} armLeftAngle={10} legAngle={10} />
      </AstronautLayer>
      <Caption
        text="สัมผัสนวัตกรรมการศึกษาใหม่แห่งอนาคต"
        glow="#3fd2ff"
        opacity={opacity * capIn}
        scale={1}
        translateY={capY}
      />
    </>
  );
};

// ── ช็อต 2: ตีลังกาหมุน 360° พร้อม thruster พุ่งข้ามจอ ──
const ShotTwo = ({ dur }: { dur: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / dur;

  // พุ่งจากซ้ายไปขวาพร้อมหมุนครบรอบ
  const travel = easeInOut(p);
  const x = interpolate(travel, [0, 1], [520, 1400]);
  const y = 480 + Math.sin(p * Math.PI) * -40; // โค้งขึ้นเล็กน้อยกลางจอ
  const rotation = interpolate(p, [0, 1], [0, 360]);
  const flicker = 0.6 + 0.4 * Math.sin(frame * 1.4 * rate);

  const opacity = edgeFade(frame, dur, fps);
  // ข้อความเด้ง pop เข้า (scale overshoot)
  const capP = interpolate(p, [0.1, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capScale = interpolate(easeOut(capP), [0, 1], [0.6, 1]);

  return (
    <>
      <AstronautLayer opacity={opacity}>
        {/* เปลวไอพ่นด้านหลังทิศตรงข้ามการเคลื่อนที่ */}
        <g transform={`translate(${x} ${y}) rotate(${rotation})`} opacity={flicker}>
          <ellipse cx={-150} cy={90} rx={70} ry={22} fill="#ff9a3f" opacity={0.7} />
          <ellipse cx={-120} cy={90} rx={44} ry={14} fill="#ffe27a" opacity={0.9} />
        </g>
        <Astronaut
          x={x}
          y={y}
          scale={0.95}
          rotation={rotation}
          armLeftAngle={26}
          armRightAngle={-26}
          legAngle={-8}
        />
      </AstronautLayer>
      <Caption
        text="การศึกษาวิทยาศาสตร์สู่โลกอนาคต"
        glow="#39ff88"
        opacity={opacity * capP}
        scale={capScale}
        translateY={0}
      />
    </>
  );
};

// ── ช็อต 3: zoom เข้าหากล้อง (scale โตขึ้น) กางแขนออก reach out ──
const ShotThree = ({ dur }: { dur: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = 30 / fps;
  const p = frame / dur;

  // ค่อย ๆ ซูมเข้าหากล้อง + ส่ายเบา ๆ
  const scale = interpolate(easeOut(p), [0, 1], [0.72, 1.5]);
  const y = interpolate(easeOut(p), [0, 1], [560, 470]);
  const sway = Math.sin(frame * 0.08 * rate) * 3;
  const bob = Math.sin(frame * 0.05 * rate) * 10;
  // กางแขนออกทั้งสองข้าง
  const spread = interpolate(easeOut(p), [0, 1], [0, 46]);

  const opacity = edgeFade(frame, dur, fps);
  // ข้อความ reveal ตัวใหญ่ขึ้น + glow ค่อย ๆ แรงขึ้น
  const capP = interpolate(p, [0.15, 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capScale = interpolate(easeOut(capP), [0, 1], [0.86, 1.06]);

  return (
    <>
      <AstronautLayer opacity={opacity}>
        <Astronaut
          x={960}
          y={y}
          scale={scale}
          rotation={sway}
          bob={bob}
          armLeftAngle={spread}
          armRightAngle={-spread}
          legAngle={16}
        />
      </AstronautLayer>
      <Caption
        text="เปิดประสบการณ์การเรียนรู้เหนือจินตนาการ"
        glow="#b06bff"
        opacity={opacity * capP}
        scale={capScale}
        translateY={0}
      />
    </>
  );
};

export const AstronautScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = 30 / fps;
  const f = (sec: number) => Math.round(sec * fps);

  const SHOT1 = f(2.5);
  const SHOT2 = f(2);
  const SHOT3 = f(2.5);

  return (
    <AbsoluteFill style={{ backgroundColor: "#04050d" }}>
      {/* พื้นหลังอวกาศ + ดาว (คงอยู่ตลอด และเป็นตัวจัด <defs> ให้ทุกช็อต) */}
      <SceneStage frame={frame} rate={rate} starSeed={9}>
        {null}
      </SceneStage>
      {/* เอฟเฟกต์เดิม: ดาวตก/เนบิวลา/UFO/ฝุ่นดาว */}
      <SpaceEffectsOverlay />

      <Sequence durationInFrames={SHOT1}>
        <ShotOne dur={SHOT1} />
      </Sequence>
      <Sequence from={SHOT1} durationInFrames={SHOT2}>
        <ShotTwo dur={SHOT2} />
      </Sequence>
      <Sequence from={SHOT1 + SHOT2} durationInFrames={SHOT3}>
        <ShotThree dur={SHOT3} />
      </Sequence>
    </AbsoluteFill>
  );
};
