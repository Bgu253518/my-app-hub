import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  Sequence,
  Audio,
  interpolate,
  spring,
  staticFile,
  Composition,
} from "remotion";
import { ParticleBackground } from "./components/ParticleBackground";
import { TypewriterText } from "./components/TypewriterText";
import { AnimatedNumber } from "./components/AnimatedNumber";

// ─── 场景时间线 (30fps, 共300帧/10秒) ──────────────────────────

const SCENE_1_START = 0;
const SCENE_1_DURATION = 75; // 0-2.5s

const SCENE_2_START = 75;
const SCENE_2_DURATION = 90; // 2.5-5.5s

const SCENE_3_START = 165;
const SCENE_3_DURATION = 75; // 5.5-8s

const SCENE_4_START = 240;
const SCENE_4_DURATION = 60; // 8-10s

// ─── 场景 1: 标题入场 ──────────────────────────────────────────

const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  const titleSpring = spring({
    frame,
    fps: 30,
    config: { damping: 10, stiffness: 80 },
    durationInFrames: 40,
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  const sceneOpacity = interpolate(
    frame,
    [0, 15, SCENE_1_DURATION - 15, SCENE_1_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity,
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      {/* 装饰线 */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "25%",
          right: "25%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)",
          transform: `scaleX(${titleSpring})`,
          transformOrigin: "center",
        }}
      />

      {/* 主标题 */}
      <TypewriterText
        text="AI 时代"
        startFrame={0}
        charDuration={4}
        style={{
          fontSize: 96,
          fontWeight: "bold",
          letterSpacing: 16,
          marginBottom: 40,
        }}
        glowColor="#00e5ff"
      />

      {/* 副标题 */}
      <div style={{ opacity: subtitleOpacity }}>
        <span
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 8,
            textShadow: "0 0 10px rgba(255,255,255,0.3)",
          }}
        >
          智能技术的变革力量
        </span>
      </div>

      {/* 底部装饰点 */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          display: "flex",
          gap: 16,
          opacity: subtitleOpacity,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: i === 0 ? "#00e5ff" : "rgba(255,255,255,0.3)",
              boxShadow:
                i === 0 ? "0 0 10px #00e5ff, 0 0 20px rgba(0,229,255,0.5)" : "none",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── 场景 2: 内容展开 ──────────────────────────────────────────

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  const slideUp = spring({
    frame: Math.max(0, frame - 10),
    fps: 30,
    config: { damping: 14, stiffness: 60 },
    durationInFrames: 40,
  });

  const sceneOpacity = interpolate(
    frame,
    [0, 15, SCENE_2_DURATION - 15, SCENE_2_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const items = [
    { icon: "🤖", text: "人工智能", delay: 0 },
    { icon: "☁️", text: "云计算", delay: 10 },
    { icon: "📊", text: "大数据", delay: 20 },
    { icon: "🔗", text: "物联网", delay: 30 },
    { icon: "⚡", text: "5G 通信", delay: 40 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity,
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          fontSize: 60,
          fontWeight: "bold",
          color: "#ffffff",
          marginBottom: 60,
          textShadow: "0 0 30px rgba(0,229,255,0.6)",
          letterSpacing: 12,
          transform: `translateY(${(1 - slideUp) * -80}px)`,
          opacity: slideUp,
        }}
      >
        智能技术赋能千行百业
      </div>

      {/* 图标行 */}
      <div
        style={{
          display: "flex",
          gap: 48,
          alignItems: "center",
        }}
      >
        {items.map((item, i) => {
          const itemFrame = Math.max(0, frame - item.delay);
          const itemSpring = spring({
            frame: itemFrame,
            fps: 30,
            config: { damping: 12, stiffness: 100 },
            durationInFrames: 30,
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                opacity: itemSpring,
                transform: `scale(${0.5 + itemSpring * 0.5}) translateY(${(1 - itemSpring) * 20}px)`,
              }}
            >
              <span style={{ fontSize: 48 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: 4,
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── 场景 3: 核心数据 ──────────────────────────────────────────

const Scene3: React.FC = () => {
  const frame = useCurrentFrame();

  const sceneOpacity = interpolate(
    frame,
    [0, 15, SCENE_3_DURATION - 15, SCENE_3_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const descOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity,
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      {/* 核心数字 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 48,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: 6,
          }}
        >
          效率提升
        </span>

        <AnimatedNumber
          value={10}
          startFrame={5}
          durationFrames={45}
          suffix=""
          style={{
            fontSize: 120,
            fontWeight: "bold",
          }}
          glowColor="#b44dff"
        />

        <span
          style={{
            fontSize: 48,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: 6,
          }}
        >
          倍
        </span>
      </div>

      {/* 描述文字 */}
      <div
        style={{
          marginTop: 50,
          opacity: descOpacity,
        }}
      >
        <span
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 6,
          }}
        >
          AI 驱动的自动化与智能决策
        </span>
      </div>

      {/* 脉冲环 */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: "2px solid rgba(180,77,255,0.3)",
          opacity: descOpacity * 0.6,
          boxShadow: "0 0 40px rgba(180,77,255,0.2)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── 场景 4: 收尾 ──────────────────────────────────────────────

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const textSpring = spring({
    frame: Math.max(0, frame - 5),
    fps: 30,
    config: { damping: 10, stiffness: 80 },
    durationInFrames: 35,
  });

  const sceneOpacity = interpolate(
    frame,
    [0, 15, SCENE_4_DURATION - 10, SCENE_4_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity,
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: "bold",
          color: "#ffffff",
          letterSpacing: 16,
          textShadow: "0 0 40px rgba(0,229,255,0.8), 0 0 100px rgba(0,229,255,0.4)",
          transform: `scale(${0.7 + textSpring * 0.3})`,
          opacity: textSpring,
        }}
      >
        拥抱 AI
        <span
          style={{
            margin: "0 24px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: "normal",
          }}
        >
          ·
        </span>
        拥抱未来
      </div>

      <div
        style={{
          marginTop: 40,
          fontSize: 24,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 6,
          opacity: textSpring * 0.7,
        }}
      >
        让智能驱动每一次创新
      </div>
    </AbsoluteFill>
  );
};

// ─── 主视频组件 ────────────────────────────────────────────────

const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <ParticleBackground />
      <Audio src={staticFile("audio/narration.mp3")} />

      <Sequence from={SCENE_1_START} durationInFrames={SCENE_1_DURATION}>
        <Scene1 />
      </Sequence>

      <Sequence from={SCENE_2_START} durationInFrames={SCENE_2_DURATION}>
        <Scene2 />
      </Sequence>

      <Sequence from={SCENE_3_START} durationInFrames={SCENE_3_DURATION}>
        <Scene3 />
      </Sequence>

      <Sequence from={SCENE_4_START} durationInFrames={SCENE_4_DURATION}>
        <Scene4 />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="AiVideo"
      component={MainVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
