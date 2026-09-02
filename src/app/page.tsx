"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, Task } from "@/store/agentStore";
import { createClient } from "@/utils/supabase/client";
import { 
  ChevronDown, 
  Trash2, 
  AlarmClock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Play, 
  ListTodo,
  Tag,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Maximize2,
  Brain,
  Save,
  Pin,
  StickyNote,
  Calendar,
  Bot
} from "lucide-react";
import Swal from "sweetalert2";

import { NotebookModal } from "@/components/NotebookModal";

function ErrorAlert({ message }: { message: string }) {
  const [showDetails, setShowDetails] = useState(false);
  
  let summary = "เกิดข้อผิดพลาดในการเชื่อมต่อ AI";
  if (message.includes("429") || message.includes("quota")) {
    summary = "โควต้า API ของคุณหมด หรือเรียกใช้งานถี่เกินไป (Rate Limit)";
  } else if (message.includes("401") || message.includes("Incorrect API key")) {
    summary = "API Key ไม่ถูกต้อง กรุณาตรวจสอบในหน้า Settings";
  } else if (message.includes("404") || message.includes("no longer available") || message.includes("models/gemini")) {
    summary = "ไม่พบโมเดล AI ที่ระบุ หรือโมเดลนี้ถูกยกเลิกไปแล้ว";
  } else if (message.includes("invalid JSON") || message.includes("JSON")) {
    summary = "AI ตอบกลับมาในรูปแบบที่อ่านไม่ได้ (Invalid JSON)";
  } else {
    const firstSentence = message.split(/(?<=\.)\s/)[0];
    summary = firstSentence.replace(/\[CEO\] ❌ Error: /g, '').replace(/\[GoogleGenerativeAI Error\]:/g, '').substring(0, 100);
  }

  return (
    <div className="flex justify-center w-full mb-6 relative">
      {/* Marker Tape Accent */}
      <div className="absolute -top-3 z-10 px-3 py-0.5 bg-black text-white font-heading font-black text-[10px] uppercase tracking-wider rotate-[-3deg] border-2 border-black shadow-[2px_2px_0px_#000000]">
        System Notice
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20, rotate: -1.5 }} 
        animate={{ opacity: 1, y: 0, rotate: 0 }} 
        className="w-full max-w-xl bg-white text-black px-6 py-5 shadow-[5px_5px_0px_#000000] border-4 border-black relative rounded-none"
      >
        <div className="flex items-start gap-3 mt-1">
          <div className="mt-1 shrink-0">
            <AlertCircle size={22} className="text-[#FF0055] stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading font-black text-base text-black mb-1 leading-tight uppercase">{summary}</div>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-heading font-black underline uppercase tracking-wider text-black mt-1 hover:text-[#FF0055] transition-colors"
            >
              {showDetails ? "ซ่อนรายละเอียด" : "ดู Code Error"}
            </button>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="bg-surface p-3 rounded-none text-[10px] md:text-xs font-mono break-all whitespace-pre-wrap border-2 border-black text-black max-h-48 overflow-y-auto leading-normal">
                    {message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function HomeDashboard() {
  const { tasks, approveTaskPlan, deleteTask, agents } = useAgentStore();
  
  const [todos, setTodos] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sincareInput, setSincareInput] = useState("");
  const [isSincareLoading, setIsSincareLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: todosData } = await supabase.from('todos').select('*').eq('user_id', user.id);
      const { data: notesData } = await supabase.from('notes').select('*').eq('user_id', user.id);
      
      if (todosData) setTodos(todosData);
      if (notesData) setNotes(notesData);
    }
    loadData();
  }, []);

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Activity map
  const activityMap = useMemo(() => {
    const map: Record<string, { hasTodo: boolean, hasNote: boolean }> = {};
    todos.forEach(t => {
      if (t.due_date && !t.completed) {
        if (!map[t.due_date]) map[t.due_date] = { hasTodo: false, hasNote: false };
        map[t.due_date].hasTodo = true;
      }
    });
    notes.forEach(n => {
      const d = new Date(n.created_at);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateStr]) map[dateStr] = { hasTodo: false, hasNote: false };
      map[dateStr].hasNote = true;
    });
    return map;
  }, [todos, notes]);

  // Dashboard Stats
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos = todos.filter(t => !t.completed).length;
  
  // Note Categories map
  const noteCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    notes.forEach(n => {
      const cat = (n.category || "GENERAL").toUpperCase();
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Filter tasks for display
  const parentTasks = tasks.filter(t => !t.parentId);
  const activeTasks = parentTasks.filter(t => t.status !== 'done');
  const doneTasks = parentTasks.filter(t => t.status === 'done');

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const sincareAgent = Object.values(agents).find(a => a.name.toUpperCase() === "SINCARE");

  const handleSincareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sincareInput.trim()) return;

    setIsSincareLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "smart_chat",
          input: sincareInput.trim(),
          todos: todos,
          notes: notes
        })
      });

      const data = await res.json();
      if (data.result) {
        const { type, reply, noteData, todoData } = data.result;

        if (type === "ADD_NOTE" && noteData) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newDbNote } = await supabase.from("notes").insert({
              user_id: user.id,
              title: noteData.title,
              content: noteData.content,
              color: noteData.color,
              category: noteData.category,
              is_pinned: false
            }).select().single();
            
            if (newDbNote) setNotes(prev => [newDbNote, ...prev]);
          }
          
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'จดโน้ตเรียบร้อย!',
            text: reply,
            showConfirmButton: false,
            timer: 3000
          });
        } else if (type === "ADD_TODO" && todoData) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newDbTodo } = await supabase.from("todos").insert({
              user_id: user.id,
              title: todoData.title,
              priority: todoData.priority,
              category: todoData.category,
              completed: false
            }).select().single();
            if (newDbTodo) setTodos(prev => [newDbTodo, ...prev]);
          }
          
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'เพิ่มงานใหม่แล้ว!',
            text: reply,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'info',
            title: 'SINCARE',
            text: reply,
            showConfirmButton: false,
            timer: 3000
          });
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSincareInput("");
      setIsSincareLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background p-3 md:p-8 flex justify-center font-sans custom-scrollbar">
      <div className="w-full max-w-4xl space-y-6 md:space-y-8 mt-12 md:mt-6 pb-32 md:pb-40">
        
        {/* CALENDAR SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-card border-4 border-black dark:border-border rounded-none shadow-[4px_4px_0px_#000000] md:shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] relative p-4 md:p-8"
        >
          {/* Top Clip Badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-black text-white dark:bg-primary dark:text-primary-foreground font-heading font-black text-[10px] md:text-xs uppercase tracking-widest border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] whitespace-nowrap">
            SCHEDULE & ACTIVITY
          </div>

          <div className="flex items-center justify-between mb-6 pt-4">
            <h2 className="font-heading font-black text-xl md:text-2xl uppercase tracking-tight text-black dark:text-foreground">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 border-2 border-black dark:border-border bg-surface-2 hover:bg-accent shadow-[2px_2px_0px_#000000] transition-transform active:translate-x-0.5 active:translate-y-0.5">
                <ChevronLeft size={20} className="stroke-[3] text-black" />
              </button>
              <button onClick={nextMonth} className="p-2 border-2 border-black dark:border-border bg-surface-2 hover:bg-accent shadow-[2px_2px_0px_#000000] transition-transform active:translate-x-0.5 active:translate-y-0.5">
                <ChevronRight size={20} className="stroke-[3] text-black" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
              <div key={d} className="text-center font-heading font-black text-[10px] md:text-xs text-black/50 dark:text-foreground/50">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const activity = activityMap[dateStr];

              return (
                <div 
                  key={dayNum} 
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square border-2 flex flex-col items-center justify-start pt-1 md:pt-2 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_var(--border)] relative ${
                    isToday ? "border-primary bg-primary/10 shadow-[2px_2px_0px_#FF0055]" : "border-black/20 dark:border-border/30 bg-surface dark:bg-surface-2"
                  }`}
                >
                  <span className={`font-heading font-black text-xs md:text-sm ${isToday ? "text-primary" : "text-black dark:text-foreground"}`}>
                    {dayNum}
                  </span>
                  
                  {/* Dots */}
                  <div className="flex gap-1 mt-auto pb-2">
                    {activity?.hasTodo && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#FF0055]" title="Task Due" />}
                    {activity?.hasNote && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#0055FF]" title="Note Created" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 mt-6 text-[10px] font-heading font-black uppercase text-black/60">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF0055]" /> TO-DO DUE</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0055FF]" /> NOTE TAKEN</div>
          </div>
          
          {/* SINCARE QUICK NOTE */}
          <div className="mt-8 border-t-4 border-black dark:border-border pt-6">
            <form onSubmit={handleSincareSubmit} className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] md:text-xs font-black uppercase pl-1 pr-2 py-1 flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
                {sincareAgent?.imageUrl ? (
                  <img src={sincareAgent.imageUrl} alt="Sincare" className="w-4 h-4 object-cover border border-black shadow-[1px_1px_0px_#000000]" />
                ) : (
                  <Bot size={14} className="stroke-[2.5]" />
                )}
                <span className="hidden sm:inline-block">SINCARE</span>
              </div>
              <input 
                type="text" 
                value={sincareInput}
                onChange={(e) => setSincareInput(e.target.value)}
                disabled={isSincareLoading}
                placeholder="พิมพ์ให้ฉันจดโน้ต หรือเพิ่ม To-do ตรงนี้ได้เลย..."
                className="w-full bg-surface dark:bg-surface-2 border-4 border-black dark:border-border pl-[3.5rem] sm:pl-[7rem] pr-12 py-3.5 text-xs md:text-sm font-bold text-black dark:text-foreground placeholder:text-black/40 focus:outline-none shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] transition-shadow focus:shadow-[6px_6px_0px_#000000] disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isSincareLoading || !sincareInput.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white dark:bg-white dark:text-black p-1.5 hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSincareLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} className="stroke-[3]" />}
              </button>
            </form>
          </div>
        </motion.div>

        {/* PERFORMANCE DASHBOARD */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        >
          {/* Stats Card */}
          <div className="bg-[#FFF3B0] dark:bg-[#4A4020] border-4 border-black dark:border-amber-400/40 rounded-none shadow-[4px_4px_0px_#000000] p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b-2 border-black/20 pb-2">
              <h3 className="font-heading font-black text-black text-sm uppercase tracking-wide flex items-center gap-2">
                <ListTodo size={16} className="stroke-[3]" /> Personal To-Dos
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-black/20 border-2 border-black p-3 text-center">
                <div className="text-3xl font-black text-black font-heading mb-1">{completedTodos}</div>
                <div className="text-[10px] font-bold text-black/70 uppercase">Completed</div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 border-2 border-black p-3 text-center">
                <div className="text-3xl font-black text-[#FF0055] font-heading mb-1">{pendingTodos}</div>
                <div className="text-[10px] font-bold text-black/70 uppercase">Pending</div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-[#BEE1E6] dark:bg-[#1E3545] border-4 border-black dark:border-sky-400/40 rounded-none shadow-[4px_4px_0px_#000000] p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b-2 border-black/20 pb-2">
              <h3 className="font-heading font-black text-black text-sm uppercase tracking-wide flex items-center gap-2">
                <StickyNote size={16} className="stroke-[3]" /> Scratchpad Notes
              </h3>
              <span className="bg-black text-white px-2 py-0.5 text-xs font-black">{notes.length} Total</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[90px] overflow-y-auto custom-scrollbar pr-2">
              {noteCategories.length === 0 ? (
                <div className="text-xs font-bold text-black/50 text-center py-2">No notes categorized yet.</div>
              ) : (
                noteCategories.map(([cat, count]) => (
                  <div key={cat} className="flex justify-between items-center text-xs font-bold text-black border-b border-black/10 pb-1">
                    <span className="truncate">{cat}</span>
                    <span className="bg-white/50 px-1.5 py-0.5 border border-black/20 rounded-full text-[10px]">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* ACTIVE AGENT TASKS (Moved to bottom) */}
        <div className="bg-white dark:bg-card border-4 border-black dark:border-border rounded-none shadow-[4px_4px_0px_#000000] md:shadow-[8px_8px_0px_#000000] p-4 md:p-8 space-y-6 mb-12 md:mb-20">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-3 border-black dark:border-border pb-2">
              <div className="flex items-center gap-2 text-black dark:text-foreground font-heading font-black text-sm uppercase tracking-wider">
                <Brain size={16} className="stroke-[2.5]" />
                ACTIVE AGENT TASKS
              </div>
              <span className="bg-primary text-primary-foreground font-heading font-black text-xs px-2.5 py-0.5 border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000]">
                {activeTasks.length}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <AnimatePresence mode="popLayout">
                {activeTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-surface dark:bg-surface-2 border-3 border-black dark:border-border rounded-none p-8 text-center text-black dark:text-foreground font-heading font-bold text-sm uppercase shadow-[4px_4px_0px_#000000]"
                  >
                    No active agent tasks.
                  </motion.div>
                ) : (
                  activeTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      allTasks={tasks}
                      onApprove={() => approveTaskPlan(task.id)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* Calendar Day Popup Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-card border-4 border-black dark:border-border shadow-[8px_8px_0px_#000000] p-6 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black dark:border-border">
                <h3 className="font-heading font-black text-2xl uppercase text-black dark:text-foreground flex items-center gap-2">
                  <Calendar size={24} className="stroke-[3]" />
                  {new Date(selectedDate).toLocaleDateString("th-TH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="p-2 border-2 border-black bg-surface hover:bg-accent transition-colors">
                  <X size={20} className="stroke-[3] text-black" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                {/* To-Dos for this day */}
                <div>
                  <h4 className="font-heading font-black text-sm uppercase text-black/60 dark:text-foreground/60 mb-3 flex items-center gap-1.5">
                    <ListTodo size={14} className="stroke-[3]" /> Tasks Due
                  </h4>
                  {todos.filter(t => t.due_date === selectedDate).length === 0 ? (
                    <p className="text-xs font-bold text-black/40">No tasks due.</p>
                  ) : (
                    <div className="space-y-2">
                      {todos.filter(t => t.due_date === selectedDate).map(t => (
                        <div key={t.id} className="p-3 border-2 border-black bg-surface flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 w-4 h-4 border-2 border-black ${t.completed ? 'bg-black' : 'bg-white'}`} />
                          <div>
                            <div className={`font-heading font-black text-sm uppercase ${t.completed ? 'line-through opacity-50' : ''}`}>{t.title}</div>
                            {t.category && <div className="text-[10px] font-bold mt-1 bg-black text-white px-1.5 py-0.5 inline-block uppercase">{t.category}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes for this day */}
                <div>
                  <h4 className="font-heading font-black text-sm uppercase text-black/60 dark:text-foreground/60 mb-3 flex items-center gap-1.5">
                    <StickyNote size={14} className="stroke-[3]" /> Notes Created
                  </h4>
                  {notes.filter(n => n.created_at.startsWith(selectedDate)).length === 0 ? (
                    <p className="text-xs font-bold text-black/40">No notes.</p>
                  ) : (
                    <div className="space-y-3">
                      {notes.filter(n => n.created_at.startsWith(selectedDate)).map(n => (
                        <div key={n.id} className="p-3 border-2 border-black bg-[#FFF3B0] dark:text-black">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-heading font-black text-sm uppercase">{n.title}</h5>
                            {n.category && <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">{n.category}</span>}
                          </div>
                          <p className="text-xs font-medium whitespace-pre-wrap">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TaskItem({ 
  task, 
  allTasks,
  onApprove, 
  onDelete,
  isDone = false 
}: { 
  task: Task, 
  allTasks: Task[],
  onApprove: () => void, 
  onDelete: () => void,
  isDone?: boolean 
}) {
  const { processTask, provideFeedback, regenerateCEOPlan } = useAgentStore();
  const [expanded, setExpanded] = useState(task.status === 'pending-review');
  const [runningSubtask, setRunningSubtask] = useState<string | null>(null);
  const [feedbackBox, setFeedbackBox] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);
  
  const [savingMemory, setSavingMemory] = useState<string | null>(null);
  const [savedMemories, setSavedMemories] = useState<Set<string>>(new Set());

  const handleSaveMemory = async (st: Task) => {
    if (!st.details) return;
    setSavingMemory(st.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('memories').insert({
        user_id: user.id,
        agent_id: st.assigneeId || null,
        context: `Worked on task: ${st.title}`,
        content: st.details
      });
      setSavedMemories(prev => new Set(prev).add(st.id));
    }
    setSavingMemory(null);
  };

  const subtasks = allTasks.filter(t => t.parentId === task.id);
  const isEven = task.id.charCodeAt(0) % 2 === 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        layout: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 } 
      }}
      className={`mb-4 rounded-none border-3 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-y-0.5 transition-all duration-150 relative ${
        task.status === 'pending-review' ? 'bg-[#FFF3B0] text-black' :
        task.status === 'queued' ? 'bg-[#E0E1DD] text-black' :
        task.status === 'in-progress' ? 'bg-[#FFD166] text-black' :
        'bg-[#C7F9CC] text-black'
      } ${isEven ? 'rotate-[-1deg]' : 'rotate-[1.2deg]'}`}
    >
      {/* Hand-Drawn Pin Marker Accent */}
      <div className="absolute -top-3 left-6 z-10 px-2 py-0.5 bg-black text-white font-heading font-black text-[9px] uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_#000000] rotate-[-2deg]">
        #TASK
      </div>

      <div className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-black hover:bg-black/10 p-1 border border-black rounded-none transition-colors"
            >
              <ChevronRight size={14} className={`stroke-[3] md:w-4 md:h-4 w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            <h3 className={`font-heading font-black text-sm md:text-base uppercase tracking-tight truncate ${isDone ? 'line-through opacity-60 text-black' : 'text-black'}`}>
              {task.title}
            </h3>
            {task.tag && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] md:text-[10px] font-heading font-black uppercase bg-white border-2 border-black px-1.5 md:px-2 py-0.5 rounded-none text-black shadow-[1.5px_1.5px_0px_#000000]">
                <Tag size={9} className="stroke-[3]" /> {task.tag}
              </span>
            )}
          </div>
          {task.details && expanded && (
            <div className="mt-3 ml-7 md:ml-8 text-[10px] md:text-xs font-medium text-black/90 whitespace-pre-wrap bg-white/70 border-2 border-black p-2.5 md:p-3 rounded-none shadow-[2px_2px_0px_#000000]">
              {task.details}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-7 md:ml-0 shrink-0">
          <span className="text-[9px] md:text-[10px] font-heading font-black px-2 md:px-2.5 py-1 rounded-none uppercase tracking-wider border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000000]">
            {task.status.replace('-', ' ')}
          </span>

          <button onClick={onDelete} className="p-1 md:p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-black hover:bg-[#FF0055] hover:text-white rounded-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
            <Trash2 size={13} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Subtasks Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t-3 border-black dark:border-border px-3 md:px-5 py-3 md:py-4 ml-4 md:ml-6 mr-2 md:mr-3 mb-3 border-l-4 border-l-black dark:border-l-border overflow-hidden bg-white dark:bg-card shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)]"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3 border-b-2 border-black dark:border-border pb-2">
              <h4 className="text-[10px] md:text-xs font-heading font-black text-black dark:text-foreground flex items-center gap-1.5 md:gap-2 uppercase tracking-wider">
                <ListTodo size={12} className="stroke-[2.5]" /> CEO Breakdown Plan
              </h4>
              {subtasks.length > 0 && task.status === 'pending-review' && (
                <button 
                  disabled={isRegenerating || task.isGenerating}
                  onClick={async () => {
                    setIsRegenerating(true);
                    await regenerateCEOPlan(task.id);
                    setIsRegenerating(false);
                  }}
                  className="text-[9px] md:text-[10px] font-heading font-black uppercase flex items-center gap-1 md:gap-1.5 text-black dark:text-foreground hover:bg-accent hover:text-black transition-colors disabled:opacity-50 bg-white dark:bg-surface-2 px-2 md:px-2.5 py-1 rounded-none border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                >
                  {(isRegenerating || task.isGenerating) ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} className="stroke-[2.5]" />}
                  {(isRegenerating || task.isGenerating) ? 'REGENERATING...' : 'REGENERATE'}
                </button>
              )}
            </div>

            {task.isGenerating ? (
              <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-surface dark:bg-surface-2 rounded-none border-2 border-black dark:border-border border-dashed">
                <Loader2 size={24} className="animate-spin text-black dark:text-foreground mb-2 stroke-[2.5]" />
                <span className="text-[10px] md:text-xs font-heading font-black uppercase text-black dark:text-foreground">CEO is thinking...</span>
                <span className="text-[9px] md:text-[11px] text-black/70 dark:text-foreground/70 mt-0.5">Analyzing mission and breaking down tasks</span>
              </div>
            ) : subtasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-surface dark:bg-surface-2 rounded-none border-2 border-black dark:border-border border-dashed text-black dark:text-foreground">
                <span className="text-xs font-bold mb-2">No plan generated or generation failed.</span>
                <button 
                  disabled={isRegenerating}
                  onClick={async () => {
                    setIsRegenerating(true);
                    await regenerateCEOPlan(task.id);
                    setIsRegenerating(false);
                  }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-none text-xs font-heading font-black uppercase border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isRegenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} className="stroke-[2.5]" />} 
                  {isRegenerating ? 'REGENERATING...' : 'REGENERATE PLAN'}
                </button>
              </div>
            ) : (
              <>
                <ul className="space-y-2.5 mb-4">
                  {subtasks.map(st => (
                <li key={st.id} className="flex items-start gap-3 text-xs bg-surface-2 dark:bg-surface p-3 border-2 border-black dark:border-border rounded-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]">
                  <div className={`w-2.5 h-2.5 mt-1 shrink-0 border border-black dark:border-border ${
                    st.status === 'done' ? 'bg-black dark:bg-foreground' :
                    st.status === 'in-progress' ? 'bg-[#FFD166] animate-pulse' :
                    'bg-white dark:bg-card'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold flex-1 ${st.status === 'done' ? 'line-through opacity-60 text-black dark:text-foreground' : 'text-black dark:text-foreground'}`}>{st.title}</span>
                      {(st.status !== 'done' && st.status !== 'in-progress') && (
                        <button
                          disabled={runningSubtask === st.id}
                          onClick={async () => {
                            setRunningSubtask(st.id);
                            await processTask(st.id);
                            setRunningSubtask(null);
                          }}
                          className="shrink-0 flex items-center gap-1 text-[10px] font-heading font-black uppercase bg-primary text-primary-foreground border-2 border-black dark:border-border px-2 py-0.5 rounded-none shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_var(--border)] hover:opacity-90 transition-all active:translate-x-0.5 active:translate-y-0.5"
                        >
                          {runningSubtask === st.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} className="stroke-[3]" />}
                          {runningSubtask === st.id ? 'RUNNING...' : 'RUN'}
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] font-heading font-black uppercase text-black/70 dark:text-foreground/70 flex items-center gap-2 mt-1">
                      <span className="text-black dark:text-foreground">{st.department}</span>
                      <span>•</span>
                      <span>{st.status}</span>
                    </div>
                    {st.details && st.details !== `Part of ${task.title}` && (
                      <div className="mt-2 group relative">
                        <div 
                          onClick={() => setModalContent({ title: st.title, content: st.details! })}
                          className="text-xs text-black dark:text-foreground whitespace-pre-wrap bg-white dark:bg-surface-2 p-3 rounded-none border-2 border-black dark:border-border max-h-32 overflow-hidden relative cursor-pointer hover:bg-accent/20 transition-colors font-mono"
                        >
                          {st.details}
                        </div>
                        <button 
                          onClick={() => setModalContent({ title: st.title, content: st.details! })}
                          className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-primary text-primary-foreground border-2 border-black dark:border-border px-2 py-1 rounded-none text-[10px] font-heading font-black uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={11} className="stroke-[2.5]" /> ขยายอ่านเต็มๆ
                        </button>
                      </div>
                    )}
                    {st.feedback && (
                      <div className="mt-2 text-xs whitespace-pre-wrap bg-[#FF0055]/10 text-black dark:text-foreground p-3 rounded-none border-2 border-[#FF0055] font-medium">
                        <strong className="font-heading font-black uppercase text-[#FF0055]">Feedback:</strong> {st.feedback}
                      </div>
                    )}
                    {st.status === 'done' && (
                      <div className="mt-2 flex items-center gap-3">
                        {feedbackBox === st.id ? (
                          <div className="flex flex-col gap-2 w-full">
                            <textarea 
                              value={feedbackText} 
                              onChange={e => setFeedbackText(e.target.value)}
                              placeholder="บอกสิ่งที่คุณอยากให้ Agent แก้ไข..."
                              className="w-full bg-white dark:bg-surface-2 border-2 border-black dark:border-border rounded-none px-3 py-2 text-xs focus:outline-none text-black dark:text-foreground resize-none h-16"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setFeedbackBox(null)} className="px-3 py-1 rounded-none border-2 border-black dark:border-border text-[10px] font-heading font-black uppercase bg-white dark:bg-surface hover:opacity-80 text-black dark:text-foreground">Cancel</button>
                              <button 
                                disabled={!feedbackText.trim()}
                                onClick={async () => {
                                  await provideFeedback(st.id, feedbackText);
                                  setFeedbackBox(null);
                                  setFeedbackText("");
                                }}
                                className="bg-primary text-primary-foreground px-3 py-1 rounded-none border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] text-[10px] font-heading font-black uppercase hover:opacity-90 disabled:opacity-50"
                              >
                                Submit Feedback & Rerun
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setFeedbackBox(st.id); setFeedbackText(""); }}
                              className="text-[10px] font-heading font-black uppercase text-black dark:text-foreground hover:text-[#FF0055] dark:hover:text-[#FF4D6D] underline underline-offset-2 transition-colors"
                            >
                              สั่งแก้ / รีวิวผลลัพธ์
                            </button>
                            
                            <button
                              disabled={savedMemories.has(st.id) || savingMemory === st.id}
                              onClick={() => handleSaveMemory(st)}
                              className={`text-[10px] font-heading font-black uppercase flex items-center gap-1 transition-colors ${savedMemories.has(st.id) ? 'text-black dark:text-foreground' : 'text-black/70 dark:text-foreground/70 hover:text-black dark:hover:text-foreground'}`}
                            >
                              {savingMemory === st.id ? <Loader2 size={12} className="animate-spin" /> : savedMemories.has(st.id) ? <CheckCircle2 size={12} className="stroke-[3]" /> : <Save size={12} className="stroke-[2.5]" />}
                              {savedMemories.has(st.id) ? 'Saved to Memory' : 'Save to Memory'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {task.status === 'pending-review' && (
              <button 
                onClick={onApprove}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-heading font-black uppercase px-4 py-2.5 rounded-none border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:opacity-90 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Play size={14} className="stroke-[3]" /> Approve & Dispatch to Pipeline
              </button>
            )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalContent && (
          <NotebookModal 
            isOpen={!!modalContent} 
            onClose={() => setModalContent(null)} 
            content={modalContent.content} 
            title={modalContent.title} 
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}

