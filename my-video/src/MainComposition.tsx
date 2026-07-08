import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { RobotIntro } from "./scenes/RobotIntro";
import { MainScene } from "./scenes/MainScene";

const INTRO_FRAMES = 120; // 4s @ 30fps
const VIDEO_FRAMES = 600; // 20s @ 30fps
const TRANSITION_FRAMES = 15;

export const TOTAL_DURATION = INTRO_FRAMES + VIDEO_FRAMES - TRANSITION_FRAMES;

export const MainComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <RobotIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />
        <TransitionSeries.Sequence durationInFrames={VIDEO_FRAMES}>
          <MainScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
