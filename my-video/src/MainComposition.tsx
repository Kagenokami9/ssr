import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { RobotIntro } from "./scenes/RobotIntro";
import { AstronautScene } from "./scenes/AstronautScene";
import { ChemistryScene } from "./scenes/ChemistryScene";
import { BiologyScene } from "./scenes/BiologyScene";
import { ComputerScene } from "./scenes/ComputerScene";
import { ScienceScene } from "./scenes/ScienceScene";
import { UfoCrashScene } from "./scenes/UfoCrashScene";
import { CurtainScene } from "./scenes/CurtainScene";
import { EdgeFX } from "./components/EdgeFX";

// FPS เดียวใช้ทั้ง Root และคำนวณความยาว → เปลี่ยนที่เดียวได้ทั้งวิดีโอ
export const FPS = 60;
const f = (sec: number) => Math.round(sec * FPS);

// ความยาวแต่ละช่วง (วินาที) — คำนวณเป็นเฟรมจาก FPS ไม่ฮาร์ดโค้ดเลขเฟรม
const INTRO = f(4); // หุ่นวิ่งชน→ระเบิด
const VIDEO = f(7); // ฉากนักบินอวกาศ 3 ช็อต (2.5+2+2.5)
const CHEMISTRY = f(3);
const BIOLOGY = f(2.5); // หุ่นยนต์ผ่าตัดอวัยวะ
const COMPUTER = f(2.5); // หุ่นยนต์เขียนโค้ด โค้ดเด้งออกมา
const SCIENCE = f(3);
const UFO = f(2.5);
const CURTAIN = f(2.5);
const TRANSITION = f(0.5);

// รวมความยาว sequence ทั้งหมด ลบส่วนที่ transition ซ้อนทับ (8 ฉาก = 7 รอยต่อ)
export const TOTAL_DURATION =
  INTRO + VIDEO + CHEMISTRY + BIOLOGY + COMPUTER + SCIENCE + UFO + CURTAIN - 7 * TRANSITION;

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
          <AstronautScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={CHEMISTRY}>
          <ChemistryScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={BIOLOGY}>
          <BiologyScene />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={COMPUTER}>
          <ComputerScene />
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

      {/* เพลงประกอบ: loop จนจบคลิป (ถูกตัดตาม TOTAL_DURATION อัตโนมัติ → คลิปจบเสียงจบ)
          volume 0.6 ให้เป็น background ไม่กลบเสียงคลิปนักบินอวกาศใน MainScene */}
      <Audio src={staticFile("ggd.mp3")} loop volume={0.6} />
    </AbsoluteFill>
  );
};
