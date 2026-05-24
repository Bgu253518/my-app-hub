import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";

interface AnimatedNumberProps {
  value: number;
  startFrame: number;
  durationFrames?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
  glowColor?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  startFrame,
  durationFrames = 40,
  prefix = "",
  suffix = "",
  style,
  glowColor = "#00e5ff",
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  const springProgress = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: durationFrames,
  });

  const displayValue = interpolate(springProgress, [0, 1], [0, value], {
    extrapolateRight: "clamp",
  });

  const fadeIn = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity: fadeIn,
        textShadow: `0 0 30px ${glowColor}, 0 0 80px ${glowColor}60`,
        color: "#ffffff",
        ...style,
      }}
    >
      {prefix}
      <span
        style={{
          color: glowColor,
          fontWeight: "bold",
        }}
      >
        {Math.round(displayValue)}
      </span>
      {suffix}
    </div>
  );
};
