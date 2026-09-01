"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, Task } from "@/store/agentStore";
import { createClient } from "@/utils/supabase/client";
import { 
  ChevronDown, 
  Trash2, 
  AlarmClock, 
  CheckCircle2, 
  ChevronRight, 
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
  Pin
} from "lucide-react";

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

export default function CommandCenter() {
  const { tasks, delegateTaskByCEO, approveTaskPlan, deleteTask, logs, processTask } = useAgentStore();
  
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [selectedTag, setSelectedTag] = useState('Idea to debate');
  const [autoExecute, setAutoExecute] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isTagOpen, setIsTagOpen] = useState(false);
  const tags = ["Idea to debate", "Urgent bug", "Feature request", "Research needed"];

  const [isDelegating, setIsDelegating] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isDelegating) return;
    setIsDelegating(true);
    setErrorMsg(null);
    
    // Check initial log length to detect new errors
    const initialLogCount = useAgentStore.getState().logs.length;
    
    await delegateTaskByCEO(title.trim(), details.trim(), selectedTag, autoExecute);
    
    const currentLogs = useAgentStore.getState().logs;
    if (currentLogs.length > initialLogCount && currentLogs[0].message.includes('❌ Error:')) {
      setErrorMsg(currentLogs[0].message);
    } else {
      setTitle('');
      setDetails('');
    }
    setIsDelegating(false);
  };

  // Filter tasks for display
  const parentTasks = tasks.filter(t => !t.parentId); // Only top-level tasks
  const activeTasks = parentTasks.filter(t => t.status !== 'done');
  const doneTasks = parentTasks.filter(t => t.status === 'done');

  return (
    <main className="flex-1 overflow-y-auto bg-background p-3 md:p-8 flex justify-center font-sans">
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 mt-12 md:mt-6">
        
        {/* Command Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-card border-4 border-black dark:border-border rounded-none shadow-[4px_4px_0px_#000000] md:shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] relative p-4 md:p-6 pt-10 rotate-[-0.75deg] hover:rotate-0 transition-transform duration-200"
        >
          {/* Top Clip Badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-black text-white dark:bg-primary dark:text-primary-foreground font-heading font-black text-[10px] md:text-xs uppercase tracking-widest border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] whitespace-nowrap">
            COMMAND CENTER
          </div>

          <form onSubmit={handleAddTask} className="flex flex-col bg-surface-2 dark:bg-card border-2 border-black dark:border-border rounded-none relative">
            <input 
              type="text" 
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white dark:bg-surface border-b-3 border-black dark:border-border px-4 md:px-6 py-3 md:py-4 text-black dark:text-foreground placeholder:text-black/50 dark:placeholder:text-foreground/50 focus:outline-none font-heading font-black text-base md:text-xl uppercase tracking-tight"
            />
            <textarea 
              placeholder="Details (optional) — context, link, success criteria..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="bg-surface-2 dark:bg-surface-2 px-4 md:px-6 py-3 md:py-4 text-black dark:text-foreground placeholder:text-black/50 dark:placeholder:text-foreground/50 focus:outline-none text-xs md:text-sm font-medium resize-none h-20 md:h-28 leading-relaxed"
            />
            
            <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-black dark:border-border bg-white dark:bg-card">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Tag Selector */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsTagOpen(!isTagOpen)}
                    className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-heading font-black uppercase tracking-wider text-black dark:text-foreground bg-surface dark:bg-surface-2 hover:bg-accent hover:text-black border-2 border-black dark:border-border px-2 md:px-3 py-1 md:py-1.5 rounded-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    <Tag size={12} className="stroke-[2.5]" />
                    {selectedTag}
                    <ChevronDown size={14} className="stroke-[2.5]" />
                  </button>
                  
                  {isTagOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white dark:bg-card border-3 border-black dark:border-border rounded-none shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] z-50 py-1">
                      {tags.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setSelectedTag(t); setIsTagOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-heading font-bold uppercase text-black dark:text-foreground hover:bg-accent hover:text-black transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle Auto-Execute */}
                <label 
                  className="flex items-center gap-1.5 md:gap-2 cursor-pointer group select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    setAutoExecute(!autoExecute);
                  }}
                >
                  <div className={`w-8 md:w-10 h-4 md:h-5 border-2 border-black dark:border-border rounded-none p-0.5 transition-colors shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] ${autoExecute ? 'bg-primary' : 'bg-white dark:bg-surface'}`}>
                    <div className={`w-2.5 md:w-3.5 h-2.5 md:h-3.5 border border-black dark:border-border transition-transform ${autoExecute ? 'translate-x-3 md:translate-x-4 bg-accent' : 'translate-x-0 bg-primary'}`} />
                  </div>
                  <span className="text-[10px] md:text-xs font-heading font-black uppercase tracking-wider text-black dark:text-foreground group-hover:opacity-80 transition-opacity">Auto-Delegate</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={!title.trim() || isDelegating}
                className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-heading font-black uppercase tracking-wider text-[10px] md:text-xs px-4 md:px-6 py-2 md:py-2.5 rounded-none border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
              >
                {isDelegating ? <Loader2 size={14} className="animate-spin" /> : null}
                {isDelegating ? "CEO THINKING..." : "ADD TASK +"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Error Message */}
        {errorMsg && (
          <ErrorAlert message={errorMsg} />
        )}

        {/* Main Board Container */}
        <div className="bg-white dark:bg-card border-4 border-black dark:border-border rounded-none shadow-[4px_4px_0px_#000000] md:shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] p-4 md:p-8 mt-6 md:mt-8 space-y-6 rotate-[0.5deg]">
          {/* Reminders List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-3 border-black dark:border-border pb-2">
              <div className="flex items-center gap-2 text-black dark:text-foreground font-heading font-black text-sm uppercase tracking-wider">
                <AlarmClock size={16} className="stroke-[2.5]" />
                ACTIVE TASKS
              </div>
              <span className="bg-primary text-primary-foreground font-heading font-black text-xs px-2.5 py-0.5 border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]">
                {activeTasks.length}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <AnimatePresence mode="popLayout">
                {activeTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-surface dark:bg-surface-2 border-3 border-black dark:border-border rounded-none p-8 text-center text-black dark:text-foreground font-heading font-bold text-sm uppercase shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)]"
                  >
                    No active tasks. The CEO is waiting for your orders.
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

          {/* Recently Done */}
          <div className="space-y-4 pt-6 border-t-3 border-black dark:border-border">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-border pb-2">
              <div className="flex items-center gap-2 text-black dark:text-foreground font-heading font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} className="stroke-[2.5]" />
                COMPLETED ARCHIVE
              </div>
              <span className="bg-surface dark:bg-surface-2 text-black dark:text-foreground font-heading font-black text-xs px-2.5 py-0.5 border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]">
                {doneTasks.length}
              </span>
            </div>
            <div className="space-y-3 pt-2">
              <AnimatePresence mode="popLayout">
                {doneTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    allTasks={tasks}
                    onApprove={() => {}}
                    onDelete={() => deleteTask(task.id)}
                    isDone
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
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

