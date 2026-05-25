import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, interpolate, spring, staticFile } from "remotion";
import React, { useMemo, useRef, useLayoutEffect } from "react";

// ========== types ==========
interface SubStep { time: number; items?: string[]; narration?: string; highlight?: string; }
type SimpleScene = {
  compound?: false; scene_id: number; template: string; duration: number;
  data: Record<string, any>; postFX?: any; transition?: { type: string; duration: number };
};
type CompoundScene = {
  compound: true; scene_id: number; template: string; total_duration: number;
  data: Record<string, any>; steps: SubStep[]; postFX?: any; transition?: { type: string; duration: number };
};
type Scene = SimpleScene | CompoundScene;
interface Storyboard { scenes: Scene[]; }

// ========== helpers ==========
function hexToRgb(h: string): [number, number, number] {
  const c = h.replace("#", ""); return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
}
function lum(r: number, g: number, b: number): number { return (0.299*r + 0.587*g + 0.114*b)/255; }
function textColor(p: string[]): string {
  if (!p.length) return "#fff";
  try { const [r,g,b] = hexToRgb(p[0]); return lum(r,g,b) > 0.55 ? "#111" : "#fff"; } catch { return "#fff"; }
}
const easeOutCubic = (t: number) => 1-Math.pow(1-t,3);

// ========== CSS constants ==========
const CSS = {
  h1: { fontSize: 72, fontWeight: 700, lineHeight: 1.1 },
  h2: { fontSize: 36, fontWeight: 600, lineHeight: 1.2 },
  body: { fontSize: 28, fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: 20, fontWeight: 400, lineHeight: 1.4, opacity: 0.7 },
  hero: { fontSize: 160, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em" },
  metric: { fontSize: 48, fontWeight: 700, lineHeight: 1.1 },
  gap: 32, padding: { x: 160, y: 120 },
  font: "'PingFang SC','Microsoft YaHei','Helvetica Neue',sans-serif",
};

// ========== slide background ==========
const SlideBg: React.FC<{ palette: string[]; vignette?: boolean }> = ({ palette, vignette }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: palette.length >= 2 ? `linear-gradient(180deg, ${palette[0]}, ${palette[1]})` : palette[0] }} />
    {vignette && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />}
  </>
);

// ========== animation wrapper ==========
const Animate: React.FC<{ type: string; duration: number; localFrame: number; fps: number; children: React.ReactNode }> = ({ type, duration, localFrame, fps, children }) => {
  const end = duration*fps; let opacity=1, tx=0;
  if (localFrame < end) {
    const p = localFrame/end;
    switch(type) {
      case "fadeIn": opacity = interpolate(localFrame, [0,end], [0,1], {extrapolateRight:"clamp"}); break;
      case "slideLeft": tx = interpolate(localFrame, [0,end], [-60,0], {extrapolateRight:"clamp"}); opacity = interpolate(localFrame, [0,end*0.3], [0,1], {extrapolateRight:"clamp"}); break;
      case "scaleIn": try { opacity = spring({ frame: localFrame, fps, config: { damping:15, stiffness:120 } }); } catch { opacity = 1; } break;
    }
  }
  return <div style={{ opacity, transform: `translateX(${tx}px)` }}>{children}</div>;
};

// ========== subtitle bar ==========
const SubtitleBar: React.FC<{ text: string; palette: string[] }> = ({ text, palette }) => {
  const tc = textColor(palette);
  return (
    <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
      <div style={{ background: lum(...hexToRgb(palette[0]||"#000")) > 0.55 ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "16px 40px", maxWidth: 1400, textAlign: "center" }}>
        <span style={{ ...CSS.body, color: tc, fontWeight: 500, fontSize: 30 }}>{text}</span>
      </div>
    </div>
  );
};

