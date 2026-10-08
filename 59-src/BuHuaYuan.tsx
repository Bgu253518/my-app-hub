import React, { useMemo } from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  Sequence, Audio, interpolate, spring, staticFile,
} from "remotion";

// ── Style Constants ──────────────────────────────────
const BG = "#0a0a0a";
const TEXT = "#e8e8e8";
const ACCENT = "#d4a574"; // warm gold for highlights
const DIM = "#6b6b6b";
const FONT = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';

// ── Timing from storyboard (seconds) ─────────────────
const TIMING = [
  { id: "scene_1", start: 0, dur: 3, emotion: "curiosity" },
  { id: "scene_2", start: 3, dur: 6, emotion: "tension" },
  { id: "scene_3", start: 9, dur: 6, emotion: "surprise" },
  { id: "scene_4", start: 15, dur: 6, emotion: "awe" },
  { id: "scene_5", start: 21, dur: 8, emotion: "urgency" },
  { id: "scene_6", start: 29, dur: 7, emotion: "outrage" },
  { id: "scene_7", start: 36, dur: 6, emotion: "tension" },
  { id: "scene_8", start: 42, dur: 10, emotion: "relief" },
  { id: "scene_9", start: 52, dur: 8, emotion: "hope" },
];
const TOTAL_DUR = 60; // seconds
const FPS = 30;
const TOTAL_FRAMES = TOTAL_DUR * FPS;

// ── Helper: frame-based interpolation ────────────────
const fi = (f: number, d: number, dur: number) =>
  interpolate(f - d, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// ── Grain Overlay ────────────────────────────────────
const GrainOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = 0.04 + Math.random() * 0.02;
  return (
    <div style={{
      position: "absolute", inset: 0, opacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: "128px 128px",
      zIndex: 100, pointerEvents: "none",
    }} />
  );
};

