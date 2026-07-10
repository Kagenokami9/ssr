import "./index.css";
import { Composition } from "remotion";
import { MainComposition, TOTAL_DURATION, FPS } from "./MainComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