// ========== TEMPLATE: hero-number ==========
const HeroNumber: React.FC<{ number: string; subtitle: string; narration?: string; palette: string[]; bgImage?: string; postFX?: any; animate?: boolean; localFrame?: number; fps?: number }> = ({ number, subtitle, narration, palette, bgImage, postFX, animate, localFrame=0, fps=30 }) => {
  const tc = textColor(palette);
  return (
    <AbsoluteFill>
      {bgImage ? (
        <div style={{ position: "absolute", inset: 0, background: `url(${staticFile(bgImage)}) center/cover no-repeat` }} />
      ) : (
        <SlideBg palette={palette} vignette={postFX?.vignette} />
      )}
      {bgImage && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: CSS.font }}>
        <Animate type="scaleIn" duration={1.0} localFrame={animate ? localFrame : 999} fps={fps}>
          <div style={{ ...CSS.hero, color: tc, textAlign: "center" }}>{number}</div>
        </Animate>
        <div style={{ height: 24 }} />
        <Animate type="fadeIn" duration={0.5} localFrame={animate ? Math.max(0, localFrame-20) : 999} fps={fps}>
          <div style={{ ...CSS.caption, color: tc, textAlign: "center", maxWidth: 800 }}>{subtitle}</div>
        </Animate>
      </div>
      {narration && <SubtitleBar text={narration} palette={palette} />}
    </AbsoluteFill>
  );
};

// ========== TEMPLATE: bullet-list ==========
const BulletList: React.FC<{ title: string; items: { text: string; metric?: string }[]; activeIdx: number; narration?: string; palette: string[]; postFX?: any; localFrame: number; fps: number }> = ({ title, items, activeIdx, narration, palette, postFX, localFrame, fps }) => {
  const tc = textColor(palette);
  const accent = palette[2] || "#ff6a00";
  return (
    <AbsoluteFill>
      <SlideBg palette={palette} vignette={postFX?.vignette} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: CSS.font, padding: `${CSS.padding.y}px ${CSS.padding.x}px` }}>
        <Animate type="fadeIn" duration={0.5} localFrame={localFrame} fps={fps}>
          <h1 style={{ ...CSS.h1, color: tc, margin: 0, marginBottom: 60 }}>{title}</h1>
        </Animate>
        <div style={{ display: "flex", flexDirection: "column", gap: CSS.gap }}>
          {items.map((item, i) => {
            const isActive = i === activeIdx, isPast = i < activeIdx;
            const itemColor = isPast ? (lum(...hexToRgb(palette[0]||"#000")) > 0.55 ? "#999" : "#555") : tc;
            return (
              <Animate key={i} type="slideLeft" duration={0.4} localFrame={isActive ? localFrame : 999} fps={fps}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: isPast ? 0.5 : 1 }}>
                  {isActive && <div style={{ width: 4, height: 36, background: accent, borderRadius: 2, flexShrink: 0 }} />}
                  {!isActive && <div style={{ width: 4, flexShrink: 0 }} />}
                  <div style={{ ...CSS.body, color: itemColor, fontWeight: isActive ? 600 : 400 }}>{item.text}</div>
                  {item.metric && <div style={{ ...CSS.metric, color: isActive ? accent : itemColor, marginLeft: "auto" }}>{item.metric}</div>}
                </div>
              </Animate>
            );
          })}
        </div>
      </div>
      {narration && <SubtitleBar text={narration} palette={palette} />}
    </AbsoluteFill>
  );
};

// ========== TEMPLATE: split-chart ==========
const SplitChart: React.FC<{ title: string; leftItems: string[]; chartData: { label: string; value: number; color?: string }[]; narration?: string; palette: string[]; postFX?: any; localFrame: number; fps: number }> = ({ title, leftItems, chartData, narration, palette, postFX, localFrame, fps }) => {
  const tc = textColor(palette);
  return (
    <AbsoluteFill>
      <SlideBg palette={palette} vignette={postFX?.vignette} />
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: CSS.font, padding: `${CSS.padding.y}px ${CSS.padding.x}px`, gap: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Animate type="fadeIn" duration={0.5} localFrame={localFrame} fps={fps}>
            <h1 style={{ ...CSS.h1, color: tc, margin: 0, marginBottom: 40 }}>{title}</h1>
          </Animate>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {leftItems.map((item, i) => (
              <Animate key={i} type="slideLeft" duration={0.35} localFrame={Math.max(0, localFrame-i*5)} fps={fps}>
                <div style={{ ...CSS.body, color: tc }}>· {item}</div>
              </Animate>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 60, paddingBottom: 40 }}>
          {chartData.map((d, i) => (
            <Animate key={i} type="fadeIn" duration={0.5} localFrame={Math.max(0, localFrame-i*10)} fps={fps}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80, height: d.value*2, background: d.color||"#ff6a00", borderRadius: "6px 6px 0 0", minHeight: 20 }} />
                <div style={{ ...CSS.caption, color: tc }}>{d.label}</div>
              </div>
            </Animate>
          ))}
        </div>
      </div>
      {narration && <SubtitleBar text={narration} palette={palette} />}
    </AbsoluteFill>
  );
};

