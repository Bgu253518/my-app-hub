import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface TypewriterTextProps {
  text: string;
  startFrame: number;
  charDuration?: number; // frames per character
  style?: React.CSSProperties;
  glowColor?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame,
  charDuration = 3,
  style,
  glowColor = "#00e5ff",
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const charsToShow = Math.min(
    Math.floor(localFrame / charDuration),
    text.length
  );
  const visibleText = text.slice(0, charsToShow);

  // Cursor blink at end
  const showCursor = charsToShow < text.length && Math.floor(localFrame / 15) % 2 === 0;

  // Overall opacity fade in
  const fadeIn = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity: fadeIn,
        ...style,
      }}
    >
      <span
        style={{
          textShadow: `0 0 20px ${glowColor}, 0 0 60px ${glowColor}40`,
          color: "#ffffff",
        }}
      >
        {visibleText}
      </span>
      {showCursor && (
        <span
          style={{
            color: glowColor,
            animation: "none",
            opacity: 0.8,
          }}
        >
          ▎
        </span>
      )}
    </div>
  );
};
