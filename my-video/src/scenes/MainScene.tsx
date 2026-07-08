import { AbsoluteFill, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { SpaceEffectsOverlay } from "./SpaceEffectsOverlay";

export const MainScene = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Video
        src={staticFile("HelloWorld.mp4")}
        volume={(f) =>
          interpolate(f, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Sequence from={8 * fps} durationInFrames={11 * fps} layout="none">
        <SpaceEffectsOverlay />
      </Sequence>
    </AbsoluteFill>
  );
};