// ========== TEMPLATE: ending ==========
const Ending: React.FC<{ title: string; subtitle: string; cta: string; narration?: string; palette: string[]; postFX?: any; localFrame: number; fps: number }> = ({ title, subtitle, cta, narration, palette, postFX, localFrame, fps }) => {
  const tc = textColor(palette);
  return (
    <AbsoluteFill>
      <SlideBg palette={palette} vignette={postFX?.vignette} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: CSS.font, padding: CSS.padding.y, gap: 32 }}>
        <Animate type="fadeIn" duration={0.6} localFrame={localFrame} fps={fps}><h1 style={{ ...CSS.h1, color: tc, margin: 0 }}>{title}</h1></Animate>
        <Animate type="fadeIn" duration={0.6} localFrame={Math.max(0, localFrame-15)} fps={fps}><div style={{ ...CSS.h2, color: tc, fontWeight: 400, opacity: 0.8 }}>{subtitle}</div></Animate>
        <div style={{ height: 40 }} />
        <Animate type="fadeIn" duration={0.6} localFrame={Math.max(0, localFrame-40)} fps={fps}><div style={{ ...CSS.caption, color: tc }}>{cta}</div></Animate>
      </div>
      {narration && <SubtitleBar text={narration} palette={palette} />}
    </AbsoluteFill>
  );
};

// ========== TEMPLATE: screen-record (with ref-based highlight positioning) ==========
interface HighlightZone { id: string; label: string; }
interface HighlightPos { x: number; y: number; w: number; h: number; label: string; }

