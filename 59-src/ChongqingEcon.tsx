import React, { useMemo } from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  Sequence, Audio, interpolate, spring, staticFile,
} from "remotion";

// ═══════════ DESIGN SYSTEM ═══════════
const BG = "#0a1628";
const BG2 = "#0f1f3a";
const CYAN = "#00d4ff";
const GOLD = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#10b981";
const PURPLE = "#8b5cf6";
const WHITE = "#e2e8f0";
const GRAY = "#64748b";
const DARK_CARD = "#111d32";
const FONT = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
const FPS = 30;
const TOTAL_DUR = 63;

// ═══════════ TTS-BASED TIMING (exact from ffprobe) ═══════════
const S = [
  { id: "s1", start: 0, dur: 5.76 },
  { id: "s2", start: 5.76, dur: 9.82 },
  { id: "s3", start: 15.58, dur: 8.02 },
  { id: "s4", start: 23.59, dur: 6.46 },
  { id: "s5", start: 30.05, dur: 9.79 },
  { id: "s6", start: 39.84, dur: 7.58 },
  { id: "s7", start: 47.42, dur: 8.06 },
  { id: "s8", start: 55.49, dur: 6.94 },
];

// ═══════════ HELPERS ═══════════
const fi = (f: number, d: number, dur: number) =>
  interpolate(f - d, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const sp = (f: number, delay = 0, damp = 10, stiff = 100) =>
  spring({ frame: Math.max(0, f - delay), fps: FPS, config: { damping: damp, stiffness: stiff } });

const CountUp: React.FC<{ f: number; value: number; delay: number; style?: React.CSSProperties; prefix?: string; suffix?: string; decimals?: number }> =
  ({ f, value, delay, style, prefix = "", suffix = "", decimals = 0 }) => {
    const t = Math.min(1, Math.max(0, (f - delay) / 25));
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const display = (value * eased).toFixed(decimals);
    const parts = display.split(".");
    return (
      <span style={{ fontFamily: FONT, fontWeight: 900, ...style }}>
        {prefix}{Number(parts[0]).toLocaleString()}{parts[1] ? `.${parts[1]}` : ""}{suffix}
      </span>
    );
  };

// ═══════════ BACKGROUND EFFECTS ═══════════
const GridBg: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => (
  <div style={{
    position: "absolute", inset: 0, opacity,
    backgroundImage: `linear-gradient(${CYAN}22 1px, transparent 1px), linear-gradient(90deg, ${CYAN}22 1px, transparent 1px)`,
    backgroundSize: "60px 60px",
  }} />
);

const Particles: React.FC = () => {
  const f = useCurrentFrame();
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 1920, y: Math.random() * 1080,
      r: 1 + Math.random() * 2, speed: 0.2 + Math.random() * 0.8,
      opacity: 0.2 + Math.random() * 0.5,
    })), []);
  return (
    <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={(p.y + f * p.speed * 0.5) % 1080} r={p.r}
          fill={CYAN} opacity={p.opacity * (0.5 + 0.5 * Math.sin(f * 0.02 + i))} />
      ))}
    </svg>
  );
};

// ═══════════ GLOW CARD ═══════════
const GlowCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; glow?: string }> =
  ({ children, style, glow = CYAN }) => (
    <div style={{
      background: DARK_CARD, borderRadius: 16, padding: "24px 32px",
      border: `1px solid ${glow}22`, boxShadow: `0 0 30px ${glow}10, inset 0 1px 0 ${glow}08`,
      ...style,
    }}>
      {children}
    </div>
  );

const SceneWrap: React.FC<{ sec: typeof S[0]; children: React.ReactNode }> = ({ sec, children }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS, df = sec.dur * FPS, lf = f - sf;
  if (lf < 0 || lf >= df) return null;
  const op = interpolate(lf, [0, 5, df - 6, df], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: BG, opacity: op }}>{children}</AbsoluteFill>;
};

