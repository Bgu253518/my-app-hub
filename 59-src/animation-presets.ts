import { interpolate, spring, interpolateColors } from "remotion";

type AnimStyle = {
  opacity: number;
  transform?: string;
  transformOrigin?: string;
  filter?: string;
  textShadow?: string;
  clipPath?: string;
};

/**
 * 12 animation presets mapped by semantic type.
 * Each returns a React CSSProperties object for a given frame.
 */
export function getAnimationStyle(
  type: string,
  frame: number,
  durationFrames: number,
  fps = 30
): AnimStyle {
  const p = (t: number) => t / durationFrames; // progress 0→1
  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  switch (type) {
    case "fadeIn":
      return {
        opacity: interpolate(frame, [0, durationFrames * 0.3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      };

    case "slideIn":
      return {
        opacity: 1,
        transform: `translateX(${interpolate(
          frame,
          [0, durationFrames * 0.35],
          [60, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )}px)`,
      };

    case "elasticOut":
      return elasticOutStyle(frame, durationFrames, fps);

    case "scaleBounce":
      return scaleBounceStyle(frame, durationFrames);

    case "countUp":
      // opacity + scale handled in component; this is visual hint
      return {
        opacity: 1,
        transform: `scale(${interpolate(
          frame,
          [0, durationFrames * 0.2],
          [0.3, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )})`,
      };

    case "pulse":
      return pulseStyle(frame, fps);

    case "blurIn":
      return {
        opacity: interpolate(frame, [0, durationFrames * 0.3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        filter: `blur(${interpolate(
          frame,
          [0, durationFrames * 0.3],
          [20, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )}px)`,
      };

    case "splitSlide":
      return {
        opacity: 1,
        clipPath: `inset(0 ${interpolate(
          frame,
          [0, durationFrames * 0.4],
          [50, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )}% 0 ${interpolate(
          frame,
          [0, durationFrames * 0.4],
          [50, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )}%)`,
      };

    case "particleGather":
      return {
        opacity: interpolate(frame, [0, durationFrames * 0.3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `scale(${interpolate(
          frame,
          [0, durationFrames * 0.2],
          [2.5, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )})`,
      };

    case "flowLine":
      return {
        opacity: interpolate(frame, [0, durationFrames * 0.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateX(${interpolate(
          frame,
          [0, durationFrames * 0.5],
          [-30, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )}px)`,
      };

    case "growUp":
      return {
        opacity: interpolate(frame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `scaleY(${interpolate(
          frame,
          [0, durationFrames * 0.5],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )})`,
        transformOrigin: "bottom center",
      };

    case "colorShift":
      // Handled by the component's native color animation
      return {
        opacity: interpolate(frame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      };

    default:
      return { opacity: 1 };
  }
}

function elasticOutStyle(
  frame: number,
  durationFrames: number,
  fps: number
): AnimStyle {
  const s = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
    durationInFrames: Math.min(durationFrames, 40),
  });
  return {
    opacity: interpolate(frame, [0, 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `scale(${0.3 + s * 0.7})`,
  };
}

function scaleBounceStyle(
  frame: number,
  durationFrames: number
): AnimStyle {
  const p = interpolate(
    frame,
    [0, Math.min(durationFrames, 35)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // Bounce ease: overshoot then settle
  const s = 1 - Math.pow(1 - p, 3) * Math.cos(p * Math.PI * 3 * 0.6);
  return {
    opacity: p,
    transform: `scale(${s})`,
  };
}

function pulseStyle(frame: number, fps: number): AnimStyle {
  const breathe = Math.sin((frame / fps) * Math.PI * 2) * 0.04 + 1;
  return {
    transform: `scale(${breathe})`,
    opacity: 1,
  };
}

/** Get exit animation style */
export function getExitStyle(
  type: string,
  frame: number,
  durationFrames: number
): AnimStyle {
  const p = frame / durationFrames;
  switch (type) {
    case "fadeOut":
      return { opacity: 1 - p };
    case "blurOut":
      return {
        opacity: 1 - p,
        filter: `blur(${p * 15}px)`,
      };
    case "slideOut":
      return {
        opacity: 1,
        transform: `translateX(${p * 80}px)`,
      };
    case "shrinkOut":
      return {
        opacity: 1 - p,
        transform: `scale(${1 - p * 0.5})`,
      };
    default:
      return { opacity: 1 };
  }
}

/** Glitch text keyframe effect */
export function getGlitchStyle(frame: number): React.CSSProperties {
  const glitchFrame = Math.floor(frame / 4) % 6;
  if (glitchFrame < 2) {
    return {
      transform: `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`,
      filter: `hue-rotate(${Math.random() * 360}deg)`,
    };
  }
  return {};
}
