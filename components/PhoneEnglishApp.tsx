"use client";
import { useState, useEffect, useRef } from "react";

const DS = {
  cream:    "#FAF7F2",
  paper:    "#F3EDE3",
  forest:   "#1C3A2F",
  moss:     "#2E5744",
  sage:     "#6B9E7E",
  gold:     "#C9963A",
  goldLight:"#F0C97A",
  ink:      "#1A1A1A",
  muted:    "#7A7060",
  white:    "#FFFFFF",
  errorRed: "#C0392B",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes ripple  { 0%{transform:scale(0.95);opacity:0.7} 70%{transform:scale(1.18);opacity:0} 100%{opacity:0} }
  @keyframes dots    { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes waveBar { 0%,100%{height:6px} 50%{height:22px} }
  .lesson-card:hover { transform:translateY(-3px) !important; box-shadow:0 12px 32px rgba(28,58,47,0.15) !important; }
  .cta-btn:active    { transform:scale(0.97); }
`;

const LESSONS = [
  { id:1, level:"Beginner",     topic:"자기소개",     emoji:"👋", duration:"5분",  description:"기본 인사와 자기소개 표현" },
  { id:2, level:"Beginner",     topic:"일상 대화",     emoji:"☕", duration:"5분",  description:"날씨, 주말 계획 등 일상 주제" },
  { id:3, level:"Intermediate", topic:"비즈니스 미팅", emoji:"💼", duration:"10분", description:"회의 시작, 의견 제시, 마무리" },
  { id:4, level:"Intermediate", topic:"전화 응대",     emoji:"📞", duration:"10분", description:"전화 받기, 메시지 남기기" },
  { id:5, level:"Advanced",     topic:"프레젠테이션",  emoji:"📊", duration:"15분", description:"비즈니스 발표 및 Q&A" },
  { id:6, level:"Advanced",     topic:"협상 & 설득",   emoji:"🤝", duration:"15분", description:"가격 협상, 조건 제시" },
];

const LEVEL_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  Beginner:     { label:"입문", bg:"#EAF4EE", text:"#2E5744", border:"#A8D5B8" },
  Intermediate: { label:"중급", bg:"#FDF5E6", text:"#7A5C1E", border:"#E8C97A" },
  Advanced:     { label:"고급", bg:"#F5EAF0", text:"#6B2D55", border:"#C9A0BC" },
};

function StitchBorder({ color = DS.gold, opacity = 0.35 }: { color?: string; opacity?: number }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none",
      border:`1.5px dashed ${color}`, opacity, margin:5, borderRadius:14 }}/>
  );
}

function LessonCard({ lesson, onSelect, index }: {
  lesson: typeof LESSONS[0]; onSelect: (l: typeof LESSONS[0]) => void; index: number;
}) {
  const lm = LEVEL_META[lesson.level];
  return (
    <div className="lesson-card" onClick={() => onSelect(lesson)} style={{
      position:"relative", background:DS.white, borderRadius:20, padding:"16px 18px",
      cursor:"pointer", border:`1.5px solid ${lm.border}55`,
      boxShadow:"0 4px 16px rgba(28,58,47,0.07)", transition:"all 0.25s ease",
      display:"flex", alignItems:"center", gap:14, overflow:"hidden",
      animation:`fadeUp 0.4s ${index*0.07}s both`,
    }}>
      <StitchBorder color={lm.border} opacity={0.6}/>
      <div style={{ position:"absolute", right:-16, top:-16, width:70, height:70,
        background:lm.bg, borderRadius:"50%", filter:"blur(16px)", opacity:0.9 }}/>
      <div style={{ width:52, height:52, borderRadius:16, background:lm.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24, flexShrink:0, border:`1.5px solid ${lm.border}`, position:"relative", zIndex:1 }}>
        {lesson.emoji}
      </div>
      <div style={{ flex:1, position:"relative", zIndex:1 }}>
        <div style={{ fontWeight:700, fontSize:15, color:DS.forest, fontFamily:"'Playfair Display',serif" }}>{lesson.topic}</div>
        <div style={{ fontSize:12, color:DS.muted, marginTop:3, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>{lesson.description}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, position:"relative", zIndex:1 }}>
        <span style={{ background:lm.bg, color:lm.text, fontSize:10, fontWeight:700,
          padding:"3px 10px", borderRadius:20, border:`1px solid ${lm.border}`, fontFamily:"'DM Sans',sans-serif" }}>
          {lm.label}
        </span>
        <span style={{ fontSize:11, color:DS.muted }}>⏱ {lesson.duration}</span>
      </div>
    </div>
  );
}

type Message = { role:"ai"|"user"; english?:string; korean?:string; tip?:string; text?:string };

function CallScreen({ lesson, onEnd }: { lesson: typeof LESSONS[0]; onEnd: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { role:"ai", english:`Hello! Today we'll practice "${lesson.topic}". Are you ready?`, korean:"안녕하세요! 준비되셨나요?", tip:"" }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lm = LEVEL_META[lesson.level];
  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s+1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role:"user", text:userMsg }]);
    setIsThinking(true);
    try {
      const history = messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.english || m.text || "",
      }));
      const res = await fetch("/api/chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages:[...history,{role:"user",content:userMsg}], topic:lesson.topic, level:lesson.level }),
      });
      const parsed = await res.json();
      setMessages(m => [...m, { role:"ai", ...parsed }]);
    } catch {
      setMessages(m => [...m, { role:"ai", english:"Connection lost!", korean:"연결이 끊겼어요.", tip:"" }]);
    }
    setIsThinking(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", width:"100vw", height:"100dvh",
      background:DS.forest, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
      <div style={{ padding:"22px 20px 16px", paddingTop:"max(env(safe-area-inset-top,0px) + 16px, 22px)",
        background:`linear-gradient(180deg,#0F2218 0%,${DS.forest} 100%)` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ color:DS.goldLight, fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>통화 중</div>
            <div style={{ color:DS.white, fontWeight:800, fontSize:18, marginTop:2, fontFamily:"'Playfair Display',serif" }}>{lesson.emoji} {lesson.topic}</div>
            <div style={{ color:DS.sage, fontSize:12, marginTop:2 }}>{lm.label} · {fmt(seconds)}</div>
          </div>
          <div style={{ position:"relative", width:56, height:56 }}>
            <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`2px solid ${DS.gold}44`, animation:"ripple 2s infinite" }}/>
            <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${DS.gold},${DS.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:`0 0 24px ${DS.gold}55` }}>🤖</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:3, height:28 }}>
          {Array.from({length:20}).map((_,i) => (
            <div key={i} style={{ flex:1, borderRadius:3, minHeight:4,
              background: isThinking ? DS.gold : `${DS.sage}88`,
              height: isThinking ? undefined : `${Math.sin(i)*8+10}px`,
              animation: isThinking ? `waveBar 0.8s ${(i%5)*0.12}s ease-in-out infinite` : "none" }}/>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((msg,i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column",
            alignItems:msg.role==="user"?"flex-end":"flex-start", animation:`fadeUp 0.3s ${i*0.04}s both` }}>
            {msg.role==="ai" ? (
              <div>
                <div style={{ background:"#243D32", border:`1px solid ${DS.sage}44`, borderRadius:"4px 18px 18px 18px",
                  padding:"11px 15px", maxWidth:"72vw", color:DS.white, fontSize:14, lineHeight:1.6 }}>
                  <div style={{ fontWeight:500 }}>{msg.english||msg.text}</div>
                  {msg.korean && <div style={{ fontSize:11, color:DS.sage, marginTop:5 }}>{msg.korean}</div>}
                </div>
                {msg.tip && <div style={{ marginTop:5, background:`${DS.gold}18`, border:`1px solid ${DS.gold}44`,
                  borderRadius:10, padding:"7px 12px", fontSize:11, color:DS.goldLight, maxWidth:"72vw" }}>✏️ {msg.tip}</div>}
              </div>
            ) : (
              <div style={{ background:`linear-gradient(135deg,${DS.moss},${DS.sage})`, borderRadius:"18px 4px 18px 18px",
                padding:"11px 15px", maxWidth:"60vw", color:DS.white, fontSize:14, lineHeight:1.6, fontWeight:500 }}>{msg.text}</div>
            )}
          </div>
        ))}
        {isThinking && (
          <div style={{ display:"flex", gap:5, padding:"8px 4px" }}>
            {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:DS.sage, animation:`dots 1.2s ${i*0.2}s infinite ease-in-out` }}/>)}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:"12px 16px", paddingBottom:"max(calc(env(safe-area-inset-bottom) + 12px), 20px)",
        background:`linear-gradient(0deg,#0F2218 0%,${DS.forest} 100%)`, borderTop:`1px solid ${DS.moss}66` }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="영어로 입력하세요..."
            style={{ flex:1, background:"#243D32", border:`1.5px solid ${DS.sage}55`, borderRadius:28,
              padding:"12px 18px", color:DS.white, fontSize:14, outline:"none", fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}/>
          <button onClick={send} style={{ width:46, height:46, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg,${DS.gold},${DS.goldLight})`, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>➤</button>
        </div>
        <button onClick={onEnd} style={{ width:"100%", marginTop:10, background:"transparent",
          border:`1.5px solid ${DS.errorRed}88`, borderRadius:14, padding:"11px", color:`${DS.errorRed}cc`,
          fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>📵 통화 종료</button>
      </div>
    </div>
  );
}

export default function PhoneEnglishApp() {
  const [screen, setScreen] = useState("home"); // ← 기획화면 제거, 바로 홈
  const [selectedLesson, setSelectedLesson] = useState<typeof LESSONS[0]|null>(null);
  const [filterLevel, setFilterLevel] = useState("All");
  const [activeNav, setActiveNav] = useState(0);

  const filtered = filterLevel === "All" ? LESSONS : LESSONS.filter(l => l.level === filterLevel);

  if (screen === "call" && selectedLesson) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <CallScreen lesson={selectedLesson} onEnd={() => setScreen("home")}/>
    </>
  );

  return (
    <div style={{ width:"100vw", height:"100dvh", background:DS.cream,
      fontFamily:"'DM Sans','Noto Sans KR',sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* 스크롤 영역 */}
      <div style={{ flex:1, overflowY:"auto" }}>

        {/* 히어로 헤더 */}
        <div style={{ background:`linear-gradient(160deg,${DS.forest} 0%,${DS.moss} 100%)`,
          padding:"28px 22px 32px", paddingTop:"max(calc(env(safe-area-inset-top) + 16px), 28px)",
          borderRadius:"0 0 36px 36px", position:"relative", overflow:"hidden",
          boxShadow:`0 8px 32px ${DS.forest}55` }}>
          <div style={{ position:"absolute", right:-30, top:-30, width:160, height:160,
            borderRadius:"50%", background:`${DS.gold}12`, border:`1px solid ${DS.gold}20` }}/>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"relative", zIndex:1 }}>
            <div>
              <div style={{ color:DS.sage, fontSize:11, letterSpacing:"0.07em", textTransform:"uppercase", fontWeight:600 }}>Good Morning 👋</div>
              <div style={{ color:DS.white, fontWeight:800, fontSize:24, marginTop:4, fontFamily:"'Playfair Display',serif", lineHeight:1.2 }}>오늘도 영어<br/>한 걸음씩!</div>
            </div>
            <div style={{ background:`${DS.gold}22`, border:`1.5px solid ${DS.gold}66`, borderRadius:18, padding:"8px 14px", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:18 }}>🔥</span>
              <div>
                <div style={{ color:DS.goldLight, fontWeight:800, fontSize:17, lineHeight:1 }}>7일</div>
                <div style={{ color:`${DS.goldLight}88`, fontSize:9, fontWeight:600 }}>STREAK</div>
              </div>
            </div>
          </div>

          <div onClick={() => { setSelectedLesson(LESSONS[2]); setScreen("call"); }} className="cta-btn"
            style={{ marginTop:20, position:"relative", background:`linear-gradient(135deg,${DS.gold} 0%,${DS.goldLight} 100%)`,
              borderRadius:20, padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:14,
              boxShadow:`0 6px 24px ${DS.gold}55`, transition:"all 0.2s" }}>
            <StitchBorder color={DS.white} opacity={0.3}/>
            <div style={{ width:52, height:52, background:"rgba(255,255,255,0.25)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>💼</div>
            <div style={{ flex:1, position:"relative", zIndex:1 }}>
              <div style={{ color:"rgba(28,58,47,0.65)", fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" }}>오늘의 추천 레슨</div>
              <div style={{ color:DS.forest, fontWeight:800, fontSize:16, marginTop:2, fontFamily:"'Playfair Display',serif" }}>비즈니스 미팅 영어</div>
              <div style={{ color:"rgba(28,58,47,0.55)", fontSize:11, marginTop:2 }}>10분 · Intermediate</div>
            </div>
            <div style={{ width:42, height:42, background:DS.forest, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:DS.goldLight, fontSize:16, flexShrink:0 }}>▶</div>
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display:"flex", gap:10, padding:"18px 18px 0" }}>
          {[{icon:"📞",value:"23",label:"총 통화"},{icon:"⏱",value:"4.2h",label:"학습 시간"},{icon:"✨",value:"85%",label:"정확도"}].map((s,i) => (
            <div key={s.label} style={{ flex:1, background:DS.white, borderRadius:18, padding:"14px 10px", textAlign:"center",
              position:"relative", boxShadow:"0 3px 14px rgba(28,58,47,0.08)", border:`1.5px solid ${DS.paper}`,
              animation:`fadeUp 0.4s ${i*0.08+0.1}s both`, overflow:"hidden" }}>
              <StitchBorder color={DS.gold} opacity={0.25}/>
              <div style={{ fontSize:22 }}>{s.icon}</div>
              <div style={{ fontWeight:800, fontSize:18, color:DS.forest, marginTop:4, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
              <div style={{ fontSize:10, color:DS.muted, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 레슨 섹션 */}
        <div style={{ padding:"20px 18px 8px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontWeight:800, fontSize:18, color:DS.forest, fontFamily:"'Playfair Display',serif" }}>레슨 선택</div>
            <div style={{ fontSize:11, color:DS.muted }}>총 {filtered.length}개</div>
          </div>
          <div style={{ display:"flex", gap:7, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
            {["All","Beginner","Intermediate","Advanced"].map(l => {
              const active = filterLevel === l;
              return (
                <button key={l} onClick={() => setFilterLevel(l)} style={{ padding:"7px 14px", borderRadius:22, whiteSpace:"nowrap",
                  cursor:"pointer", background:active?DS.forest:DS.white, color:active?DS.goldLight:DS.muted,
                  border:active?"none":"1.5px solid #DDD5C8", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                  boxShadow:active?`0 3px 12px ${DS.forest}44`:"none", transition:"all 0.2s" }}>
                  {l==="All"?"전체":LEVEL_META[l]?.label||l}
                </button>
              );
            })}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((lesson,i) => (
              <LessonCard key={lesson.id} lesson={lesson} index={i} onSelect={l => { setSelectedLesson(l); setScreen("call"); }}/>
            ))}
          </div>
        </div>
        <div style={{ height:80 }}/>
      </div>

      {/* 바텀 네비 */}
      <div style={{ background:DS.white, borderTop:`1px solid ${DS.paper}`, paddingTop:10,
        paddingBottom:"max(calc(env(safe-area-inset-bottom) + 6px), 16px)",
        display:"flex", boxShadow:`0 -6px 28px rgba(28,58,47,0.08)`, flexShrink:0 }}>
        {[{icon:"🏠",label:"홈"},{icon:"📚",label:"레슨"},{icon:"📊",label:"리포트"},{icon:"👤",label:"내 정보"}].map((n,i) => (
          <div key={n.label} onClick={() => setActiveNav(i)} style={{ flex:1, textAlign:"center", cursor:"pointer",
            color:activeNav===i?DS.forest:"#C8BFB0", transition:"color 0.2s" }}>
            <div style={{ fontSize:22 }}>{n.icon}</div>
            <div style={{ fontSize:10, marginTop:2, fontWeight:activeNav===i?700:400,
              color:activeNav===i?DS.gold:undefined, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>{n.label}</div>
            {activeNav===i && <div style={{ width:20, height:2.5, background:DS.gold, borderRadius:2, margin:"3px auto 0" }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}