// ═══════════ SCENE 1: TITLE ═══════════
const S1: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  return (
    <SceneWrap sec={sec}>
      <GridBg />
      <Particles />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Decorative circle pulse */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          border: `1px solid ${CYAN}22`, transform: `scale(${interpolate(f - sf, [0, 60], [0.6, 1.2])})`,
          opacity: interpolate(f - sf, [0, 80], [0, 0.3]),
        }} />
        <div style={{
          position: "absolute", width: 350, height: 350, borderRadius: "50%",
          background: `radial-gradient(circle, ${CYAN}10 0%, transparent 70%)`,
          transform: `scale(${interpolate(f - sf, [10, 80], [0.4, 1.1])})`,
          opacity: interpolate(f - sf, [10, 80], [0, 0.4]),
        }} />
        {/* Title */}
        <div style={{
          fontFamily: FONT, fontSize: 60, fontWeight: 900, color: WHITE, letterSpacing: 10,
          opacity: fi(f - sf, 4, 15), textAlign: "center", lineHeight: 1.3,
          textShadow: `0 0 60px ${CYAN}40`,
        }}>
          重庆 2025
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 28, fontWeight: 400, color: CYAN, letterSpacing: 8, marginTop: 16,
          opacity: fi(f - sf, 12, 15),
          textShadow: `0 0 30px ${CYAN}30`,
        }}>
          3.38 万亿经济答卷
        </div>
        <div style={{
          position: "absolute", bottom: 60, fontFamily: FONT, fontSize: 14, color: GRAY, letterSpacing: 3,
          opacity: fi(f - sf, 28, 12),
        }}>
          数据来源：重庆市统计局 · 2025年统计公报
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ SCENE 2: GDP OVERVIEW ═══════════
const S2: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;
  return (
    <SceneWrap sec={sec}>
      <GridBg opacity={0.04} />
      <AbsoluteFill style={{ padding: "50px 80px" }}>
        {/* Section label */}
        <div style={{ fontFamily: FONT, fontSize: 14, color: CYAN, letterSpacing: 6, opacity: fi(lf, 0, 8) }}>
          GDP 总量
        </div>
        {/* Main number */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 16, marginBottom: 32 }}>
          <CountUp f={lf} value={33757.93} delay={6} suffix=" 亿" decimals={2}
            style={{ fontSize: 80, color: WHITE, textShadow: `0 0 50px ${CYAN}30` }} />
          <div style={{
            fontFamily: FONT, fontSize: 40, fontWeight: 700, color: GREEN,
            background: `${GREEN}18`, padding: "6px 20px", borderRadius: 10,
            opacity: fi(lf, 30, 10), transform: `scale(${sp(lf, 28, 8, 120)})`,
          }}>+5.3%</div>
        </div>
        {/* Metric grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
          {[
            { label: "全国排名", value: "第 16 位", sub: "↑ 1 位", accent: CYAN },
            { label: "高于全国", value: "+0.3pp", sub: "全国 5.0%", accent: GREEN },
            { label: "人均 GDP", value: "10.59 万", sub: "+5.3% · 首破10万", accent: GOLD },
            { label: "增速趋势", value: "逐季回升", sub: "4.3→5.0→5.3", accent: PURPLE },
          ].map((m, i) => (
            <GlowCard key={i} glow={m.accent} style={{
              opacity: fi(lf, 14 + i * 7, 12),
              transform: `translateY(${interpolate(fi(lf, 14 + i * 7, 12), [0, 1], [24, 0])}px)`,
            }}>
              <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY, letterSpacing: 2, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: m.accent, textShadow: `0 0 20px ${m.accent}20` }}>{m.value}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: GRAY, marginTop: 4 }}>{m.sub}</div>
            </GlowCard>
          ))}
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ SCENE 3: QUARTERLY TREND ═══════════
const S3: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;
  const w = 1920, h = 1080;
  const pad = { top: 160, right: 140, left: 180, bottom: 180 };
  const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;

  const data = [{ label: "Q1", v: 4.3 }, { label: "H1", v: 5.0 }, { label: "Q1-Q3", v: 5.3 }, { label: "全年", v: 5.3 }];
  const yMin = 3.8, yMax = 5.6;
  const gx = (i: number) => pad.left + (i / (data.length - 1)) * pw;
  const gy = (v: number) => pad.top + ph - ((v - yMin) / (yMax - yMin)) * ph;
  const natY = gy(5.0);

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${gx(i)} ${gy(d.v)}`).join(" ");
  const areaPath = `${linePath} L ${gx(data.length - 1)} ${gy(yMin)} L ${gx(0)} ${gy(yMin)} Z`;
  const drawP = fi(lf, 3, 35);

  return (
    <SceneWrap sec={sec}>
      <AbsoluteFill style={{ padding: "40px 80px" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, color: CYAN, letterSpacing: 6 }}>逐季回升态势</div>
        <div style={{ fontFamily: FONT, fontSize: 22, color: WHITE, fontWeight: 700, marginTop: 6 }}>
          GDP 累计增速：4.3% → 5.0% → 5.3%
        </div>
      </AbsoluteFill>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        {/* Grid */}
        {[3.8, 4.2, 4.6, 5.0, 5.4, 5.6].map(v => (
          <g key={v}>
            <line x1={pad.left} y1={gy(v)} x2={pad.left + pw} y2={gy(v)} stroke={v === 5.0 ? `${RED}55` : `${GRAY}18`}
              strokeWidth={v === 5.0 ? 1.5 : 0.5} strokeDasharray={v === 5.0 ? "6 3" : "3 3"} />
            <text x={pad.left - 14} y={gy(v) + 5} textAnchor="end" fontFamily={FONT} fontSize={13}
              fill={v === 5.0 ? RED : GRAY}>{v}%</text>
          </g>
        ))}
        <text x={pad.left + pw - 10} y={natY - 8} textAnchor="end" fontFamily={FONT} fontSize={13}
          fill={RED} opacity={fi(lf, 15, 10)}>全国 5.0%</text>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#areaGrad)`} opacity={drawP * 0.5} />
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CYAN} stopOpacity={0.6} />
            <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={linePath} fill="none" stroke={CYAN} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={String(pw * 2)} strokeDashoffset={pw * 2 * (1 - drawP)}
          style={{ filter: `drop-shadow(0 0 8px ${CYAN}80)` }} />

        {/* Points */}
        {data.map((d, i) => {
          const show = drawP > i / data.length;
          return (
            <g key={i} opacity={show ? 1 : 0}>
              <circle cx={gx(i)} cy={gy(d.v)} r={16} fill="transparent" stroke={CYAN} strokeWidth={1} opacity={0.2}>
                <animate attributeName="r" from={16} to={30} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from={0.2} to={0} dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={gx(i)} cy={gy(d.v)} r={7} fill={BG} stroke={CYAN} strokeWidth={3}
                style={{ filter: `drop-shadow(0 0 12px ${CYAN})` }} />
              <text x={gx(i)} y={gy(d.v) - 22} textAnchor="middle" fontFamily={FONT} fontSize={22} fontWeight={900}
                fill={CYAN} style={{ textShadow: `0 0 15px ${CYAN}60` }}>{d.v}%</text>
              <text x={gx(i)} y={gy(yMin) + 40} textAnchor="middle" fontFamily={FONT} fontSize={15} fill={GRAY}>{d.label}</text>
            </g>
          );
        })}

        {/* Animated arrow */}
        <g opacity={fi(lf, 25, 10)}>
          <path d={`M ${gx(0) + 30} ${gy(4.6)} L ${gx(2) - 30} ${gy(4.9)}`} fill="none" stroke={GOLD} strokeWidth={2}
            markerEnd="url(#arrow)" strokeDasharray="6 3" />
          <text x={(gx(0) + gx(2)) / 2 - 40} y={gy(4.55)} fontFamily={FONT} fontSize={13} fill={GOLD} textAnchor="end">逐季回升 ↑</text>
        </g>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={GOLD} />
          </marker>
        </defs>
      </svg>
    </SceneWrap>
  );
};

