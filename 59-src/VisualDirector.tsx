import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  Sequence,
  Audio,
  staticFile,
  interpolate,
  spring,
  Img,
  getInputProps,
} from "remotion";
import { getAnimationStyle, getExitStyle, getGlitchStyle } from "./animation-presets";
import PostFXWrap, { PostFXConfig } from "./postFX";
import CaptionOverlay from "./CaptionOverlay";

/* ─── Types ─────────────────────────────────────────────── */

interface SceneElement {
  type: "text" | "image" | "icon" | "chart";
  content: string;
  position: { x: string; y: string };
  scale?: number;
  animation_in: { type: string; duration: number };
  animation_out: { type: string; duration: number };
  text_effect?: string;
  emphasis?: string;
  start_delay?: number; // seconds offset before animation starts (for progressive reveal)
}

interface Scene {
  scene_id: number;
  name: string;
  beat: string;
  duration: number | string;
  narration: string;
  background: {
    description: string;
    color_palette: string[];
    animation: string;
    effect: string;
    image?: string; // filename in public/images/ for full-screen background
  };
  elements: SceneElement[];
  transition_to_next: {
    type: string;
    duration: number | string;
  };
  sfx: string[];
  postFX: PostFXConfig;
}

interface Storyboard {
  video_meta: {
    total_duration: string;
    style: string;
    visual_metaphor: string;
  };
  scenes: Scene[];
}

/* ─── Style helpers ─────────────────────────────────────── */

const FONT_FAMILY = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';

function bgGradient(style: string, palette: string[]): string {
  const c = palette.length >= 2 ? palette : ["#0a0a0a", "#1a1a2e"];
  switch (style) {
    case "科技冷峻风":
    case "极简人文+科技冷感":
      return `linear-gradient(135deg, ${c[0]} 0%, ${c[1] || c[0]} 100%)`;
    case "温暖叙事风":
      return `radial-gradient(ellipse at 50% 60%, ${c[1] || c[0]} 0%, ${c[0]} 70%)`;
    case "极简冲击风":
      return `#000000`;
    default:
      return `linear-gradient(135deg, ${c[0]}, ${c[1] || c[0]})`;
  }
}

function getTextColor(style: string): string {
  switch (style) {
    case "极简人文+科技冷感":
      return "#e8e8e8";
    case "极简冲击风":
      return "#ffffff";
    case "温暖叙事风":
      return "#f5f0eb";
    default:
      return "#e2e8f0";
  }
}

function getGlowColor(palette: string[]): string {
  return palette.length > 0 ? palette[0] : "#00d4ff";
}

/* ─── Background Layer ──────────────────────────────────── */