// ── Scene Wrapper ────────────────────────────────────
const SceneWrap: React.FC<{ startFrame: number; durFrames: number; children: React.ReactNode }> = ({
  startFrame, durFrames, children,
}) => {
  const f = useCurrentFrame();
  const localF = f - startFrame;
  const exitF = durFrames - 8;
  const opacity = interpolate(localF, [0, 4, exitF, durFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  if (localF < 0 || localF >= durFrames) return null;
  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

// ── Circle Motif (motif_1) ───────────────────────────
const Circle: React.FC<{ cx: number; cy: number; r: number; stroke?: string; fill?: string; strokeW?: number; dash?: number[] }> = ({
  cx, cy, r, stroke = DIM, fill = "none", strokeW = 1, dash,
}) => (
  <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeW}
    strokeDasharray={dash?.join(" ")} />
);

// ── Scene 1: 22:00的孤灯 ─────────────────────────────
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const t = fi(f, 0, 25);
  const clockR = 60;
  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
      {/* Clock circle */}
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ opacity: t, position: "absolute", top: "30%" }}>
        <Circle cx={100} cy={100} r={clockR} stroke={TEXT} strokeW={2} />
        {/* Clock hands pointing at 10 */}
        <line x1={100} y1={100} x2={100} y2={55} stroke={TEXT} strokeWidth={3} strokeLinecap="round" />
        <line x1={100} y1={100} x2={130} y2={100} stroke={TEXT} strokeWidth={2} strokeLinecap="round" />
        <circle cx={100} cy={100} r={4} fill={TEXT} />
      </svg>
      {/* Title text */}
      <div style={{
        opacity: fi(f, 15, 20), position: "absolute", top: "58%",
        fontSize: 20, color: DIM, letterSpacing: 12, textTransform: "uppercase",
      }}>
        22 : 00
      </div>
      {/* Narration */}
      <div style={{
        opacity: fi(f, 18, 15), position: "absolute", bottom: "15%",
        fontSize: 28, color: TEXT, fontWeight: 300, letterSpacing: 4, textAlign: "center",
        maxWidth: "80%", lineHeight: 1.6,
      }}>
        晚上十点，你是最后关灯的那个人吗？
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 2: 0与0 ────────────────────────────────────
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
      {/* Left: 0% */}
      <div style={{
        position: "absolute", left: "18%", top: "35%",
        fontSize: 80, fontWeight: 900, color: "#ff4444",
        opacity: fi(f, 0, 12),
      }}>0%</div>
      <div style={{
        position: "absolute", left: "18%", top: "52%",
        fontSize: 16, color: DIM, opacity: fi(f, 8, 15),
        letterSpacing: 2,
      }}>去年涨薪</div>
      {/* Right: 0 (box) */}
      <div style={{
        position: "absolute", right: "18%", top: "33%",
        width: 100, height: 70, border: `3px solid ${TEXT}`,
        opacity: fi(f, 8, 12),
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: TEXT }}>0</span>
      </div>
      <div style={{
        position: "absolute", right: "18%", top: "52%",
        fontSize: 16, color: DIM, opacity: fi(f, 16, 15),
        letterSpacing: 2,
      }}>今年工位</div>
      {/* Narration */}
      <div style={{
        opacity: fi(f, 20, 15), position: "absolute", bottom: "15%",
        fontSize: 24, color: TEXT, fontWeight: 300, letterSpacing: 3, textAlign: "center",
        maxWidth: "85%", lineHeight: 1.6,
      }}>
        去年涨薪0%。今年工位归零。<br />
        <span style={{ fontSize: 20, color: DIM }}>深夜加班换来的，是一封裁员邮件。</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: 涨薪的抛物线 ────────────────────────────
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const w = 1920, h = 1080;
  // Generate parabola curve
  const points = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 100; i++) {
      const x = 200 + (i / 100) * 1100;
      // Sharp rise then flat: y = a*(1 - e^(-bx))
      const progress = i / 100;
      const y = 600 - 350 * (1 - Math.exp(-4 * progress)) - 30 * progress;
      pts.push([x, y]);
    }
    return pts;
  }, []);
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const drawLen = fi(f, 0, 40);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Axes */}
        <line x1={180} y1={650} x2={1400} y2={650} stroke={DIM} strokeWidth={1} opacity={fi(f, 0, 10)} />
        <line x1={200} y1={650} x2={200} y2={200} stroke={DIM} strokeWidth={1} opacity={fi(f, 0, 10)} />
        {/* Curve */}
        <path d={pathD} fill="none" stroke="#4ade80" strokeWidth={3}
          strokeDasharray="1500" strokeDashoffset={1500 * (1 - drawLen)}
          style={{ transition: "stroke-dashoffset 0.1s" }} />
        {/* 80% label */}
        <text x={350} y={280} fill="#4ade80" fontSize={28} fontWeight={700}
          opacity={fi(f, 30, 15)}>80%</text>
        <text x={350} y={310} fill={DIM} fontSize={14} opacity={fi(f, 35, 15)}>涨幅集中在前2年</text>
        {/* Flat zone marker */}
        <line x1={800} y1={540} x2={1200} y2={540} stroke="#ff6b6b" strokeWidth={1}
          strokeDasharray="5 5" opacity={fi(f, 35, 15)} />
        <text x={850} y={560} fill="#ff6b6b" fontSize={14} opacity={fi(f, 40, 15)}>后三年？惯性空转</text>
      </svg>
      <div style={{
        opacity: fi(f, 38, 15), position: "absolute", bottom: "20%", left: 0, right: 0,
        textAlign: "center", fontSize: 22, color: TEXT, fontWeight: 300, letterSpacing: 3,
      }}>
        同一岗位五年，80%的薪资涨幅全挤在头两年。
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: 幂律的裂谷 ──────────────────────────────
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT }}>
      {/* Gray flat line */}
      <div style={{
        position: "absolute", left: 150, top: "55%",
        width: interpolate(fi(f, 0, 20), [0, 1], [0, 600]), height: 2,
        background: DIM, opacity: 0.6,
      }} />
      <span style={{ position: "absolute", left: 150, top: "58%", fontSize: 14, color: DIM, opacity: fi(f, 5, 15) }}>
        深耕五年
      </span>
      {/* Gold jumping line */}
      <svg width={800} height={300} style={{ position: "absolute", right: 100, top: "30%", opacity: fi(f, 8, 15) }}>
        <polyline points="50,250 150,250 200,180 250,180 300,100 350,100 400,50"
          fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ position: "absolute", right: 180, top: "28%", fontSize: 14, color: ACCENT, opacity: fi(f, 18, 15) }}>
        换对赛道
      </span>
      {/* 2x-3x */}
      <div style={{
        position: "absolute", top: "40%", right: "30%",
        fontSize: 72, fontWeight: 900, color: ACCENT, opacity: fi(f, 18, 15),
        textShadow: `0 0 60px ${ACCENT}40`,
      }}>2-3x</div>
      {/* Narration */}
      <div style={{
        opacity: fi(f, 25, 15), position: "absolute", bottom: "18%", left: 0, right: 0,
        textAlign: "center", fontSize: 24, color: TEXT, fontWeight: 300, letterSpacing: 3,
      }}>
        换对赛道，涨幅是深耕五年的2到3倍。<br />
        <span style={{ color: DIM, fontSize: 18 }}>同一张工卡，两列火车。</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: 两条铁轨 (split screen) ─────────────────
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const splitX = interpolate(fi(f, 15, 30), [0, 1], [50, 70]); // % for right side
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT }}>
      {/* Left: treadmill */}
      <div style={{
        position: "absolute", left: 0, top: 0, width: `${splitX}%`, height: "100%",
        borderRight: `1px solid ${DIM}33`, overflow: "hidden",
        opacity: fi(f, 0, 10),
      }}>
        {/* Treadmill belt - repetitive circles */}
        <svg width="500" height="1080" viewBox="0 0 500 1080">
          {[0, 1, 2, 3, 4].map(i => (
            <circle key={i} cx={250} cy={300 + i * 160} r={40}
              fill="none" stroke={DIM} strokeWidth={1} opacity={0.3 + i * 0.1} />
          ))}
        </svg>
        <div style={{
          position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)",
          fontSize: 16, color: "#ff6b6b", letterSpacing: 4, textAlign: "center",
        }}>
          跑步机 · 汗流浃背
        </div>
      </div>
      {/* Right: trains/transitions */}
      <div style={{
        position: "absolute", left: `${splitX}%`, top: 0, width: `${100 - splitX}%`, height: "100%",
        opacity: fi(f, 3, 12), overflow: "hidden",
      }}>
        <svg width="500" height="1080" viewBox="0 0 500 1080">
          {[0, 1, 2].map(i => (
            <line key={i} x1={50 + i * 150} y1={200} x2={150 + i * 150} y2={600}
              stroke={ACCENT} strokeWidth={2} opacity={0.4 + i * 0.2} />
          ))}
          {/* Small circles at junctions */}
          {[0, 1, 2].map(i => (
            <circle key={`c${i}`} cx={150 + i * 150} cy={600} r={6} fill={ACCENT} opacity={0.7} />
          ))}
        </svg>
        <div style={{
          position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)",
          fontSize: 16, color: ACCENT, letterSpacing: 4, textAlign: "center",
        }}>
          换三趟车 · 十年路
        </div>
      </div>
      {/* Narration */}
      <div style={{
        opacity: fi(f, 25, 15), position: "absolute", bottom: "15%", left: 0, right: 0,
        textAlign: "center", fontSize: 24, color: TEXT, fontWeight: 300, letterSpacing: 3, zIndex: 5,
      }}>
        五年——有人在跑步机上汗流浃背，有人换了三趟车。<br />
        <span style={{ color: ACCENT, fontSize: 20 }}>同一起点，差了十万八千里。</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 6: 最大的幻觉 ──────────────────────────────
