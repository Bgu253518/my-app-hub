import React, { useMemo } from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  Sequence, Audio, interpolate, spring, staticFile, Composition,
} from "remotion";

const CYAN = "#00d4ff"; const PURPLE = "#7c3aed"; const RED = "#ff6b6b";
const WHITE = "#e2e8f0"; const DARK = "#0a0a14"; const GRAY = "#64748b";
const FONT = '"Microsoft YaHei","PingFang SC",sans-serif';

const S = [0,100,240,340,440,560,680,910];

const captions = [
  { s: S[0], e: S[1], t: "1950年，图灵问了一个问题。" },
  { s: S[1], e: S[2], t: "1956年，达特茅斯给了它一个名字：人工智能。" },
  { s: S[2], e: S[3], t: "1997年，深蓝让世界沉默。" },
  { s: S[3], e: S[4], t: "2012年，深度学习睁开双眼。" },
  { s: S[4], e: S[5], t: "2017年，Transformer重塑一切。" },
  { s: S[5], e: S[6], t: "2022年，ChatGPT点燃全球。" },
  { s: S[6], e: S[7], t: "今天，AI Agent正在重新定义人类。" },
];

const CaptionBar: React.FC = () => {
  const f = useCurrentFrame();
  const cap = captions.find(c => f >= c.s && f < c.e);
  const lf = cap ? f - cap.s : 0;
  const op = interpolate(lf, [0, 8, 60, 80], [0, 1, 1, 0], { extrapolateLeft:"clamp", extrapolateRight:"clamp" });
  if (!cap) return null;
  const hl: Record<string,string> = {"图灵":CYAN,"人工智能":CYAN,"深蓝":RED,"深度学习":PURPLE,"Transformer":CYAN,"ChatGPT":RED,"AI Agent":CYAN};
  let text = cap.t;
  for (const [k,v] of Object.entries(hl)) text = text.replace(k, `|${k}|`);
  const parts = text.split("|");
  return (
    <div style={{ position:"absolute", bottom:85, left:0, right:0, display:"flex", justifyContent:"center", opacity:op, zIndex:10 }}>
      <span style={{ fontFamily:FONT, fontSize:30, fontWeight:700, color:WHITE, textShadow:"0 2px 10px rgba(0,0,0,0.9)", letterSpacing:4, textAlign:"center", padding:"10px 24px", background:"rgba(0,0,0,0.5)", borderRadius:8 }}>
        {parts.map((p,i) => hl[p] ? <span key={i} style={{ color:hl[p], fontSize:34 }}>{p}</span> : <span key={i}>{p}</span>)}
      </span>
    </div>
  );
};

const fi = (f:number, d=0, dur=15) => interpolate(f-d, [0,dur], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp" });
const sp = (f:number, damp=12, stiff=80, dur=35, delay=0) => spring({ frame:Math.max(0,f-delay), fps:30, config:{damping:damp,stiffness:stiff}, durationInFrames:dur });

const FadeWrap: React.FC<{children:React.ReactNode; frames:number}> = ({children,frames}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity:interpolate(f, [0,8,frames-12,frames], [0,1,1,0], {extrapolateLeft:"clamp",extrapolateRight:"clamp"}) }}>{children}</AbsoluteFill>;
};