// ═══════════ SCENE 4: INDUSTRY STRUCTURE ═══════════
const S4: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;
  const sectors = [
    { name: "一产", pct: 6.3, color: GREEN, val: "2,124亿" },
    { name: "二产", pct: 34.9, color: "#4299e1", val: "11,788亿" },
    { name: "三产", pct: 58.8, color: CYAN, val: "19,846亿" },
  ];

  // Donut chart
  const cx = 250, cy = 400, outerR = 180, innerR = 110;
  let cumAngle = -Math.PI / 2;
  const donutProgress = fi(lf, 2, 20);

  const getArc = (pct: number, startAngle: number) => {
    const angle = (pct / 100) * Math.PI * 2 * donutProgress;
    const endAngle = startAngle + angle;
    const x1 = cx + outerR * Math.cos(startAngle), y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle), y2 = cy + outerR * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return `M ${cx + innerR * Math.cos(startAngle)} ${cy + innerR * Math.sin(startAngle)} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${cx + innerR * Math.cos(endAngle)} ${cy + innerR * Math.sin(endAngle)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${cx + innerR * Math.cos(startAngle)} ${cy + innerR * Math.sin(startAngle)}`;
  };

  let arcs: { d: string; color: string; pct: number; name: string }[] = [];
  let angle = -Math.PI / 2;
  for (const s of sectors) {
    arcs.push({ d: getArc(s.pct, angle), color: s.color, pct: s.pct, name: s.name });
    angle += (s.pct / 100) * Math.PI * 2 * donutProgress;
  }

  return (
    <SceneWrap sec={sec}>
      <AbsoluteFill style={{ padding: "40px 80px" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, color: CYAN, letterSpacing: 6 }}>产业结构</div>
        <div style={{ fontFamily: FONT, fontSize: 20, color: WHITE, fontWeight: 700, marginTop: 6 }}>
          6.3 : 34.9 : 58.8 · 服务业贡献率 67.4%
        </div>
        <div style={{ display: "flex", marginTop: 20 }}>
          {/* Donut */}
          <svg width="500" height="800" viewBox="0 0 500 800">
            {arcs.map((a, i) => (
              <path key={i} d={a.d} fill={a.color} opacity={0.85} style={{ filter: `drop-shadow(0 0 8px ${a.color}40)` }} />
            ))}
            <circle cx={cx} cy={cy} r={innerR} fill={BG} />
            <text x={cx} y={cy - 10} textAnchor="middle" fontFamily={FONT} fontSize={36} fontWeight={900} fill={WHITE}>58.8%</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontFamily={FONT} fontSize={14} fill={GRAY}>服务业占比</text>
          </svg>

          {/* Legend + detail cards */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
            {sectors.map((s, i) => (
              <GlowCard key={i} glow={s.color} style={{
                opacity: fi(lf, 12 + i * 6, 10),
                transform: `translateX(${interpolate(fi(lf, 12 + i * 6, 10), [0, 1], [30, 0])}px)`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: s.color, boxShadow: `0 0 12px ${s.color}60` }} />
                  <span style={{ fontFamily: FONT, fontSize: 16, color: WHITE, fontWeight: 600, flex: 1 }}>{s.name}</span>
                  <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: s.color }}>{s.pct}%</span>
                  <span style={{ fontFamily: FONT, fontSize: 15, color: GRAY, width: 80, textAlign: "right" }}>{s.val}</span>
                </div>
              </GlowCard>
            ))}
            {/* Service contribution highlight */}
            <div style={{
              marginTop: 8, padding: "16px 20px", borderRadius: 12,
              background: `linear-gradient(90deg, ${CYAN}15, transparent)`,
              borderLeft: `3px solid ${CYAN}`, opacity: fi(lf, 28, 10),
            }}>
              <span style={{ fontFamily: FONT, fontSize: 15, color: CYAN }}>
                服务业拉动 GDP 增长 <span style={{ fontSize: 22, fontWeight: 900 }}>3.5</span> 个百分点
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ SCENE 5: INDUSTRY HIGHLIGHTS ═══════════
const S5: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;

  const bars = [
    { label: "规上工业", val: 5.9, color: CYAN },
    { label: "制造业", val: 7.0, color: GREEN },
    { label: "新能源汽车", val: 13.4, color: GOLD },
    { label: "战新产业占比", val: 36.3, color: PURPLE, isPct: true },
  ];

  const maxV = 40;
  const barAreaW = 700;

  return (
    <SceneWrap sec={sec}>
      <AbsoluteFill style={{ padding: "50px 80px" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, color: CYAN, letterSpacing: 6 }}>工业引擎</div>
        <div style={{ fontFamily: FONT, fontSize: 20, color: WHITE, fontWeight: 700, marginTop: 6 }}>
          制造业驱动 · 新能源汽车领跑 · 高于全国0.1pp
        </div>
        {/* Horizontal bars */}
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 20 }}>
          {bars.map((b, i) => {
            const barW = (b.val / maxV) * barAreaW;
            const animW = interpolate(fi(lf, i * 6, 18), [0, 1], [0, barW]);
            return (
              <div key={i} style={{ opacity: fi(lf, i * 5, 10) }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: FONT, fontSize: 16, color: WHITE, width: 180 }}>{b.label}</span>
                  <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: b.color, marginLeft: 10 }}>
                    {b.isPct ? `${b.val}%` : `+${b.val}%`}
                  </span>
                </div>
                <div style={{ height: 28, width: barAreaW, background: `${GRAY}22`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: animW, borderRadius: 6,
                    background: `linear-gradient(90deg, ${b.color}dd, ${b.color})`,
                    boxShadow: `0 0 20px ${b.color}40`,
                    transition: "width 0.05s linear",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Bottom stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 28 }}>
          <GlowCard glow={GOLD} style={{ opacity: fi(lf, 24, 10) }}>
            <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY }}>智能网联新能源汽车增加值</div>
            <div style={{ fontFamily: FONT, fontSize: 42, fontWeight: 900, color: GOLD, textShadow: `0 0 25px ${GOLD}30` }}>+13.4%</div>
          </GlowCard>
          <GlowCard glow={PURPLE} style={{ opacity: fi(lf, 30, 10) }}>
            <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY }}>战略性新兴产业占规上工业</div>
            <div style={{ fontFamily: FONT, fontSize: 42, fontWeight: 900, color: PURPLE, textShadow: `0 0 25px ${PURPLE}30` }}>36.3%</div>
          </GlowCard>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ SCENE 6: CONSUMPTION + TRADE ═══════════
