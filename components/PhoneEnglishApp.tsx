"use client";
import { useState, useEffect, useRef } from "react";

/* ── 디자인 토큰 ── */
const DS = {
  cream:"#FAF7F2", paper:"#F3EDE3", forest:"#1C3A2F", moss:"#2E5744",
  sage:"#6B9E7E", gold:"#C9963A", goldLight:"#F0C97A",
  ink:"#1A1A1A", muted:"#7A7060", white:"#FFFFFF", errorRed:"#C0392B",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar { display:none; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes ripple  { 0%{transform:scale(0.95);opacity:0.7} 70%{transform:scale(1.18);opacity:0} 100%{opacity:0} }
  @keyframes dots    { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes waveBar { 0%,100%{height:6px} 50%{height:22px} }
  @keyframes micPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(201,150,58,0.6)} 70%{box-shadow:0 0 0 18px rgba(201,150,58,0)} }
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

const LEVEL_META: Record<string,{label:string;bg:string;text:string;border:string}> = {
  Beginner:     { label:"입문", bg:"#EAF4EE", text:"#2E5744", border:"#A8D5B8" },
  Intermediate: { label:"중급", bg:"#FDF5E6", text:"#7A5C1E", border:"#E8C97A" },
  Advanced:     { label:"고급", bg:"#F5EAF0", text:"#6B2D55", border:"#C9A0BC" },
};

function StitchBorder({ color=DS.gold, opacity=0.35 }:{ color?:string; opacity?:number }) {
  return <div style={{ position:"absolute", inset:0, pointerEvents:"none",
    border:`1.5px dashed ${color}`, opacity, margin:5, borderRadius:14 }}/>;
}

/* ─────────────────────────────────────────
   레슨 카드
───────────────────────────────────────── */
function LessonCard({ lesson, onSelect, index }:{
  lesson:typeof LESSONS[0]; onSelect:(l:typeof LESSONS[0])=>void; index:number;
}) {
  const lm = LEVEL_META[lesson.level];
  return (
    <div className="lesson-card" onClick={()=>onSelect(lesson)} style={{
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

/* ─────────────────────────────────────────
   모드 선택 모달 (텍스트 vs 음성)
───────────────────────────────────────── */
function ModeModal({ lesson, hasOpenAIKey, onSelect, onClose }:{
  lesson:typeof LESSONS[0]; hasOpenAIKey:boolean;
  onSelect:(mode:"text"|"voice")=>void; onClose:()=>void;
}) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100,
      background:"rgba(28,58,47,0.7)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:DS.cream, borderRadius:"28px 28px 0 0", padding:"28px 20px 40px",
        width:"100%", maxWidth:430, animation:"fadeUp 0.3s both",
      }}>
        <div style={{ width:36, height:4, background:"#DDD5C8", borderRadius:2, margin:"0 auto 24px" }}/>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:20,
          color:DS.forest, marginBottom:6 }}>
          {lesson.emoji} {lesson.topic}
        </div>
        <div style={{ fontSize:13, color:DS.muted, marginBottom:24,
          fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>어떻게 학습할까요?</div>

        {/* 텍스트 */}
        <div onClick={()=>onSelect("text")} style={{
          background:DS.white, borderRadius:18, padding:"18px 20px", cursor:"pointer",
          border:`1.5px solid ${DS.gold}44`, marginBottom:12, display:"flex", alignItems:"center", gap:16,
          boxShadow:"0 3px 12px rgba(28,58,47,0.08)", transition:"all 0.2s", position:"relative",
        }}>
          <StitchBorder color={DS.gold} opacity={0.3}/>
          <div style={{ width:48, height:48, borderRadius:14, background:"#EAF4EE",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>💬</div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:DS.forest, fontFamily:"'Playfair Display',serif" }}>텍스트로 대화</div>
            <div style={{ fontSize:12, color:DS.muted, marginTop:2, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>타이핑으로 AI 튜터와 대화</div>
          </div>
          <div style={{ marginLeft:"auto", color:DS.gold, fontSize:18 }}>→</div>
        </div>

        {/* 음성 */}
        <div onClick={()=>hasOpenAIKey ? onSelect("voice") : null} style={{
          background: hasOpenAIKey ? DS.forest : "#F0EBE3",
          borderRadius:18, padding:"18px 20px",
          cursor: hasOpenAIKey ? "pointer" : "not-allowed",
          border:`1.5px solid ${hasOpenAIKey ? DS.gold+"66" : "#DDD5C8"}`,
          display:"flex", alignItems:"center", gap:16, opacity: hasOpenAIKey ? 1 : 0.7,
          boxShadow: hasOpenAIKey ? `0 3px 16px ${DS.forest}44` : "none", transition:"all 0.2s",
        }}>
          <div style={{ width:48, height:48, borderRadius:14,
            background: hasOpenAIKey ? `${DS.gold}33` : "#E8E0D5",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🎤</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15, color: hasOpenAIKey ? DS.goldLight : DS.muted,
              fontFamily:"'Playfair Display',serif" }}>음성으로 통화</div>
            <div style={{ fontSize:12, color: hasOpenAIKey ? DS.sage : DS.muted, marginTop:2,
              fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
              {hasOpenAIKey ? "마이크로 말하면 AI가 음성으로 답변" : "내 정보에서 OpenAI API 키를 먼저 등록하세요"}
            </div>
          </div>
          {!hasOpenAIKey && <div style={{ fontSize:18 }}>🔒</div>}
          {hasOpenAIKey && <div style={{ color:DS.goldLight, fontSize:18 }}>→</div>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   텍스트 채팅 화면
───────────────────────────────────────── */
type Message = { role:"ai"|"user"; english?:string; korean?:string; tip?:string; text?:string };

function TextChatScreen({ lesson, onEnd }:{ lesson:typeof LESSONS[0]; onEnd:()=>void }) {
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { role:"ai", english:`Hello! Today we'll practice "${lesson.topic}". Are you ready?`, korean:"안녕하세요! 준비되셨나요?", tip:"" }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lm = LEVEL_META[lesson.level];
  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => { const t=setInterval(()=>setSeconds(s=>s+1),1000); return ()=>clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const send = async () => {
    if (!input.trim()||isThinking) return;
    const userMsg = input.trim(); setInput("");
    setMessages(m=>[...m,{role:"user",text:userMsg}]); setIsThinking(true);
    try {
      const history = messages.map(m=>({ role:m.role==="ai"?"assistant":"user", content:m.english||m.text||"" }));
      const res = await fetch("/api/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:[...history,{role:"user",content:userMsg}],topic:lesson.topic,level:lesson.level}),
      });
      const parsed = await res.json();
      setMessages(m=>[...m,{role:"ai",...parsed}]);
    } catch { setMessages(m=>[...m,{role:"ai",english:"Connection lost!",korean:"연결이 끊겼어요.",tip:""}]); }
    setIsThinking(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", width:"100vw", height:"100dvh",
      background:DS.forest, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ padding:"22px 20px 16px", paddingTop:"max(env(safe-area-inset-top,0px) + 16px, 22px)",
        background:`linear-gradient(180deg,#0F2218 0%,${DS.forest} 100%)` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ color:DS.goldLight, fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>💬 텍스트 대화</div>
            <div style={{ color:DS.white, fontWeight:800, fontSize:18, marginTop:2, fontFamily:"'Playfair Display',serif" }}>{lesson.emoji} {lesson.topic}</div>
            <div style={{ color:DS.sage, fontSize:12, marginTop:2 }}>{lm.label} · {fmt(seconds)}</div>
          </div>
          <div style={{ position:"relative", width:56, height:56 }}>
            <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`2px solid ${DS.gold}44`, animation:"ripple 2s infinite" }}/>
            <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${DS.gold},${DS.goldLight})`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:`0 0 24px ${DS.gold}55` }}>🤖</div>
          </div>
        </div>
      </div>
      {/* 메시지 */}
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
            {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:DS.sage, animation:`dots 1.2s ${i*0.2}s infinite ease-in-out` }}/>)}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {/* 입력 */}
      <div style={{ padding:"12px 16px", paddingBottom:"max(calc(env(safe-area-inset-bottom)+12px),20px)",
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
          fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>📵 종료</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   음성 통화 화면 (Whisper STT + OpenAI TTS)
───────────────────────────────────────── */
type VoiceStatus = "idle"|"recording"|"processing"|"speaking";

function VoiceCallScreen({ lesson, openAIKey, onEnd }:{
  lesson:typeof LESSONS[0]; openAIKey:string; onEnd:()=>void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("Hello! Press and hold the mic button to speak.");
  const [aiKorean, setAiKorean] = useState("마이크 버튼을 누르고 말씀하세요.");
  const [tip, setTip] = useState("");
  const [history, setHistory] = useState<{role:string;content:string}[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const lm = LEVEL_META[lesson.level];
  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => { const t=setInterval(()=>setSeconds(s=>s+1),1000); return ()=>clearInterval(t); }, []);

  const statusLabel: Record<VoiceStatus,string> = {
    idle:"마이크 버튼을 눌러 말하세요", recording:"🔴 녹음 중...", processing:"⏳ 처리 중...", speaking:"🔊 AI 답변 중..."
  };

  const startRecording = async () => {
    if (status !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.start();
      mediaRecorderRef.current = mr;
      setStatus("recording");
    } catch { alert("마이크 권한을 허용해주세요."); }
  };

  const stopRecording = () => {
    if (status !== "recording" || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type:"audio/webm" });
      mediaRecorderRef.current?.stream.getTracks().forEach(t=>t.stop());
      setStatus("processing");
      await processAudio(blob);
    };
    mediaRecorderRef.current.stop();
  };

  const processAudio = async (blob: Blob) => {
    try {
      // 1. Whisper STT
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-1");
      const sttRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method:"POST",
        headers:{ Authorization:`Bearer ${openAIKey}` },
        body:formData,
      });
      const sttData = await sttRes.json();
      const userText = sttData.text || "";
      setTranscript(userText);

      // 2. Claude 응답
      const newHistory = [...history, { role:"user", content:userText }];
      const chatRes = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ messages:newHistory, topic:lesson.topic, level:lesson.level }),
      });
      const chatData = await chatRes.json();
      const aiEnglish = chatData.english || chatData.text || "";
      setAiText(aiEnglish);
      setAiKorean(chatData.korean || "");
      setTip(chatData.tip || "");
      setHistory([...newHistory, { role:"assistant", content:aiEnglish }]);

      // 3. OpenAI TTS
      setStatus("speaking");
      const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
        method:"POST",
        headers:{ Authorization:`Bearer ${openAIKey}`, "Content-Type":"application/json" },
        body:JSON.stringify({ model:"tts-1", input:aiEnglish, voice:"nova" }),
      });
      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) { audioRef.current.src=audioUrl; audioRef.current.play(); }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setStatus("idle");
      audioRef.current.play();
    } catch (e) {
      setAiText("오류가 발생했어요. 다시 시도해주세요.");
      setAiKorean("");
      setStatus("idle");
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", width:"100vw", height:"100dvh",
      background:DS.forest, fontFamily:"'DM Sans','Noto Sans KR',sans-serif", alignItems:"center" }}>
      <audio ref={audioRef} style={{ display:"none" }}/>

      {/* 헤더 */}
      <div style={{ width:"100%", padding:"22px 20px 16px",
        paddingTop:"max(env(safe-area-inset-top,0px)+16px,22px)",
        background:`linear-gradient(180deg,#0F2218 0%,${DS.forest} 100%)` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:DS.goldLight, fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>🎤 음성 통화</div>
            <div style={{ color:DS.white, fontWeight:800, fontSize:18, marginTop:2, fontFamily:"'Playfair Display',serif" }}>{lesson.emoji} {lesson.topic}</div>
            <div style={{ color:DS.sage, fontSize:12, marginTop:2 }}>{lm.label} · {fmt(seconds)}</div>
          </div>
          <div style={{ position:"relative", width:56, height:56 }}>
            <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`2px solid ${DS.gold}44`,
              animation: status==="speaking" ? "ripple 1.2s infinite" : "ripple 2s infinite" }}/>
            <div style={{ width:56, height:56, borderRadius:"50%",
              background:`linear-gradient(135deg,${DS.gold},${DS.goldLight})`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:26,
              boxShadow:`0 0 ${status==="speaking"?"32px":"16px"} ${DS.gold}${status==="speaking"?"99":"55"}` }}>🤖</div>
          </div>
        </div>
      </div>

      {/* AI 말풍선 */}
      <div style={{ flex:1, width:"100%", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"24px 20px", gap:16 }}>

        <div style={{ background:"#243D32", border:`1px solid ${DS.sage}44`, borderRadius:24,
          padding:"20px 22px", width:"100%", maxWidth:340 }}>
          <div style={{ color:DS.white, fontSize:16, lineHeight:1.7, fontWeight:500, textAlign:"center" }}>{aiText}</div>
          {aiKorean && <div style={{ color:DS.sage, fontSize:12, marginTop:8, textAlign:"center" }}>{aiKorean}</div>}
          {tip && <div style={{ marginTop:10, background:`${DS.gold}18`, border:`1px solid ${DS.gold}44`,
            borderRadius:10, padding:"8px 12px", fontSize:12, color:DS.goldLight, textAlign:"center" }}>✏️ {tip}</div>}
        </div>

        {/* 내 발화 표시 */}
        {transcript && (
          <div style={{ background:`${DS.moss}88`, borderRadius:16, padding:"10px 16px",
            color:DS.white, fontSize:13, textAlign:"center", maxWidth:300 }}>
            🗣 "{transcript}"
          </div>
        )}

        {/* 상태 텍스트 */}
        <div style={{ color:DS.sage, fontSize:13, fontWeight:500, textAlign:"center" }}>
          {statusLabel[status]}
        </div>

        {/* 음파 바 */}
        <div style={{ display:"flex", alignItems:"center", gap:3, height:32 }}>
          {Array.from({length:20}).map((_,i)=>(
            <div key={i} style={{
              width:4, borderRadius:3,
              background: status==="recording" ? DS.gold : status==="speaking" ? DS.goldLight : `${DS.sage}55`,
              height: status==="recording"||status==="speaking" ? undefined : `${Math.abs(Math.sin(i*0.6))*14+4}px`,
              animation: status==="recording"||status==="speaking" ? `waveBar 0.6s ${(i%5)*0.1}s ease-in-out infinite` : "none",
              minHeight:4,
            }}/>
          ))}
        </div>
      </div>

      {/* 마이크 버튼 + 종료 */}
      <div style={{ width:"100%", padding:"16px 20px",
        paddingBottom:"max(calc(env(safe-area-inset-bottom)+16px),28px)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>

        {/* 마이크 버튼 — 누르고 있는 동안 녹음 */}
        <div
          onMouseDown={startRecording} onMouseUp={stopRecording}
          onTouchStart={e=>{e.preventDefault();startRecording();}} onTouchEnd={e=>{e.preventDefault();stopRecording();}}
          style={{
            width:80, height:80, borderRadius:"50%", cursor:"pointer",
            background: status==="recording"
              ? `linear-gradient(135deg,${DS.errorRed},#E74C3C)`
              : `linear-gradient(135deg,${DS.gold},${DS.goldLight})`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:32,
            boxShadow: status==="recording" ? `0 0 0 0 ${DS.errorRed}` : `0 6px 24px ${DS.gold}66`,
            animation: status==="recording" ? "micPulse 1s infinite" : "none",
            transition:"background 0.2s",
            userSelect:"none",
          }}>
          {status==="recording" ? "⏹" : status==="processing" ? "⏳" : status==="speaking" ? "🔊" : "🎤"}
        </div>
        <div style={{ color:`${DS.sage}99`, fontSize:11, textAlign:"center",
          fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
          {status==="idle" ? "버튼을 누르고 있는 동안 말하세요" : ""}
        </div>

        <button onClick={onEnd} style={{ width:"100%", maxWidth:340, background:"transparent",
          border:`1.5px solid ${DS.errorRed}88`, borderRadius:14, padding:"12px",
          color:`${DS.errorRed}cc`, fontWeight:700, cursor:"pointer", fontSize:13,
          fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>📵 통화 종료</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   내 정보 화면
───────────────────────────────────────── */
function ProfileScreen({ openAIKey, onSave }:{ openAIKey:string; onSave:(key:string)=>void }) {
  const [inputKey, setInputKey] = useState(openAIKey);
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);

  const handleSave = () => {
    onSave(inputKey.trim());
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };
  const handleDelete = () => { setInputKey(""); onSave(""); };

  return (
    <div style={{ padding:"28px 18px", animation:"fadeIn 0.3s both" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:22, color:DS.forest, marginBottom:6 }}>내 정보</div>
      <div style={{ fontSize:13, color:DS.muted, marginBottom:28, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
        설정을 관리하세요
      </div>

      {/* OpenAI API 키 카드 */}
      <div style={{ background:DS.white, borderRadius:20, padding:"20px", position:"relative",
        boxShadow:"0 4px 16px rgba(28,58,47,0.07)", border:`1.5px solid ${DS.gold}33`, overflow:"hidden" }}>
        <StitchBorder color={DS.gold} opacity={0.25}/>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"#FDF5E6",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔑</div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:DS.forest, fontFamily:"'Playfair Display',serif" }}>OpenAI API 키</div>
            <div style={{ fontSize:11, color:DS.muted, fontFamily:"'DM Sans',sans-serif" }}>음성 통화 기능에 필요해요</div>
          </div>
          {openAIKey && <div style={{ marginLeft:"auto", background:"#EAF4EE", color:"#2E5744",
            fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, border:"1px solid #A8D5B8" }}>✅ 등록됨</div>}
        </div>

        <div style={{ position:"relative" }}>
          <input
            type={show ? "text" : "password"}
            value={inputKey}
            onChange={e=>setInputKey(e.target.value)}
            placeholder="sk-..."
            style={{ width:"100%", background:"#F8F4EE", border:`1.5px solid ${DS.gold}44`,
              borderRadius:12, padding:"12px 44px 12px 14px", fontSize:13, outline:"none",
              color:DS.ink, fontFamily:"'DM Sans',sans-serif" }}
          />
          <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%",
            transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16 }}>
            {show ? "🙈" : "👁️"}
          </button>
        </div>

        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <button onClick={handleSave} style={{
            flex:1, background:`linear-gradient(135deg,${DS.forest},${DS.moss})`,
            border:"none", borderRadius:12, padding:"12px", color:DS.white,
            fontWeight:700, cursor:"pointer", fontSize:13,
            fontFamily:"'DM Sans','Noto Sans KR',sans-serif",
            transition:"all 0.2s",
          }}>
            {saved ? "✅ 저장됨!" : "저장"}
          </button>
          {openAIKey && (
            <button onClick={handleDelete} style={{
              background:"transparent", border:`1.5px solid ${DS.errorRed}66`, borderRadius:12,
              padding:"12px 16px", color:`${DS.errorRed}cc`, fontWeight:700,
              cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif",
            }}>삭제</button>
          )}
        </div>

        <div style={{ marginTop:12, fontSize:11, color:DS.muted, lineHeight:1.6,
          fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
          🔒 키는 이 기기의 브라우저에만 저장되며 서버로 전송되지 않아요.
          <br/>
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
            style={{ color:DS.gold, textDecoration:"none" }}>
            → OpenAI API 키 발급받기
          </a>
        </div>
      </div>

      {/* 앱 정보 */}
      <div style={{ background:DS.white, borderRadius:20, padding:"20px", marginTop:16, position:"relative",
        boxShadow:"0 4px 16px rgba(28,58,47,0.07)", border:`1.5px solid ${DS.paper}`, overflow:"hidden" }}>
        <StitchBorder color={DS.gold} opacity={0.2}/>
        <div style={{ fontWeight:700, fontSize:14, color:DS.forest, marginBottom:10,
          fontFamily:"'Playfair Display',serif" }}>앱 정보</div>
        {[
          { label:"텍스트 대화", value:"Claude AI (Anthropic)" },
          { label:"음성 인식 (STT)", value:"Whisper (OpenAI)" },
          { label:"음성 합성 (TTS)", value:"TTS-1 Nova (OpenAI)" },
          { label:"디자인", value:"Mia · Cream & Forest" },
        ].map(item=>(
          <div key={item.label} style={{ display:"flex", justifyContent:"space-between",
            padding:"8px 0", borderBottom:`1px solid ${DS.paper}` }}>
            <div style={{ fontSize:12, color:DS.muted, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>{item.label}</div>
            <div style={{ fontSize:12, color:DS.forest, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   메인 앱
───────────────────────────────────────── */
export default function PhoneEnglishApp() {
  const [screen, setScreen] = useState<"home"|"text"|"voice">("home");
  const [activeNav, setActiveNav] = useState(0);
  const [filterLevel, setFilterLevel] = useState("All");
  const [selectedLesson, setSelectedLesson] = useState<typeof LESSONS[0]|null>(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [openAIKey, setOpenAIKey] = useState("");

  // localStorage에서 키 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("openai_api_key");
    if (saved) setOpenAIKey(saved);
  }, []);

  const saveOpenAIKey = (key: string) => {
    setOpenAIKey(key);
    if (key) localStorage.setItem("openai_api_key", key);
    else localStorage.removeItem("openai_api_key");
  };

  const filtered = filterLevel==="All" ? LESSONS : LESSONS.filter(l=>l.level===filterLevel);

  const handleLessonSelect = (lesson: typeof LESSONS[0]) => {
    setSelectedLesson(lesson);
    setShowModeModal(true);
  };

  const handleModeSelect = (mode: "text"|"voice") => {
    setShowModeModal(false);
    setScreen(mode);
  };

  if (screen==="text" && selectedLesson) return (
    <><style>{GLOBAL_CSS}</style><TextChatScreen lesson={selectedLesson} onEnd={()=>setScreen("home")}/></>
  );

  if (screen==="voice" && selectedLesson && openAIKey) return (
    <><style>{GLOBAL_CSS}</style><VoiceCallScreen lesson={selectedLesson} openAIKey={openAIKey} onEnd={()=>setScreen("home")}/></>
  );

  return (
    <div style={{ width:"100vw", height:"100dvh", background:DS.cream,
      fontFamily:"'DM Sans','Noto Sans KR',sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* 모드 선택 모달 */}
      {showModeModal && selectedLesson && (
        <ModeModal lesson={selectedLesson} hasOpenAIKey={!!openAIKey}
          onSelect={handleModeSelect} onClose={()=>setShowModeModal(false)}/>
      )}

      <div style={{ flex:1, overflowY:"auto" }}>

        {/* 홈 탭 */}
        {activeNav===0 && (
          <>
            {/* 히어로 헤더 */}
            <div style={{ background:`linear-gradient(160deg,${DS.forest} 0%,${DS.moss} 100%)`,
              padding:"28px 22px 32px", paddingTop:"max(calc(env(safe-area-inset-top)+16px),28px)",
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
              {/* 오늘의 추천 */}
              <div onClick={()=>handleLessonSelect(LESSONS[2])} className="cta-btn"
                style={{ marginTop:20, position:"relative", background:`linear-gradient(135deg,${DS.gold},${DS.goldLight})`,
                  borderRadius:20, padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:14,
                  boxShadow:`0 6px 24px ${DS.gold}55`, transition:"all 0.2s" }}>
                <StitchBorder color={DS.white} opacity={0.3}/>
                <div style={{ width:52, height:52, background:"rgba(255,255,255,0.25)", borderRadius:16,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>💼</div>
                <div style={{ flex:1, position:"relative", zIndex:1 }}>
                  <div style={{ color:"rgba(28,58,47,0.65)", fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" }}>오늘의 추천 레슨</div>
                  <div style={{ color:DS.forest, fontWeight:800, fontSize:16, marginTop:2, fontFamily:"'Playfair Display',serif" }}>비즈니스 미팅 영어</div>
                  <div style={{ color:"rgba(28,58,47,0.55)", fontSize:11, marginTop:2 }}>10분 · Intermediate</div>
                </div>
                <div style={{ width:42, height:42, background:DS.forest, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center", color:DS.goldLight, fontSize:16, flexShrink:0 }}>▶</div>
              </div>
            </div>

            {/* 레슨 섹션 */}
            <div style={{ padding:"20px 18px 8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontWeight:800, fontSize:18, color:DS.forest, fontFamily:"'Playfair Display',serif" }}>레슨 선택</div>
                <div style={{ fontSize:11, color:DS.muted }}>총 {filtered.length}개</div>
              </div>
              <div style={{ display:"flex", gap:7, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
                {["All","Beginner","Intermediate","Advanced"].map(l=>{
                  const active=filterLevel===l;
                  return (
                    <button key={l} onClick={()=>setFilterLevel(l)} style={{ padding:"7px 14px", borderRadius:22,
                      whiteSpace:"nowrap", cursor:"pointer", background:active?DS.forest:DS.white,
                      color:active?DS.goldLight:DS.muted, border:active?"none":"1.5px solid #DDD5C8",
                      fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                      boxShadow:active?`0 3px 12px ${DS.forest}44`:"none", transition:"all 0.2s" }}>
                      {l==="All"?"전체":LEVEL_META[l]?.label||l}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.map((lesson,i)=>(
                  <LessonCard key={lesson.id} lesson={lesson} index={i} onSelect={handleLessonSelect}/>
                ))}
              </div>
            </div>
            <div style={{ height:80 }}/>
          </>
        )}

        {/* 내 정보 탭 */}
        {activeNav===3 && (
          <ProfileScreen openAIKey={openAIKey} onSave={saveOpenAIKey}/>
        )}

        {/* 레슨/리포트 탭 (추후 구현) */}
        {(activeNav===1||activeNav===2) && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            height:"60vh", gap:12, color:DS.muted, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
            <div style={{ fontSize:40 }}>{activeNav===1?"📚":"📊"}</div>
            <div style={{ fontSize:16, fontWeight:700, color:DS.forest, fontFamily:"'Playfair Display',serif" }}>
              {activeNav===1?"레슨 목록":"학습 리포트"}
            </div>
            <div style={{ fontSize:13 }}>준비 중이에요</div>
          </div>
        )}
      </div>

      {/* 바텀 네비 */}
      <div style={{ background:DS.white, borderTop:`1px solid ${DS.paper}`, paddingTop:10,
        paddingBottom:"max(calc(env(safe-area-inset-bottom)+6px),16px)",
        display:"flex", boxShadow:`0 -6px 28px rgba(28,58,47,0.08)`, flexShrink:0 }}>
        {[{icon:"🏠",label:"홈"},{icon:"📚",label:"레슨"},{icon:"📊",label:"리포트"},{icon:"👤",label:"내 정보"}].map((n,i)=>(
          <div key={n.label} onClick={()=>setActiveNav(i)} style={{ flex:1, textAlign:"center", cursor:"pointer",
            color:activeNav===i?DS.forest:"#C8BFB0", transition:"color 0.2s" }}>
            <div style={{ fontSize:22 }}>{n.icon}</div>
            <div style={{ fontSize:10, marginTop:2, fontWeight:activeNav===i?700:400,
              color:activeNav===i?DS.gold:undefined, fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>{n.label}</div>
            {activeNav===i&&<div style={{ width:20, height:2.5, background:DS.gold, borderRadius:2, margin:"3px auto 0" }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}