// ── 场景1: 1950 图灵 ──────────────────────────────────────
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent:"center", alignItems:"center", fontFamily:FONT, background:`radial-gradient(ellipse at 50% 60%, #0f172a 0%, ${DARK} 70%)` }}>
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${CYAN}15 0%, transparent 70%)`, opacity:interpolate(f,[0,60],[0,0.6]), transform:`scale(${interpolate(f,[0,80],[0.3,1.2])})` }} />
      <div style={{ position:"absolute", top:"18%", opacity:fi(f,0,20) }}>
        <span style={{ fontSize:18, color:GRAY, letterSpacing:8 }}>THE BEGINNING</span>
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:20, opacity:fi(f,15,20), transform:`translateY(${(1-sp(f,10,80,30,15))*40}px)` }}>
        <span style={{ fontSize:90, fontWeight:"bold", color:CYAN, textShadow:`0 0 40px ${CYAN}60`, letterSpacing:8 }}>1950</span>
      </div>
      <div style={{ marginTop:16, opacity:fi(f,50,20) }}>
        <span style={{ fontSize:36, color:WHITE, letterSpacing:6 }}>图灵之问</span>
      </div>
      <div style={{ marginTop:10, opacity:fi(f,70,15) }}>
        <span style={{ fontSize:16, color:GRAY, letterSpacing:4 }}>"Can machines think?"</span>
      </div>
      <div style={{ position:"absolute", bottom:"18%", display:"flex", gap:8, opacity:fi(f,80,15) }}>
        {Array.from({length:7}).map((_,i) => <div key={i} style={{ width:4, height:4, borderRadius:"50%", background:i===0?CYAN:`${WHITE}30` }} />)}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2: 1956 达特茅斯 ────────────────────────────────
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const dots = useMemo(() => Array.from({length:60}, (_,i) => ({ x:100+(i%10)*100, y:80+Math.floor(i/10)*90, d:i*3 })), []);
  return (
    <AbsoluteFill style={{ justifyContent:"center", fontFamily:FONT, background:`linear-gradient(135deg, ${DARK} 0%, #0f172a 100%)` }}>
      {dots.map((d,i) => <div key={i} style={{ position:"absolute", left:d.x, top:d.y, width:2, height:2, borderRadius:"50%", background:i%7===0?CYAN:`${WHITE}10`, opacity:fi(f,d.d,10) }} />)}
      <div style={{ position:"absolute", left:120, top:"30%", opacity:fi(f,10,20) }}>
        <span style={{ fontSize:80, fontWeight:"bold", color:CYAN, textShadow:`0 0 30px ${CYAN}40`, letterSpacing:6 }}>1956</span>
      </div>
      <div style={{ position:"absolute", right:120, top:"25%", width:500, opacity:fi(f,50,20) }}>
        <span style={{ fontSize:38, fontWeight:"bold", color:WHITE, letterSpacing:6 }}>达特茅斯会议</span>
        <div style={{ marginTop:16, fontSize:20, color:GRAY, letterSpacing:4, lineHeight:2 }}>
          首次提出<br /><span style={{ color:CYAN, fontSize:28 }}>"人工智能"</span><br />这个词汇诞生
        </div>
      </div>
      <div style={{ position:"absolute", left:120, bottom:"20%", opacity:fi(f,100,15) }}>
        <div style={{ width:interpolate(f,[100,200],[0,300],{extrapolateRight:"clamp"}), height:1, background:`linear-gradient(90deg,${CYAN},transparent)` }} />
        <span style={{ fontSize:14, color:GRAY, letterSpacing:4, marginTop:8 }}>AI 的元年</span>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3: 1997 深蓝 ────────────────────────────────────
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent:"center", alignItems:"center", fontFamily:FONT, background:`radial-gradient(ellipse at center, #1a0a0a 0%, ${DARK} 70%)` }}>
      {[0,1,2].map(i => <div key={i} style={{ position:"absolute", width:200+i*60, height:200+i*60, borderRadius:"50%", border:`1px solid ${RED}${10+i*5}`, opacity:interpolate(f,[i*15,60],[0,0.5]), transform:`scale(${interpolate(f,[0,80],[0.5+i*0.2,1.5+i*0.2])})` }} />)}
      <div style={{ opacity:fi(f,10,20), transform:`scale(${0.5+sp(f,12,100,30,10)*0.5})` }}>
        <span style={{ fontSize:80, fontWeight:"bold", color:RED, textShadow:`0 0 40px ${RED}50`, letterSpacing:8 }}>1997</span>
      </div>
      <div style={{ marginTop:20, opacity:fi(f,40,20) }}>
        <span style={{ fontSize:42, fontWeight:"bold", color:WHITE, letterSpacing:8 }}>深 蓝</span>
      </div>
      <div style={{ position:"absolute", bottom:"20%", display:"flex", gap:40, opacity:fi(f,80,15) }}>
        <div style={{ textAlign:"center" }}><span style={{ fontSize:28, color:CYAN }}>♚</span><br /><span style={{ fontSize:13, color:GRAY, letterSpacing:3 }}>人类</span></div>
        <div style={{ fontSize:24, color:RED, alignSelf:"center" }}>VS</div>
        <div style={{ textAlign:"center" }}><span style={{ fontSize:28, color:CYAN }}>♔</span><br /><span style={{ fontSize:13, color:GRAY, letterSpacing:3 }}>机器</span></div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4: 2012 深度学习 ──────────────────────────────────