const MockROUUI: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: "#f0f2f5", fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif", display: "flex", flexDirection: "column" }}>
    <div style={{ background: "#1a1a2e", color: "#fff", padding: "20px 40px", display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontSize: 28, fontWeight: 700 }}>📊 ROU 租赁测算器</span>
      <span style={{ fontSize: 16, opacity: 0.6 }}>CAS 21 / IFRS 16</span>
      <div data-highlight="nav-tabs" style={{ marginLeft: "auto", display: "flex", gap: 20, fontSize: 15, opacity: 0.75 }}>
        <span>📝 合同录入</span><span>📂 Excel导入</span><span>📊 测算结果</span>
      </div>
    </div>
    <div style={{ flex: 1, padding: "40px 60px", display: "flex", gap: 40 }}>
      <div data-highlight="contract-form" style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "40px 50px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 24, color: "#1a1a2e" }}>📋 租赁合同信息</h2>
        <p style={{ margin: "0 0 30px 0", fontSize: 15, color: "#888" }}>填写租赁合同的关键参数，带 * 为必填。</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px" }}>
          {[{l:"合同名称 *",v:"办公楼租赁合同"},{l:"出租方 *",v:"XX物业管理公司"},{l:"租赁资产 *",v:"办公楼第5层"},{l:"开始日期 *",v:"2025-01-01"}].map((f,i)=>(
            <div key={i}><div style={{fontSize:15,color:"#555",marginBottom:6}}>{f.l}</div><div style={{padding:"10px 16px",background:"#f8f9fb",borderRadius:8,border:"1px solid #e0e3e8",fontSize:16,color:"#1a1a2e"}}>{f.v}</div></div>
          ))}
          <div data-highlight="date-section">
            {[{l:"结束日期 *",v:"2029-12-31"},{l:"付款频率 *",v:"按月支付"},{l:"年租金（元）*",v:"600,000"},{l:"折现率（%）*",v:"4.50%"}].map((f,i)=>(
              <div key={i}><div style={{fontSize:15,color:"#555",marginBottom:6,marginTop:i>0?14:0}}>{f.l}</div><div style={{padding:"10px 16px",background:"#f8f9fb",borderRadius:8,border:"1px solid #e0e3e8",fontSize:16,color:"#1a1a2e"}}>{f.v}</div></div>
            ))}
          </div>
        </div>
        <div style={{marginTop:30,display:"flex",gap:16}}>
          <div data-highlight="start-btn" style={{padding:"12px 32px",background:"#ff6a00",color:"#fff",borderRadius:10,fontSize:18,fontWeight:600}}>🔢 开始测算</div>
          <div style={{padding:"12px 24px",background:"#fff",color:"#666",borderRadius:10,fontSize:16,border:"1px solid #ddd"}}>📥 加载示例</div>
        </div>
      </div>
      <div data-highlight="result-panel" style={{width:500,background:"#fff",borderRadius:16,padding:"40px 35px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
        <h2 style={{margin:"0 0 25px 0",fontSize:24,color:"#1a1a2e"}}>📊 测算汇总表</h2>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[{l:"使用权资产原值",v:"2,491,200",c:"#1a1a2e"},{l:"租赁负债现值",v:"2,180,000",c:"#1a1a2e"},{l:"年折旧费用",v:"498,240",c:"#ff6a00"},{l:"年利息费用",v:"98,100",c:"#00c853"},{l:"月租金（平均）",v:"50,000",c:"#7c3aed"}].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:"#f8f9fb",borderRadius:10}}>
              <span style={{fontSize:16,color:"#555"}}>{r.l}</span><span style={{fontSize:22,fontWeight:700,color:r.c,fontFamily:"'DIN Alternate',monospace"}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Map highlight ID -> auto-computed pixel rect
const idToLabel: Record<string,string> = {
  "nav-tabs": "三大功能模块",
  "contract-form": "合同必填信息",
  "date-section": "日期与付款设置",
  "start-btn": "点击开始测算",
  "result-panel": "测算结果汇总",
};

const ScreenRecord: React.FC<{ steps: { narration: string; highlight?: string }[]; activeIdx: number; localFrame: number; fps: number }> = ({ steps, activeIdx, localFrame, fps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRects = useRef<Record<string,{x:number;y:number;w:number;h:number}>>({});

  // useLayoutEffect fires synchronously during render — works in Remotion
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cr = el.getBoundingClientRect();
    const sx = 1920 / cr.width;
    const sy = 1080 / cr.height;
    const nodes = el.querySelectorAll('[data-highlight]');
    nodes.forEach((n: any) => {
      const id = n.getAttribute('data-highlight');
      const r = n.getBoundingClientRect();
      highlightRects.current[id] = {
        x: (r.left - cr.left) * sx,
        y: (r.top - cr.top) * sy,
        w: r.width * sx,
        h: r.height * sy,
      };
    });
  });

  const current = steps[Math.min(activeIdx, steps.length-1)] || steps[0];
  const highlightId = current?.highlight;
  const rect = highlightId ? highlightRects.current[highlightId] : undefined;
  const label = highlightId ? idToLabel[highlightId] : "";

  return (
    <AbsoluteFill>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <MockROUUI />
      </div>

      {rect && (
        <div style={{
          position: "absolute",
          left: rect.x, top: rect.y, width: rect.w, height: rect.h,
          border: "3px solid #ff6a00", borderRadius: 12,
          boxShadow: "0 0 0 4000px rgba(0,0,0,0.35), 0 0 20px rgba(255,106,0,0.4)",
          pointerEvents: "none", zIndex: 5,
        }}>
          <div style={{
            position: "absolute", top: -44, left: "50%", transform: "translateX(-50%)",
            background: "#ff6a00", color: "#fff", padding: "6px 20px", borderRadius: 20,
            fontSize: 18, fontWeight: 600, whiteSpace: "nowrap",
          }}>
            {label}
          </div>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(transparent, rgba(0,0,0,0.8) 40%)",
        padding: "60px 80px 40px",
      }}>
        <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: 14, padding: "20px 36px", border: "1px solid rgba(255,255,255,0.15)" }}>
          <span style={{ background: "#ff6a00", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 15, fontWeight: 600, marginRight: 16 }}>步骤 {activeIdx+1}/{steps.length}</span>
          <span style={{ fontSize: 30, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>{current.narration}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========== Compound wrapper ==========
const CompoundWrapper: React.FC<{ scene: CompoundScene; localFrame: number; fps: number }> = ({ scene, localFrame, fps }) => {
  const time = localFrame/fps;
  const activeStep = useMemo(() => { let idx=-1; for(let i=0;i<scene.steps.length;i++) if(time>=scene.steps[i].time) idx=i; return idx; }, [time, scene.steps]);
  const mergedItems = useMemo(() => {
    const items: {text:string;metric?:string}[] = [];
    for(let i=0;i<=Math.max(0,activeStep);i++) for(const item of scene.steps[i].items||[]) { const parts=item.split("|"); items.push({text:parts[0].trim(), metric:parts[1]?.trim()}); }
    return items;
  }, [activeStep, scene.steps]);
  const currentNarration = activeStep>=0&&scene.steps[activeStep]?.narration ? scene.steps[activeStep].narration : "";

  if(scene.template==="bullet-list") return <BulletList title={scene.data.title} items={mergedItems} activeIdx={mergedItems.length-1} narration={currentNarration} palette={scene.data.palette} postFX={scene.postFX} localFrame={localFrame} fps={fps} />;
  if(scene.template==="split-chart") return <SplitChart title={scene.data.title} leftItems={mergedItems.map(i=>i.text)} chartData={scene.data.chartData||[]} narration={currentNarration} palette={scene.data.palette} postFX={scene.postFX} localFrame={localFrame} fps={fps} />;
  if(scene.template==="screen-record") return <ScreenRecord steps={scene.steps.map(s=>({narration:s.narration||"",highlight:s.highlight as any}))} activeIdx={Math.max(0,activeStep)} localFrame={localFrame} fps={fps} />;
  return <HeroNumber number="?" subtitle="" palette={scene.data.palette||["#000"]} bgImage={scene.data.bgImage} />;
};

function renderScene(scene: Scene, localFrame: number, fps: number) {
  const lf = Math.max(0, Math.round(localFrame));
  if(scene.compound) return <CompoundWrapper scene={scene as CompoundScene} localFrame={lf} fps={fps} />;
  const ss = scene as SimpleScene;
  const {template, data, postFX} = ss;
  if(template==="hero-number") return <HeroNumber number={data.number} subtitle={data.subtitle} narration={data.narration} palette={data.palette} bgImage={data.bgImage} postFX={postFX} animate localFrame={lf} fps={fps} />;
  if(template==="split-chart") return <SplitChart title={data.title} leftItems={data.leftItems||[]} chartData={data.chartData||[]} narration={data.narration} palette={data.palette} postFX={postFX} localFrame={lf} fps={fps} />;
  if(template==="ending") return <Ending title={data.title} subtitle={data.subtitle} cta={data.cta} narration={data.narration} palette={data.palette} postFX={postFX} localFrame={lf} fps={fps} />;
  if(template==="screen-record") return <ScreenRecord steps={data.steps||[{narration:data.narration||""}]} activeIdx={0} localFrame={lf} fps={fps} />;
  return <HeroNumber number="?" subtitle="" palette={data.palette||["#000"]} />;
}

// ========== Main ==========
export const AlibabaVideo: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let frameOffset = 0;
  const positioned = storyboard.scenes.map((scene) => {
    const dur = scene.compound ? (scene as CompoundScene).total_duration : (scene as SimpleScene).duration;
    const durF = Math.round(dur*fps);
    const td = scene.transition?.duration ?? 0;
    const tF = Math.round(td*fps);
    const start = frameOffset; frameOffset = start+durF+tF;
    return { ...scene, startFrame: start, durationFrames: durF };
  });
  const active = positioned.find(s => frame>=s.startFrame && frame<s.startFrame+s.durationFrames);
  if(!active) {
    const last = positioned[positioned.length-1];
    return (
      <AbsoluteFill>
        <Audio src={staticFile("audio.mp3")} />
        {renderScene(last, last.durationFrames, fps)}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio.mp3")} />
      {renderScene(active, frame-active.startFrame, fps)}
    </AbsoluteFill>
  );
};