const S6: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;

  return (
    <SceneWrap sec={sec}>
      <AbsoluteFill style={{ padding: "50px 80px" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, color: CYAN, letterSpacing: 6 }}>消费与外贸</div>
        {/* Hero */}
        <GlowCard glow={GOLD} style={{
          marginTop: 16, textAlign: "center", padding: "32px",
          background: `linear-gradient(135deg, ${DARK_CARD}, ${GOLD}10)`,
          opacity: fi(lf, 2, 10),
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, color: GRAY, letterSpacing: 4, marginBottom: 10 }}>
            社会消费品零售总额
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 20 }}>
            <span style={{ fontFamily: FONT, fontSize: 44, fontWeight: 900, color: WHITE }}>全国城市</span>
            <span style={{
              fontFamily: FONT, fontSize: 72, fontWeight: 900, color: GOLD,
              textShadow: `0 0 60px ${GOLD}50, 0 0 120px ${GOLD}30`,
              filter: `drop-shadow(0 0 25px ${GOLD}60)`,
            }}>第 1 位</span>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 16, color: GRAY, marginTop: 10 }}>同比增长 3.1% · 历史性突破</div>
        </GlowCard>
        {/* Side stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 20 }}>
          {[
            { label: "外贸进出口", value: "+12%", sub: "中欧班列+陆海新通道", accent: CYAN },
            { label: "一般公共预算收入", value: "+5.4%", sub: "财政运行稳健", accent: GREEN },
            { label: "民营占GDP比重", value: "61.6%", sub: "增加值20,792亿", accent: GOLD },
          ].map((m, i) => (
            <GlowCard key={i} glow={m.accent} style={{
              opacity: fi(lf, 12 + i * 7, 10),
              transform: `translateY(${interpolate(fi(lf, 12 + i * 7, 10), [0, 1], [20, 0])}px)`,
            }}>
              <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, color: m.accent, textShadow: `0 0 20px ${m.accent}20` }}>{m.value}</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY, marginTop: 6 }}>{m.sub}</div>
            </GlowCard>
          ))}
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ SCENE 7: PRIVATE ECONOMY ═══════════
const S7: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;

  return (
    <SceneWrap sec={sec}>
      <GridBg opacity={0.04} />
      <Particles />
      <AbsoluteFill style={{ padding: "50px 80px" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, color: CYAN, letterSpacing: 6 }}>民营经济与民生</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 30 }}>
          <GlowCard glow={GOLD} style={{
            opacity: fi(lf, 2, 10), textAlign: "center", padding: "36px",
            background: `linear-gradient(180deg, ${GOLD}10, ${DARK_CARD})`,
          }}>
            <div style={{ fontFamily: FONT, fontSize: 15, color: GRAY, marginBottom: 12 }}>民营经济增加值</div>
            <CountUp f={lf} value={20792} delay={6} suffix=" 亿元"
              style={{ fontSize: 56, color: WHITE, textShadow: `0 0 40px ${GOLD}30` }} />
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
              <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: GREEN }}>+5.4%</span>
              <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: GOLD, background: `${GOLD}18`, padding: "4px 14px", borderRadius: 8 }}>
                占全市 61.6%
              </span>
            </div>
          </GlowCard>
          <GlowCard glow={CYAN} style={{
            opacity: fi(lf, 10, 10), textAlign: "center", padding: "36px",
            background: `linear-gradient(180deg, ${CYAN}10, ${DARK_CARD})`,
          }}>
            <div style={{ fontFamily: FONT, fontSize: 15, color: GRAY, marginBottom: 12 }}>人均 GDP</div>
            <CountUp f={lf} value={105874} delay={14} suffix=" 元"
              style={{ fontSize: 56, color: CYAN, textShadow: `0 0 40px ${CYAN}30` }} />
            <div style={{ marginTop: 16 }}>
              <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: CYAN }}>+5.3%</span>
              <span style={{ fontFamily: FONT, fontSize: 15, color: GRAY, marginLeft: 8 }}>首破 10 万元</span>
            </div>
          </GlowCard>
        </div>
        {/* Milestone banner */}
        <div style={{
          marginTop: 28, textAlign: "center", padding: "20px",
          background: `linear-gradient(90deg, ${CYAN}10, ${GOLD}10, ${CYAN}10)`,
          borderRadius: 12, border: `1px solid ${GOLD}22`,
          opacity: fi(lf, 24, 10),
        }}>
          <span style={{ fontFamily: FONT, fontSize: 20, color: WHITE, letterSpacing: 3 }}>
            中西部首个 GDP 突破 <span style={{ color: GOLD, fontWeight: 900 }}>3 万亿</span> 城市 · 十四五圆满收官
          </span>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ SCENE 8: SUMMARY ═══════════