const NeuralNet: React.FC<{f:number}> = ({f}) => {
  const nodes = [0,1,2,3].flatMap(layer => [0,1,2,3,4].map(node => ({ x:300+layer*300, y:150+node*150, l:layer, n:node })));
  return (
    <svg viewBox="0 0 1800 900" style={{ position:"absolute", inset:0, opacity:fi(f,30,20)*0.5 }}>
      {nodes.map((a,i) => nodes.filter(b => b.l===a.l+1).map((b,j) => {
        const prog = interpolate(f, [40+j*5, 80+j*5], [0,1], {extrapolateRight:"clamp"});
        return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={CYAN} strokeWidth="0.5" strokeOpacity={0.2*prog} />;
      }))}
      {nodes.map((n,i) => <circle key={i} cx={n.x} cy={n.y} r={n.l===0?6:n.l===3?5:3} fill={n.l===0?CYAN:n.l===3?PURPLE:`${WHITE}25`} opacity={fi(f,20+i*3,15)} />)}
    </svg>
  );
};

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent:"center", alignItems:"center", fontFamily:FONT, background:`linear-gradient(180deg, #0a0a1a 0%, #0f0f2a 100%)` }}>
      <NeuralNet f={f} />
      <div style={{ zIndex:2, opacity:fi(f,5,15) }}>
        <span style={{ fontSize:70, fontWeight:"bold", color:PURPLE, textShadow:`0 0 30px ${PURPLE}50`, letterSpacing:6 }}>2012</span>
      </div>
      <div style={{ zIndex:2, marginTop:14, opacity:fi(f,50,20) }}>
        <span style={{ fontSize:34, fontWeight:"bold", color:WHITE, letterSpacing:6 }}>深度学习崛起</span>
      </div>
      <div style={{ zIndex:2, marginTop:12, opacity:fi(f,90,15) }}>
        <span style={{ fontSize:16, color:GRAY, letterSpacing:4 }}>AlexNet · ImageNet · GPU 训练</span>
      </div>
      <div style={{ position:"absolute", bottom:"12%", zIndex:2, display:"flex", gap:20, opacity:fi(f,130,15) }}>
        {["视觉","语音","NLP"].map((t,i) => <span key={i} style={{ fontSize:14, color:CYAN, letterSpacing:3, padding:"6px 16px", border:`1px solid ${CYAN}30`, borderRadius:16 }}>{t}</span>)}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5: 2017 Transformer ─────────────────────────────
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const code = useMemo(() => Array.from({length:20}, (_,i) => ({
    y: -20+i*55, x: 500+Math.sin(i*0.8)*80, op:0.2+Math.random()*0.3,
    text: ["Attention(Q,K,V)","softmax(QK^T/sqrt(d))V","Multi-Head","FeedForward","LayerNorm","Positional Encoding","Encoder","Decoder","Self-Attention","Cross-Attention"][i%10]
  })), []);
  return (
    <AbsoluteFill style={{ justifyContent:"center", fontFamily:FONT, background:`linear-gradient(160deg, #0a0a0a 0%, #111122 100%)` }}>
      {code.map((c,i) => { const y = (c.y + f*0.3) % 1100 - 100;
        return <div key={i} style={{ position:"absolute", left:c.x, top:y, fontSize:12, color:CYAN, opacity:c.op, fontFamily:"monospace", letterSpacing:2 }}>{c.text}</div>; })}
      <div style={{ position:"absolute", left:100, top:"28%", opacity:fi(f,10,20) }}>
        <span style={{ fontSize:70, fontWeight:"bold", color:CYAN, textShadow:`0 0 30px ${CYAN}50`, letterSpacing:6 }}>2017</span>
      </div>
      <div style={{ position:"absolute", right:100, top:"25%", width:500, opacity:fi(f,50,20) }}>
        <span style={{ fontSize:38, fontWeight:"bold", color:WHITE, letterSpacing:4 }}>Transformer</span>
        <div style={{ marginTop:16, fontSize:18, color:GRAY, letterSpacing:3, lineHeight:2.2 }}>
          "Attention Is<br />All You Need"<br />
          <span style={{ color:CYAN, fontSize:16 }}>改写一切的架构</span>
        </div>
      </div>
      <div style={{ position:"absolute", left:100, bottom:"18%", opacity:fi(f,120,15) }}>
        <span style={{ fontSize:14, color:GRAY, letterSpacing:4 }}>GPT · BERT · T5 · LLaMA 的基石</span>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景6: 2022 ChatGPT ─────────────────────────────────
const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const bursts = useMemo(() => Array.from({length:30}, (_,i) => ({
    x:Math.random()*1920, y:Math.random()*1080, s:2+Math.random()*4,
    dx:(Math.random()-0.5)*8, dy:(Math.random()-0.5)*8,
    c: [RED,CYAN,PURPLE,WHITE][i%4]
  })), []);
  return (
    <AbsoluteFill style={{ justifyContent:"center", alignItems:"center", fontFamily:FONT, background:`radial-gradient(ellipse at 50% 50%, #1a1020 0%, ${DARK} 70%)` }}>
      {bursts.map((b,i) => { const bx = b.x + b.dx*f*0.3; const by = b.y + b.dy*f*0.3;
        return <div key={i} style={{ position:"absolute", left:bx, top:by, width:b.s, height:b.s, borderRadius:"50%", background:b.c, opacity:fi(f,i*2,10)*0.7 }} />; })}
      <div style={{ zIndex:2, opacity:fi(f,10,20), transform:`scale(${0.3+sp(f,14,120,35,10)*0.7})` }}>
        <span style={{ fontSize:70, fontWeight:"bold", color:RED, textShadow:`0 0 40px ${RED}60`, letterSpacing:6 }}>2022</span>
      </div>
      <div style={{ zIndex:2, marginTop:16, opacity:fi(f,40,20) }}>
        <span style={{ fontSize:46, fontWeight:"bold", color:WHITE, letterSpacing:4 }}>ChatGPT</span>
      </div>
      <div style={{ zIndex:2, display:"flex", gap:60, marginTop:40, opacity:fi(f,80,20) }}>
        {[{ n:"2个月", d:"破亿用户" },{ n:"GPT-4", d:"多模态" }].map((it,i) => (
          <div key={i} style={{ textAlign:"center", opacity:fi(f,80+i*20,15) }}>
            <span style={{ fontSize:28, fontWeight:"bold", color:CYAN }}>{it.n}</span>
            <div style={{ fontSize:14, color:GRAY, letterSpacing:3, marginTop:6 }}>{it.d}</div>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute", bottom:"12%", zIndex:2, opacity:fi(f,150,15) }}>
        <span style={{ fontSize:16, color:GRAY, letterSpacing:4 }}>点燃全民 AI 革命</span>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景7: AI Agent ─────────────────────────────────────
const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const cards = [
    { t:"自主规划", d:"任务拆解执行", x:300, y:270, delay:0, c:CYAN },
    { t:"工具使用", d:"API/代码/MCP", x:700, y:370, delay:20, c:PURPLE },
    { t:"长期记忆", d:"跨会话上下文", x:1100, y:270, delay:40, c:CYAN },
    { t:"持续学习", d:"自我进化迭代", x:1500, y:370, delay:60, c:PURPLE },
  ];
  return (
    <AbsoluteFill style={{ justifyContent:"center", alignItems:"center", fontFamily:FONT, background:`linear-gradient(180deg, ${DARK} 0%, #0a1520 60%, #0a1a10 100%)` }}>
      <div style={{ position:"absolute", top:"12%", opacity:fi(f,0,20) }}>
        <span style={{ fontSize:52, fontWeight:"bold", color:WHITE, letterSpacing:10, textShadow:`0 0 30px ${CYAN}60` }}>AI Agent</span>
      </div>
      {cards.map((c,i) => (
        <div key={i} style={{ position:"absolute", left:c.x-160, top:c.y-60, width:320, padding:"24px 20px", borderRadius:14,
          background:`linear-gradient(135deg, ${c.c}10, ${WHITE}03)`, border:`1px solid ${c.c}20`,
          opacity:fi(f,c.delay,15), transform:`translateY(${(1-sp(f,12,100,30,c.delay))*30}px)` }}>
          <span style={{ fontSize:22, fontWeight:"bold", color:c.c, letterSpacing:4 }}>{c.t}</span>
          <div style={{ fontSize:14, color:GRAY, letterSpacing:3, marginTop:8 }}>{c.d}</div>
        </div>
      ))}
      <div style={{ position:"absolute", bottom:"15%", opacity:fi(f,130,20) }}>
        <span style={{ fontSize:28, fontWeight:"bold", color:WHITE, letterSpacing:6 }}>正在重新定义人类</span>
      </div>
      <div style={{ position:"absolute", bottom:40, left:"30%", right:"30%", height:1, background:`linear-gradient(90deg,transparent,${CYAN}50,transparent)`, opacity:fi(f,180,20) }} />
    </AbsoluteFill>
  );
};

// ── 主视频 ──────────────────────────────────────────────────
const MainVideo: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("audio/narration.mp3")} />
    <CaptionBar />
    {[[S[0],S[1]-S[0],Scene1],[S[1]-8,S[2]-S[1]+16,Scene2],[S[2]-8,S[3]-S[2]+16,Scene3],[S[3]-8,S[4]-S[3]+16,Scene4],[S[4]-8,S[5]-S[4]+16,Scene5],[S[5]-8,S[6]-S[5]+16,Scene6],[S[6]-8,S[7]-S[6]+8,Scene7]].map(([from,dur,Comp],i) =>
      <Sequence key={i} from={from as number} durationInFrames={dur as number}>
        <FadeWrap frames={dur as number}><Comp /></FadeWrap>
      </Sequence>
    )}
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <Composition id="AiVideo" component={MainVideo} durationInFrames={910} fps={30} width={1920} height={1080} />
);
