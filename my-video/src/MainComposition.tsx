import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { RobotIntro } from "./scenes/RobotIntro";
import { MainScene } from "./scenes/MainScene";
import { ChemistryScene } from "./scenes/ChemistryScene";
import { MathScene } from "./scenes/MathScene";
import { ScienceScene } from "./scenes/ScienceScene";
import { UfoCrashScene } from "./scenes/UfoCrashScene";
import { CurtainScene } from "./scenes/CurtainScene";
import { EdgeFX } from "./components/EdgeFX";

// FPS เดียวใช้ทั้ง Root และคำนวณความยาว → เปลี่ยนที่เดียวได้ทั้งวิดีโอ
export const FPS = 60;
const f = (sec: number) => Math.round(sec * FPS);

// ความยาวแต่ละช่วง (วินาที) — คำนวณเป็นเฟรมจาก FPS ไม่ฮาร์ดโค้ดเลขเฟรม
const INTRO = f(4); // หุ่นวิ่งชน→ระเบิด
const VIDEO = f(20); // คลิปนักบินอวกาศ
const CHEMISTRY = f(3);
const MATH = f(3);
const SCIENCE = f(3);
const UFO = f(2.5);
const CURTAIN = f(2.5);
const TRANSITION = f(0.5);

// รวมความยาว sequence ทั้งหมด ลบส่วนที่ transition ซ้อนทับ (มี 6 รอยต่อ)
export const TOTAL_DURATION =
  INTRO + VIDEO + CHEMISTRY + MATH + SCIENCE + UFO + CURTAIN - 6 * TRANSITION;

const fadeTransition = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
);

export const MainComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO}>
          <RobotIntro />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={VIDEO}>
          <MainScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={CHEMISTRY}>
          <ChemistryScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={MATH}>
          <MathScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={SCIENCE}>
          <ScienceScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={UFO}>
          <UfoCrashScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={CURTAIN}>
          <CurtainScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* เอฟเฟครอบขอบจอ วางบนสุด ครอบทั้งคลิป */}
      <EdgeFX />
    </AbsoluteFill>
  );
};
