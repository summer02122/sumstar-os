"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, Agent } from "@/store/agentStore";
import { createClient } from "@/utils/supabase/client";
import { Send, Loader2, MessageSquare, Trash2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "agent";
  content: string;
}

// Brutalist color palette for agents — cycles through these for any agent name
const COLOR_PALETTE = [
  { bg: "bg-[#FFF3B0]", border: "border-black", dot: "bg-black" },
  { bg: "bg-[#FFCCD5]", border: "border-black", dot: "bg-[#FF0055]" },
  { bg: "bg-[#C7F9CC]", border: "border-black", dot: "bg-black" },
  { bg: "bg-[#BDE0FE]", border: "border-black", dot: "bg-[#0055FF]" },
  { bg: "bg-[#E2C6FF]", border: "border-black", dot: "bg-[#7700FF]" },
  { bg: "bg-[#FFE0B2]", border: "border-black", dot: "bg-black" },
];

const EMOJI_PALETTE = ["🧠", "🎨", "📋", "⚡", "🔧", "🚀"];

function getAgentColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

function getAgentEmoji(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return EMOJI_PALETTE[Math.abs(hash) % EMOJI_PALETTE.length];
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-none bg-black"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ 
  msg, 
  agentName, 
  agentImageUrl,
  userLogoUrl,
  onSelectAgent 
}: { 
  msg: Message; 
  agentName: string; 
  agentImageUrl?: string;
  userLogoUrl?: string;
  onSelectAgent?: (name: string) => void 
}) {
  const isUser = msg.role === "user";
  const colors = getAgentColor(agentName);

  let displayContent = msg.content;
  let hiredAgent: any = null;
  const hireMatch = displayContent.match(/```(?:action:hire_agent|hire_agent)\s*([\s\S]*?)\s*```/i);
  if (hireMatch) {
    displayContent = displayContent.replace(hireMatch[0], "").trim();
    try {
      hiredAgent = JSON.parse(hireMatch[1]);
    } catch {}
  }

  let uiWidgets: string[] = [];
  const uiMatch = displayContent.match(/```(?:ui|html)\s*([\s\S]*?)\s*```/ig);
  if (uiMatch) {
    uiMatch.forEach(match => {
      const inner = match.replace(/```(?:ui|html)/i, '').replace(/```$/, '').trim();
      uiWidgets.push(inner);
      displayContent = displayContent.replace(match, "").trim();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 w-full`}
    >
      {!isUser && (
        <div className="mr-3 mt-1 shrink-0 w-8 h-8 rounded-none bg-white border-2 border-black overflow-hidden flex items-center justify-center text-base shadow-[2px_2px_0px_#000000]">
          {agentImageUrl ? (
            <img src={agentImageUrl} alt={agentName} className="w-full h-full object-cover" />
          ) : (
            getAgentEmoji(agentName)
          )}
        </div>
      )}
      <div
        className={`max-w-full md:max-w-[85%] px-4 py-3 rounded-none text-xs font-heading font-bold leading-relaxed shadow-[3px_3px_0px_#000000] border-2 border-black whitespace-pre-wrap break-words overflow-hidden ${
          isUser
            ? "bg-primary text-primary-foreground"
            : `${colors.bg} text-black`
        }`}
      >
        {displayContent}
        
        {/* Render UI Widgets */}
        {uiWidgets.map((html, idx) => {
          const srcDoc = `
            <!DOCTYPE html>
            <html>
              <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
                <style>
                  body { font-family: 'Space Grotesk', sans-serif; margin: 0; padding: 12px; }
                  /* Neobrutalist defaults */
                  button, input, select, textarea, div { box-sizing: border-box; }
                </style>
              </head>
              <body>
                ${html}
              </body>
            </html>
          `;
          return (
            <div key={idx} className="mt-4 border-2 border-black bg-white rounded-none shadow-[4px_4px_0px_#000000] overflow-hidden">
              <div className="bg-black text-white text-[10px] font-mono px-2 py-1 flex justify-between items-center">
                <span>⚡ AI-Generated UI Widget</span>
                <span className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><div className="w-2 h-2 rounded-full bg-yellow-500"></div><div className="w-2 h-2 rounded-full bg-green-500"></div></span>
              </div>
              <iframe
                srcDoc={srcDoc}
                className="w-full min-h-[250px] border-none bg-white"
                sandbox="allow-scripts allow-same-origin"
                title={`AI Widget ${idx}`}
                onLoad={(e) => {
                  const iframe = e.target as HTMLIFrameElement;
                  if (iframe.contentWindow?.document.body) {
                    const height = iframe.contentWindow.document.body.scrollHeight;
                    if (height > 250) {
                      iframe.style.height = `${height + 20}px`;
                    }
                  }
                }}
              />
            </div>
          );
        })}

        {hiredAgent && (
          <div className="mt-3 p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-black">
            <div className="flex items-center gap-2 font-black text-xs uppercase text-black">
              <span>🎉</span>
              <span>บรรจุ Agent ใหม่: {hiredAgent.name} ({hiredAgent.role || 'Specialist'})</span>
            </div>
            {hiredAgent.department && (
              <span className="inline-block mt-1 text-[10px] bg-black text-white px-2 py-0.5 font-heading uppercase">
                {hiredAgent.department}
              </span>
            )}
            {onSelectAgent && (
              <button
                onClick={() => onSelectAgent(hiredAgent.name)}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-heading font-black uppercase px-2.5 py-1.5 rounded-none border border-black shadow-[1.5px_1.5px_0px_#000000] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <span>💬 เปิดห้องแชทคุยกับ {hiredAgent.name}</span>
                <ChevronRight size={12} className="stroke-[3]" />
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="ml-3 mt-1 shrink-0 w-8 h-8 rounded-none bg-accent border-2 border-black overflow-hidden flex items-center justify-center text-base shadow-[2px_2px_0px_#000000]">
          {userLogoUrl ? (
            <img src={userLogoUrl} alt="User Profile" className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function ChatPage() {
  const { agents, settings, initialized, initialize } = useAgentStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [agentOrder, setAgentOrder] = useState<string[]>([]);

  useEffect(() => {
    const savedOrder = localStorage.getItem('chatAgentOrder');
    if (savedOrder) {
      try {
        setAgentOrder(JSON.parse(savedOrder));
      } catch(e) {}
    }
  }, []);

  const agentList = useMemo(() => {
    const list = Object.values(agents);
    if (agentOrder.length > 0) {
      list.sort((a, b) => {
        const idxA = agentOrder.indexOf(a.id);
        const idxB = agentOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    return list;
  }, [agents, agentOrder]);

  const moveAgent = (index: number, direction: 'up' | 'down') => {
    const newOrder = agentList.map(a => a.id);
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setAgentOrder(newOrder);
    localStorage.setItem('chatAgentOrder', JSON.stringify(newOrder));
  };

  const currentMessages = selectedAgent ? chatHistory[selectedAgent.id] ?? [] : [];

  // Removed localStorage sync

  // Fetch past messages from Supabase for the selected agent
  useEffect(() => {
    if (!selectedAgent) return;
    const agentId = selectedAgent.id;

    async function loadAgentMessages() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("chat_messages")
          .select("message, created_at")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: true });

        if (error) {
          console.warn("Notice: chat_messages table in Supabase:", error.message || error);
          return;
        }

        if (data) {
          const loadedMsgs: Message[] = data
            .map((row: any) => {
              try {
                const parsed = typeof row.message === "string" ? JSON.parse(row.message) : row.message;
                const role = parsed.role === "assistant" || parsed.role === "agent" ? "agent" : "user";
                return { role, content: parsed.content || "" };
              } catch {
                return null;
              }
            })
            .filter((m: any): m is Message => m !== null && Boolean(m.content));

          setChatHistory((prev) => ({
            ...prev,
            [agentId]: loadedMsgs,
          }));
        }
      } catch (e: any) {
        console.warn("Notice: chat history fetch notice:", e?.message || e);
      }
    }
    loadAgentMessages();

    // Auto-refresh when tab gets focused (fixes 2-tabs out of sync issue)
    window.addEventListener("focus", loadAgentMessages);
    return () => window.removeEventListener("focus", loadAgentMessages);
  }, [selectedAgent?.id]);

  useEffect(() => {
    if (agentList.length > 0 && !selectedAgent) {
      setSelectedAgent(agentList[0]);
    }
  }, [agentList.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !selectedAgent || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const agentId = selectedAgent.id;

    const updatedHistory = [...(chatHistory[agentId] ?? []), userMsg];
    setChatHistory((prev) => ({ ...prev, [agentId]: updatedHistory }));
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      // Add an empty agent message that we'll update as chunks arrive
      setChatHistory((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] ?? []), { role: "agent", content: "" }],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const currentText = fullText;
        setChatHistory((prev) => {
          const msgs = [...(prev[agentId] ?? [])];
          msgs[msgs.length - 1] = { role: "agent", content: currentText };
          return { ...prev, [agentId]: msgs };
        });
      }

      // Final decode flush
      fullText += decoder.decode();
      setChatHistory((prev) => {
        const msgs = [...(prev[agentId] ?? [])];
        msgs[msgs.length - 1] = { role: "agent", content: fullText };
        return { ...prev, [agentId]: msgs };
      });

      // If an agent was hired, refresh the agent store list immediately
      if (fullText.includes("action:hire_agent") || fullText.includes("hire_agent")) {
        setTimeout(() => {
          initialize(true);
        }, 300);
        setTimeout(() => {
          initialize(true);
        }, 1200);
      }

    } catch (err: any) {
      setChatHistory((prev) => ({
        ...prev,
        [agentId]: [
          ...(prev[agentId] ?? []),
          { role: "agent", content: `⚠️ ${err.message || "Failed to connect to agent. Please try again."}` },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    if (!selectedAgent) return;
    const agentId = selectedAgent.id;
    setChatHistory((prev) => {
      return { ...prev, [agentId]: [] };
    });
    try {
      const supabase = createClient();
      await supabase.from("chat_messages").delete().eq("agent_id", agentId);
    } catch (e) {
      console.error("Error clearing chat messages:", e);
    }
  };

  const agentKey = selectedAgent?.name.toUpperCase() ?? "SUM";
  const colors = getAgentColor(agentKey);

  return (
    <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background h-full">
      {/* Sidebar / Topbar: Agent Selector */}
      <aside className={`w-full md:w-64 shrink-0 bg-surface md:border-r-4 border-b-4 md:border-b-0 border-black flex-col ${selectedAgent ? 'hidden md:flex' : 'flex flex-1 md:flex-none'}`}>
        <div className="p-3 md:p-4 border-b-4 border-black bg-white flex justify-between items-start">
          <div>
            <h1 className="font-heading font-black text-black text-sm md:text-base uppercase tracking-tight flex items-center gap-2">
              <MessageSquare size={16} className="stroke-[2.5]" />
              Direct Studio Chat
            </h1>
            <p className="hidden md:block text-[11px] font-bold text-black/70 mt-1 uppercase">TALK 1-ON-1 WITH AGENTS</p>
          </div>
          <button 
            onClick={() => setIsEditingOrder(!isEditingOrder)}
            className={`text-[10px] font-heading font-black uppercase px-2 py-1 border-2 border-black shadow-[1.5px_1.5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all ${isEditingOrder ? 'bg-primary text-primary-foreground' : 'bg-white text-black hover:bg-accent'}`}
          >
            {isEditingOrder ? 'DONE' : 'EDIT'}
          </button>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {!initialized ? (
            <div className="flex items-center justify-center py-4 md:py-8 text-black w-full">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : agentList.length === 0 ? (
            <p className="text-xs font-bold text-black text-center py-4 md:py-8 px-2 w-full">
              ไม่พบ Agent ในระบบ<br className="hidden md:block" />กรุณาไปหน้า Settings
            </p>
          ) : (
            agentList.map((agent, idx) => {
              const key = agent.name.toUpperCase();
              const aColors = getAgentColor(key);
              const isActive = selectedAgent?.id === agent.id;
              const msgCount = chatHistory[agent.id]?.length ?? 0;

              return (
                <div key={agent.id} className="flex items-center gap-2">
                  <motion.button
                    onClick={() => !isEditingOrder && setSelectedAgent(agent)}
                    whileHover={!isEditingOrder ? { x: 2, rotate: -0.5 } : {}}
                    whileTap={!isEditingOrder ? { scale: 0.98 } : {}}
                    className={`flex-1 flex items-center gap-2 md:gap-3 px-3 py-3 rounded-none text-left transition-all border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 ${
                      isActive && !isEditingOrder
                        ? `${aColors.bg} shadow-[4px_4px_0px_#000000] rotate-[-0.75deg]`
                        : "bg-white hover:bg-accent"
                    } ${isEditingOrder ? "cursor-default" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-none bg-white border-2 border-black overflow-hidden flex items-center justify-center text-lg shadow-[1.5px_1.5px_0px_#000000]">
                        {agent.imageUrl ? (
                          <img src={agent.imageUrl} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          getAgentEmoji(key)
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-black text-black text-sm uppercase leading-none truncate">
                        {agent.name}
                      </div>
                      <div className="text-[10px] font-bold text-black/60 uppercase mt-0.5 truncate">
                        {agent.role}
                      </div>
                    </div>
                    {msgCount > 0 && !isEditingOrder && (
                      <span className="text-[10px] font-heading font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-none border border-black">
                        {msgCount}
                      </span>
                    )}
                    {isActive && !isEditingOrder && <ChevronRight size={14} className="text-black stroke-[3] shrink-0 hidden md:block" />}
                  </motion.button>
                  {isEditingOrder && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => moveAgent(idx, 'up')} disabled={idx === 0} className="p-1 border-2 border-black bg-white hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        <ChevronUp size={12} className="stroke-[3]" />
                      </button>
                      <button onClick={() => moveAgent(idx, 'down')} disabled={idx === agentList.length - 1} className="p-1 border-2 border-black bg-white hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        <ChevronDown size={12} className="stroke-[3]" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* Main Chat Area */}
      {!selectedAgent ? (
        <div className="hidden md:flex flex-1 items-center justify-center text-black">
          <div className="text-center p-8 bg-white border-4 border-black shadow-[6px_6px_0px_#000000] rounded-none rotate-[-1deg]">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-heading font-black text-xl uppercase">เลือก Agent ที่ต้องการคุย</p>
            <p className="text-xs font-bold text-black/70 mt-1 uppercase">จากเมนูด้านซ้ายครับ</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header (Mobile Only) */}
          <div className="md:hidden px-3 pr-14 py-2 border-b-3 border-black flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSelectedAgent(null)}
                className="md:hidden flex items-center justify-center w-8 h-8 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
              >
                <ChevronLeft size={20} className="stroke-[3]" />
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-none bg-accent border-2 border-black overflow-hidden flex items-center justify-center text-lg md:text-xl shadow-[2px_2px_0px_#000000] shrink-0">
                {selectedAgent.imageUrl ? (
                  <img src={selectedAgent.imageUrl} alt={selectedAgent.name} className="w-full h-full object-cover" />
                ) : (
                  getAgentEmoji(agentKey)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-black text-sm md:text-base uppercase text-black truncate">{selectedAgent.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 border border-black shrink-0"></div>
                  <p className="text-[9px] md:text-xs font-bold text-black/70 uppercase truncate">{selectedAgent.role}</p>
                </div>
              </div>
            </div>

            {currentMessages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-heading font-black uppercase text-black bg-white hover:bg-[#FF0055] hover:text-white transition-colors px-2 md:px-3 py-1.5 md:py-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
              >
                <Trash2 size={13} className="stroke-[2.5]" />
                <span className="hidden md:inline">ล้างแชท</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            <AnimatePresence>
              {currentMessages.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center text-black gap-4"
                >
                  <div className="w-16 h-16 rounded-none bg-white border-3 border-black overflow-hidden flex items-center justify-center text-4xl shadow-[4px_4px_0px_#000000]">
                    {selectedAgent.imageUrl ? (
                      <img src={selectedAgent.imageUrl} alt={selectedAgent.name} className="w-full h-full object-cover" />
                    ) : (
                      getAgentEmoji(agentKey)
                    )}
                  </div>
                  <div className="bg-white border-4 border-black p-6 rounded-none shadow-[6px_6px_0px_#000000] max-w-md rotate-[-0.5deg]">
                    <p className="font-heading font-black text-black text-lg uppercase">สวัสดีครับ ผม{selectedAgent.name}</p>
                    <p className="text-xs font-medium mt-2 text-black/80">{selectedAgent.description}</p>
                    <p className="text-[11px] font-heading font-bold mt-4 uppercase border-t-2 border-black pt-3">พิมพ์ข้อความด้านล่างเพื่อเริ่มสนทนาได้เลยครับ</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {currentMessages.map((msg, i) => (
              <MessageBubble 
                key={i} 
                msg={msg} 
                agentName={agentKey} 
                agentImageUrl={selectedAgent.imageUrl}
                userLogoUrl={settings.logoUrl}
                onSelectAgent={(name) => {
                  const target = agentList.find(a => a.name.toLowerCase() === name.toLowerCase());
                  if (target) {
                    setSelectedAgent(target);
                  }
                }}
              />
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 mb-4"
              >
                <div className="w-8 h-8 rounded-none bg-white border-2 border-black flex items-center justify-center text-base shadow-[2px_2px_0px_#000000] shrink-0">
                  {getAgentEmoji(agentKey)}
                </div>
                <div className={`px-4 py-3 rounded-none text-sm bg-white border-2 border-black shadow-[3px_3px_0px_#000000] text-black`}>
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-3 py-3 md:px-6 md:py-4 border-t-3 md:border-t-4 border-black bg-white">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              {/* Clear Chat Button (Desktop Only) */}
              {currentMessages.length > 0 && (
                <motion.button
                  onClick={clearChat}
                  title="ล้างแชท"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:flex w-11 h-11 mb-0.5 rounded-none bg-surface hover:bg-[#FF0055] text-black hover:text-white border-2 border-black items-center justify-center shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
                >
                  <Trash2 size={18} className="stroke-[2.5]" />
                </motion.button>
              )}
              
              <div className="flex-1 bg-surface-2 border-2 md:border-3 border-black rounded-none px-3 py-2 md:px-4 md:py-2.5 shadow-[2px_2px_0px_#000000] md:shadow-[3px_3px_0px_#000000] focus-within:bg-white transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`พิมพ์ข้อความถึง ${selectedAgent.name}...`}
                  rows={1}
                  className="w-full bg-transparent text-black placeholder:text-black/50 focus:outline-none text-[11px] md:text-sm font-medium resize-none leading-relaxed py-0.5"
                />
              </div>
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 md:w-11 md:h-11 mb-0.5 rounded-none bg-primary text-primary-foreground border-2 border-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000000] md:shadow-[3px_3px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] hover:bg-primary/90 active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin stroke-[2.5] md:w-[18px] md:h-[18px]" />
                ) : (
                  <Send size={16} className="stroke-[2.5] md:w-[18px] md:h-[18px]" />
                )}
              </motion.button>
            </div>
            <p className="text-center text-[9px] md:text-[10px] font-bold text-black/50 mt-2 uppercase tracking-wider">
              SumStar OS Creative Studio Engine
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