const BgLayer: React.FC<{
  scene: Scene;
  styleName: string;
  frame: number;
  totalFrames: number;
}> = ({ scene, styleName, frame, totalFrames }) => {
  const palette = scene.background.color_palette;
  const glow = getGlowColor(palette);
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        size: 1 + Math.random() * 3,
        speed: 0.2 + Math.random() * 0.8,
        delay: i * 5,
      })),
    []
  );

  const bgImage = scene.background.image;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bgImage
          ? `linear-gradient(rgba(10,10,10,0.55), rgba(10,10,14,0.7)), url(${staticFile("images/" + bgImage)}) center/cover no-repeat`
          : bgGradient(styleName, palette),
      }}
    >
      {/* Geometric particles */}
      {scene.background.animation !== "none" &&
        particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top:
                ((p.y - frame * p.speed * 0.5) % 1200) -
                100,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: i % 5 === 0 ? glow : `${glow}30`,
              opacity: interpolate(
                Math.max(0, frame - p.delay),
                [0, 20],
                [0, 0.3],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          />
        ))}

      {/* Horizontal thin light line decoration (极简人文) */}
      {styleName === "极简人文+科技冷感" && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`,
          }}
        />
      )}
    </div>
  );
};

/* ─── Element Renderer ──────────────────────────────────── */

const SceneElementRenderer: React.FC<{
  el: SceneElement;
  styleName: string;
  palette: string[];
  frame: number;
  sceneFrames: number;
  fps: number;
}> = ({ el, styleName, palette, frame, sceneFrames, fps }) => {
  const delayFrames = Math.round((el.start_delay || 0) * fps);
  const adjustedFrame = Math.max(0, frame - delayFrames);
  const inDur = Math.round(el.animation_in.duration * fps);
  const outDur = Math.round(el.animation_out.duration * fps);
  const outStart = sceneFrames - outDur;

  // Wait until start_delay has passed
  if (frame < delayFrames) return null;

  // Choose animation style based on phase
  let animStyle: React.CSSProperties = {};
  if (adjustedFrame < inDur) {
    animStyle = getAnimationStyle(el.animation_in.type, adjustedFrame, inDur, fps);
  } else if (frame >= outStart) {
    animStyle = getExitStyle(el.animation_out.type, frame - outStart, outDur);
  } else {
    // Emphasis (pulse) in the middle
    if (el.emphasis === "pulse") {
      const breathe = Math.sin((adjustedFrame / fps) * Math.PI * 2) * 0.04 + 1;
      animStyle = { transform: `scale(${breathe})` };
    } else {
      animStyle = { opacity: 1 };
    }
  }

  // Glitch text effect
  let glitchStyle: React.CSSProperties = {};
  if (el.text_effect === "glitch") {
    glitchStyle = getGlitchStyle(adjustedFrame);
  }

  const textColor = getTextColor(styleName);
  const glow = getGlowColor(palette);
  const scale = el.scale || 1;
  const x = el.position.x;
  const y = el.position.y;

  switch (el.type) {
    case "text":
    case "icon":
      return (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            color: textColor,
            fontFamily: FONT_FAMILY,
            fontSize: el.type === "icon" ? 48 : 28,
            fontWeight: 700,
            letterSpacing: 4,
            textShadow: el.text_effect === "glitch"
              ? "none"
              : `0 0 20px ${glow}40`,
            whiteSpace: "nowrap",
            zIndex: 5,
            ...animStyle,
            ...glitchStyle,
          }}
        >
          {el.content}
        </div>
      );

    case "chart":
      return (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
            color: textColor,
            fontFamily: FONT_FAMILY,
            fontSize: 22,
            zIndex: 5,
            ...animStyle,
          }}
        >
          {el.content}
        </div>
      );

    case "image":
      return (
        <Img
          src={staticFile(el.content)}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            maxWidth: "100%",
            maxHeight: "100%",
            zIndex: 5,
            ...animStyle,
          }}
        />
      );

    default:
      return null;
  }
};

/* ─── Scene Renderer ────────────────────────────────────── */

const SceneRenderer: React.FC<{
  scene: Scene;
  styleName: string;
  fps: number;
  sceneFrames: number;
}> = ({ scene, styleName, fps, sceneFrames }) => {
  const frame = useCurrentFrame();
  const palette = scene.background.color_palette;
  const defaultFx: PostFXConfig = scene.postFX || {
    chromatic: false,
    vignette: styleName === "温暖叙事风",
    glow: styleName === "极简人文+科技冷感" || styleName === "科技冷峻风",
    grain: styleName === "极简人文+科技冷感" || styleName === "温暖叙事风",
  };

  return (
    <PostFXWrap config={defaultFx}>
      <BgLayer
        scene={scene}
        styleName={styleName}
        frame={frame}
        totalFrames={sceneFrames}
      />

      {/* Scene elements */}
      {scene.elements?.map((el, i) => (
        <SceneElementRenderer
          key={i}
          el={el}
          styleName={styleName}
          palette={palette}
          frame={frame}
          sceneFrames={sceneFrames}
          fps={fps}
        />
      ))}

      {/* Beat indicator (optional, for 极简人文+科技冷感) */}
      {styleName === "极简人文+科技冷感" && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 32,
            fontSize: 11,
            color: "#4a4a4a",
            fontFamily: FONT_FAMILY,
            letterSpacing: 3,
            zIndex: 15,
          }}
        >
          {scene.beat}
        </div>
      )}
    </PostFXWrap>
  );
};

/* ─── Loading State ─────────────────────────────────────── */

const LoadingState: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      background: "#0a0a0a",
      fontFamily: FONT_FAMILY,
    }}
  >
    <span style={{ color: "#4a4a4a", fontSize: 20, letterSpacing: 4 }}>
      等待分镜数据...
    </span>
  </AbsoluteFill>
);

/* ─── Main Visual Director ──────────────────────────────── */

const VisualDirectorVideo: React.FC = () => {
  const fps = 30;
  const inputProps = getInputProps();
  const storyboard = (inputProps?.storyboard as Storyboard | undefined);

  if (!storyboard || !storyboard.scenes) {
    return <LoadingState />;
  }

  const { scenes, video_meta } = storyboard;
  const styleName = video_meta?.style || "科技冷峻风";

  // Calculate frame layout: each scene as a Sequence
  const layout = useMemo(() => {
    let cursor = 0;
    return scenes.map((s) => {
      const dur = Math.max(1, Math.round(parseFloat(String(s.duration)) * fps));
      const start = cursor;
      cursor += dur;
      return { start, dur, scene: s };
    });
  }, [scenes, fps]);

  // Calculate total frames for audio timing
  const totalFrames = layout.reduce((sum, l) => sum + l.dur, 0);

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Audio track: copied by render_engine to public/audio/narration.mp3 */}
      <Audio src={staticFile("audio/narration.mp3")} />

      {/* Bilingual caption overlay (frame-position-aware) */}
      <CaptionOverlay scenes={scenes} fps={fps} language="auto" />

      {/* Auto-adjust total duration */}
      <div style={{ display: "none" }}>
        {interpolate(totalFrames, [0, 1], [0, 1])}
      </div>

      {/* Render each scene as a Sequence */}
      {layout.map(({ start, dur, scene }) => (
        <Sequence
          key={scene.scene_id}
          from={start}
          durationInFrames={dur}
          name={scene.name}
        >
          <SceneRenderer
            scene={scene}
            styleName={styleName}
            fps={fps}
            sceneFrames={dur}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export default VisualDirectorVideo;
