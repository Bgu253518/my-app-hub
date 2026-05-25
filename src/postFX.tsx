import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export type PostFXConfig = {
  chromatic: boolean;
  vignette: boolean;
  glow: boolean;
  grain: boolean;
};

const Wrapper: React.FC<{
  children: React.ReactNode;
  config: PostFXConfig;
  intensity?: number;
}> = ({ children, config, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const i = intensity;

  // Chromatic aberration — separate RGB channels
  const chromaStyle: React.CSSProperties =
    config.chromatic
      ? {
          filter: `url(#chroma-${frame % 2 === 0 ? "r" : "b"})`,
        }
      : {};

  return (
    <AbsoluteFill>
      {/* Main content */}
      <AbsoluteFill style={chromaStyle}>{children}</AbsoluteFill>

      {/* Vignette overlay */}
      {config.vignette && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent ${50 - i * 10}%, rgba(0,0,0,${i * 0.5}) 100%)`,
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      )}

      {/* Glow bloom */}
      {config.glow && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,${0.03 * i}) 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 21,
            mixBlendMode: "screen" as const,
          }}
        />
      )}

      {/* Film grain */}
      {config.grain && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08 * i,
            pointerEvents: "none",
            zIndex: 22,
            mixBlendMode: "overlay" as const,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
            )}")`,
            backgroundSize: "200px 200px",
          }}
        />
      )}

      {/* Chromatic aberration SVG filter */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="chroma-r">
            <feOffset in="SourceGraphic" dx={1.5 * i} dy={0} result="r" />
            <feOffset in="SourceGraphic" dx={-1.5 * i} dy={0} result="b" />
            <feColorMatrix
              in="r"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="rr"
            />
            <feColorMatrix
              in="b"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="bb"
            />
            <feBlend in="rr" in2="bb" mode="screen" />
          </filter>
          <filter id="chroma-b">
            <feOffset in="SourceGraphic" dx={-1.5 * i} dy={0} result="r" />
            <feOffset in="SourceGraphic" dx={1.5 * i} dy={0} result="b" />
            <feColorMatrix
              in="r"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="rr"
            />
            <feColorMatrix
              in="b"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="bb"
            />
            <feBlend in="rr" in2="bb" mode="screen" />
          </filter>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

export default Wrapper;