const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  // Sticky notes appearing and getting torn
  const notes = ["周报 ✓", "日报 ✓", "复盘 ✓", "加班 ✓", "考核 ✓", "述职 ✓", "优化 ✗"];
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT }}>
      {/* Conveyor belt visual */}
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0, height: 4,
        background: `repeating-linear-gradient(90deg, ${DIM}44 0px, ${DIM}44 20px, transparent 20px, transparent 40px)`,
        opacity: fi(f, 5, 15),
      }} />
      {/* Sticky notes grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20,
        position: "absolute", top: "20%", left: "15%", right: "15%",
        opacity: fi(f, 3, 15),
      }}>
        {notes.map((note, i) => (
          <div key={i} style={{
            background: i === notes.length - 1 ? "#ff4444" : "#1a1a1a",
            border: `1px solid ${i === notes.length - 1 ? "#ff4444" : DIM}44`,
            padding: "12px 8px", textAlign: "center",
            fontSize: 14, color: i === notes.length - 1 ? BG : TEXT,
            opacity: fi(f, i * 4, 10), letterSpacing: 2,
            transform: `rotate(${(i - 3) * 3}deg)`,
          }}>
            {note}
          </div>
        ))}
      </div>
      {/* Narration */}
      <div style={{
        opacity: fi(f, 20, 15), position: "absolute", bottom: "18%", left: 0, right: 0,
        textAlign: "center", maxWidth: "85%", margin: "0 auto",
        fontSize: 24, color: TEXT, fontWeight: 300, letterSpacing: 3, lineHeight: 1.6,
      }}>
        你最大的幻觉？<span style={{ color: "#ff6b6b" }}>只要够忙，就够安全。</span><br />
        <span style={{ fontSize: 18, color: DIM }}>
          教培六万人一夜归零。三十五岁程序员——在送外卖。
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 7: CLIMAX - 镜像 ────────────────────────────
const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const crackProgress = fi(f, 15, 25);
  const shatterScale = interpolate(crackProgress, [0, 1], [1, 1.3]);
  const shatterOpacity = interpolate(crackProgress, [0.7, 1], [1, 0]);
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, justifyContent: "center", alignItems: "center" }}>
      {/* Mirror frame */}
      <div style={{
        width: 500, height: 500, borderRadius: "50%",
        border: `3px solid ${TEXT}44`,
        opacity: fi(f, 0, 10) * shatterOpacity,
        position: "relative", overflow: "hidden",
        transform: `scale(${shatterScale})`,
      }}>
        {/* Millstone inside mirror */}
        <svg width="500" height="500" viewBox="0 0 500 500" style={{ opacity: fi(f, 5, 10) }}>
          <circle cx={250} cy={250} r={180} fill="none" stroke={DIM} strokeWidth={2} />
          <circle cx={250} cy={250} r={140} fill="none" stroke={DIM} strokeWidth={1} strokeDasharray="8 4" />
          <circle cx={250} cy={250} r={80} fill="none" stroke={DIM} strokeWidth={1} />
          {/* Cross lines on millstone */}
          <line x1={250} y1={70} x2={250} y2={430} stroke={DIM} strokeWidth={1} opacity={0.5} />
          <line x1={70} y1={250} x2={430} y2={250} stroke={DIM} strokeWidth={1} opacity={0.5} />
          {/* Small donkey silhouette */}
          <circle cx={250} cy={160} r={15} fill={DIM} opacity={0.6} />
        </svg>
        {/* Crack lines */}
        {crackProgress > 0.1 && (
          <svg width="500" height="500" viewBox="0 0 500 500" style={{ position: "absolute", inset: 0 }}>
            {[
              "M250,250 L200,100 L180,50",
              "M250,250 L350,120 L400,40",
              "M250,250 L100,280 L30,300",
              "M250,250 L380,350 L450,420",
            ].map((d, i) => (
              <path key={i} d={d} fill="none" stroke={TEXT} strokeWidth={2 - i * 0.3}
                strokeDasharray={`${200 * crackProgress}`}
                strokeDashoffset={200 * (1 - crackProgress)}
                opacity={crackProgress * (1 - i * 0.15)} />
            ))}
          </svg>
        )}
      </div>
      {/* Shatter flash */}
      {crackProgress > 0.6 && (
        <AbsoluteFill style={{
          background: `radial-gradient(circle, ${TEXT}${Math.round(crackProgress * 30).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
          opacity: interpolate(crackProgress, [0.6, 0.85], [0, 1]),
        }} />
      )}
      {/* Narration */}
      <div style={{
        opacity: fi(f, 0, 10), position: "absolute", bottom: "12%", left: 0, right: 0,
        textAlign: "center", fontSize: 28, color: TEXT, fontWeight: 700, letterSpacing: 4,
        textShadow: `0 0 30px ${TEXT}40`,
      }}>
        镜子里，你看见一头驴。<br />
        <span style={{ fontSize: 34, color: ACCENT, letterSpacing: 6, lineHeight: 2.5 }}>
          别把驴拉磨，错当成日行千里。
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 8: 风声与直线 ──────────────────────────────
const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  // The circle from the mirror transforms into a straight line
  const morph = fi(f, 0, 40);
  const circR = interpolate(morph, [0, 0.5], [180, 0]);
  const lineLen = interpolate(morph, [0.3, 1], [0, 800]);
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, justifyContent: "center", alignItems: "center" }}>
      <svg width="1000" height="400" viewBox="0 0 1000 400">
        {/* Fading circle fragments */}
        {circR > 0 && (
          <circle cx={500} cy={200} r={circR} fill="none" stroke={DIM} strokeWidth={1}
            strokeDasharray={`${circR * 0.3} ${circR * 0.1}`} opacity={1 - morph} />
        )}
        {/* Emerging straight line */}
        {lineLen > 0 && (
          <line x1={500 - lineLen / 2} y1={200} x2={500 + lineLen / 2} y2={200}
            stroke={ACCENT} strokeWidth={2} opacity={morph > 0.5 ? 1 : morph * 2} />
        )}
        {/* Footprints stepping off the circle */}
        {morph > 0.3 && (
          <>
            <circle cx={500 - circR - 20} cy={200} r={4} fill={TEXT} opacity={morph * 0.6} />
            <circle cx={500 - circR - 50} cy={185} r={5} fill={TEXT} opacity={morph * 0.8} />
            <circle cx={500 - circR - 80} cy={195} r={6} fill={ACCENT} opacity={morph} />
          </>
        )}
      </svg>
      <div style={{
        opacity: fi(f, 15, 20), position: "absolute", bottom: "18%", left: 0, right: 0,
        textAlign: "center", fontSize: 24, color: TEXT, fontWeight: 300, letterSpacing: 4, lineHeight: 1.8,
        maxWidth: "80%", margin: "0 auto",
      }}>
        走出环形跑道，风声灌进来。<br />
        <span style={{ fontSize: 20, color: DIM }}>磨盘的影子留在身后。</span><br />
        <span style={{ fontSize: 22, color: ACCENT }}>每一个圆，都可以重画成直线。</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 9: 你的笔画你的路 ──────────────────────────
const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const penX = 300;
  const penY = 500;
  const lineEnd = interpolate(fi(f, 0, 30), [0, 1], [penX, penX + 600]);
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, justifyContent: "center", alignItems: "center" }}>
      <svg width="1200" height="700" viewBox="0 0 1200 700">
        {/* Diagonal line being drawn */}
        <line x1={penX} y1={penY} x2={lineEnd} y2={penY - 400}
          stroke={ACCENT} strokeWidth={2} strokeLinecap="round"
          opacity={fi(f, 5, 25)} />
        {/* Pen tip */}
        <circle cx={lineEnd} cy={penY - 400 * (fi(f, 0, 30))} r={3} fill={TEXT}
          opacity={fi(f, 2, 10)} />
      </svg>
      {/* Narration */}
      <div style={{
        opacity: fi(f, 20, 15), position: "absolute", bottom: "20%", left: 0, right: 0,
        textAlign: "center", fontSize: 32, color: TEXT, fontWeight: 700, letterSpacing: 8,
      }}>
        笔在你手里。
      </div>
      <div style={{
        opacity: fi(f, 35, 15), position: "absolute", bottom: "12%", left: 0, right: 0,
        textAlign: "center", fontSize: 28, color: ACCENT, fontWeight: 300, letterSpacing: 12,
      }}>
        画直线。不画圆。
      </div>
    </AbsoluteFill>
  );
};

// ── Main Composition ──────────────────────────────────
const BuHuaYuan: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;

  // Find current scene
  const currentScene = TIMING.find(t => sec >= t.start && sec < t.start + t.dur);

  // Scene renderer map
  const sceneRenderers: Record<string, React.FC> = {
    scene_1: Scene1, scene_2: Scene2, scene_3: Scene3,
    scene_4: Scene4, scene_5: Scene5, scene_6: Scene6,
    scene_7: Scene7, scene_8: Scene8, scene_9: Scene9,
  };

  if (!currentScene) return null;
  const SceneComp = sceneRenderers[currentScene.id];
  if (!SceneComp) return null;

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Audio src={staticFile("audio/narration_full.mp3")} />
      <SceneComp />
      <GrainOverlay />
    </AbsoluteFill>
  );
};

export default BuHuaYuan;