const S8: React.FC<{ sec: typeof S[0] }> = ({ sec }) => {
  const f = useCurrentFrame();
  const sf = sec.start * FPS;
  const lf = f - sf;

  const items = [
    { label: "GDP", value: "33,758亿", sub: "+5.3%", accent: CYAN },
    { label: "社零", value: "全国第1", sub: "+3.1%", accent: GOLD },
    { label: "外贸", value: "+12%", sub: "高速增长", accent: GREEN },
    { label: "人均GDP", value: "10.6万", sub: "首破十万", accent: PURPLE },
    { label: "规上工业", value: "+5.9%", sub: "制造业+7%", accent: CYAN },
    { label: "民营", value: "61.6%", sub: "2.08万亿", accent: GOLD },
  ];

  return (
    <SceneWrap sec={sec}>
      <GridBg opacity={0.03} />
      <Particles />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "50px 80px" }}>
        <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 900, color: WHITE, letterSpacing: 8, marginBottom: 36, textShadow: `0 0 40px ${CYAN}30` }}>
          重庆 2025 · 关键数字
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, width: "100%" }}>
          {items.map((m, i) => (
            <div key={i} style={{
              background: `${m.accent}10`, borderRadius: 14, padding: "18px 20px",
              border: `1px solid ${m.accent}22`, textAlign: "center",
              opacity: fi(lf, i * 5, 10),
              transform: `scale(${sp(lf, i * 4, 12, 80)})`,
            }}>
              <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY, letterSpacing: 2 }}>{m.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: m.accent, margin: "8px 0", textShadow: `0 0 20px ${m.accent}30` }}>{m.value}</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: GRAY }}>{m.sub}</div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 36, fontFamily: FONT, fontSize: 22, color: WHITE, letterSpacing: 6,
          opacity: fi(lf, 24, 10), textShadow: `0 0 30px ${CYAN}30`,
        }}>
          逐季回升 · 向新向上
        </div>
        <div style={{
          marginTop: 14, fontFamily: FONT, fontSize: 14, color: GRAY, letterSpacing: 3,
          opacity: fi(lf, 30, 10),
        }}>
          数据来源：重庆市统计局 2025年国民经济和社会发展统计公报
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ═══════════ MAIN ═══════════
const sceneMap: Record<string, React.FC<{ sec: typeof S[0] }>> = {
  s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, s7: S7, s8: S8,
};

const ChongqingEcon: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const current = S.find(s => sec >= s.start && sec < s.start + s.dur);
  if (!current) return null;
  const Comp = sceneMap[current.id];
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Audio src={staticFile("audio/cq_narration.mp3")} />
      <Comp sec={current} />
    </AbsoluteFill>
  );
};

export default ChongqingEcon;
