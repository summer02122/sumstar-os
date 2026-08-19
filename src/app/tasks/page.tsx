"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, Task } from "@/store/agentStore";
import { 
  Search, ChevronDown, CheckCircle2, Circle, 
  Loader2, Clock, ListTodo, Play, Tag, Trash2, Maximize2, FileText
} from "lucide-react";
import { NotebookModal } from "@/components/NotebookModal";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  'done':           { label: 'DONE',         color: 'text-black',   dot: 'bg-black' },
  'in-progress':    { label: 'IN PROGRESS',  color: 'text-black',   dot: 'bg-[#FFD166] animate-pulse' },
  'queued':         { label: 'QUEUED',       color: 'text-black/70', dot: 'bg-black/40' },
  'pending-review': { label: 'REVIEW',       color: 'text-black', dot: 'bg-[#FF0055]' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, color: 'text-black', dot: 'bg-black' };
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 border border-black bg-white rounded-none shadow-[1px_1px_0px_#000000]">
      <div className={`w-2 h-2 border border-black shrink-0 ${cfg.dot}`} />
      <span className={`text-[10px] font-heading font-black tracking-wider ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

function ProjectCard({ parentTask, allTasks, agents, processTask, deleteTask, onOpenModal }: {
  parentTask: Task;
  allTasks: Task[];
  agents: Record<string, any>;
  processTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => void;
  onOpenModal: (content: {title: string, content: string}) => void;
}) {
  const subtasks = allTasks.filter(t => t.parentId === parentTask.id);
  const [expanded, setExpanded] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  const doneCount = subtasks.filter(t => t.status === 'done').length;
  const total = subtasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const projectStatus = subtasks.length === 0 ? parentTask.status :
    subtasks.every(t => t.status === 'done') ? 'done' :
    subtasks.some(t => t.status === 'in-progress') ? 'in-progress' :
    'queued';

  const isEven = parentTask.id.charCodeAt(0) % 2 === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] transition-all relative ${isEven ? 'rotate-[-0.6deg]' : 'rotate-[0.6deg]'} hover:rotate-0 mb-6`}
    >
      {/* Tape Accent */}
      <div className="absolute -top-3 left-6 z-10 px-2.5 py-0.5 bg-black text-white font-heading font-black text-[9px] uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_#000000] rotate-[-2deg]">
        #PROJECT
      </div>
      {/* Project Header */}
      <div className="p-5 flex items-start gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-black p-1 border-2 border-black bg-white hover:bg-[#FFCAD4] rounded-none shadow-[1.5px_1.5px_0px_#000000] transition-colors shrink-0"
        >
          <ChevronDown size={16} className={`stroke-[3] transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-black text-base md:text-lg uppercase tracking-tight leading-snug">{parentTask.title}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {parentTask.tag && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-heading font-black uppercase bg-surface border border-black px-2 py-0.5 rounded-none text-black shadow-[1px_1px_0px_#000000]">
                    <Tag size={9} className="stroke-[3]" /> {parentTask.tag}
                  </span>
                )}
                <StatusBadge status={projectStatus} />
                {total > 0 && (
                  <span className="text-[10px] font-heading font-bold text-black bg-surface-2 px-2 py-0.5 border border-black">{doneCount}/{total} TASKS</span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteTask(parentTask.id)}
              className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-black hover:bg-[#FF0055] hover:text-white rounded-none active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
            >
              <Trash2 size={13} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Progress Bar */}
          {total > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-surface border-2 border-black rounded-none overflow-hidden">
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[11px] font-heading font-black text-black w-9 text-right">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      <AnimatePresence>
        {expanded && subtasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t-3 border-black bg-surface-2"
          >
            <div className="divide-y-2 divide-black">
              {subtasks.map((st, idx) => {
                const assignee = st.assigneeId ? agents[st.assigneeId] : null;
                const isDone = st.status === 'done';
                return (
                  <div key={st.id} className={`flex items-start gap-4 px-5 py-3.5 bg-white hover:bg-surface transition-colors ${isDone ? 'opacity-60' : ''}`}>
                    {/* Index */}
                    <span className="text-[11px] font-mono font-bold text-black mt-0.5 w-4 shrink-0">{idx + 1}.</span>

                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-black stroke-[3]" />
                      ) : st.status === 'in-progress' ? (
                        <Loader2 size={16} className="text-black animate-spin stroke-[3]" />
                      ) : (
                        <Circle size={16} className="text-black/40 stroke-[2.5]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs md:text-sm font-bold leading-snug ${isDone ? 'line-through text-black/60' : 'text-black'}`}>
                        {st.title}
                      </p>
                      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-heading font-black uppercase text-black bg-surface px-1.5 py-0.5 border border-black">{st.department}</span>
                        {assignee && (
                          <span className="text-[10px] font-heading font-black uppercase text-black flex items-center gap-1">
                            <div className="w-3.5 h-3.5 border border-black bg-accent text-black flex items-center justify-center text-[8px] font-bold">
                              {assignee.name.charAt(0)}
                            </div>
                            {assignee.name}
                          </span>
                        )}
                      </div>

                      {/* Output */}
                      {st.details && st.details !== `Part of ${parentTask.title}` && (
                        <button 
                          onClick={() => onOpenModal({ title: st.title, content: st.details! })}
                          className="mt-2.5 w-full flex items-center justify-between p-2.5 bg-white rounded-none border-2 border-black hover:bg-[#FFCAD4] shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-left"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="stroke-[2.5]" />
                            <span className="font-heading font-black uppercase text-[11px] text-black">VIEW AGENT'S REPORT & NOTE</span>
                          </div>
                          <Maximize2 size={13} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>

                    {/* Run Button */}
                    {!isDone && st.status !== 'in-progress' && (
                      <button
                        disabled={runningId === st.id}
                        onClick={async () => {
                          setRunningId(st.id);
                          await processTask(st.id);
                          setRunningId(null);
                        }}
                        className="shrink-0 flex items-center gap-1 text-[10px] font-heading font-black uppercase bg-black text-white border-2 border-black shadow-[2px_2px_0px_#000000] px-3 py-1 rounded-none hover:bg-black/90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      >
                        {runningId === st.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} className="stroke-[3]" />}
                        {runningId === st.id ? 'RUNNING' : 'RUN'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {expanded && subtasks.length === 0 && (
        <div className="px-5 pb-5 pt-2 flex items-center gap-2 text-xs font-bold text-black/70 uppercase">
          <ListTodo size={14} className="stroke-[2.5]" />
          <span>No subtasks yet. CEO is still planning...</span>
        </div>
      )}
    </motion.div>
  );
}

export default function TasksPage() {
  const { tasks, agents, processTask, deleteTask } = useAgentStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);

  const parentTasks = tasks.filter(t => !t.parentId);
  const filtered = parentTasks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTasks = filtered.filter(t => t.status !== 'done');
  const doneTasks = filtered.filter(t => t.status === 'done');

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">

        <header className="mb-6 border-b-4 border-black pb-4">
          <h1 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-tight text-black mb-1">
            Project Board
          </h1>
          <p className="text-xs md:text-sm font-bold text-black/70 uppercase tracking-wider">All your studio projects and delegated tasks in one place.</p>
        </header>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black stroke-[3]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border-3 border-black rounded-none pl-11 pr-4 py-3 text-xs md:text-sm font-heading font-bold uppercase tracking-wider text-black placeholder:text-black/50 shadow-[4px_4px_0px_#000000] focus:bg-[#FFF0F3] focus:outline-none"
          />
        </div>

        {/* Active Projects */}
        {activeTasks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 text-xs font-heading font-black text-black uppercase tracking-wider mb-4 px-1">
              <Clock size={14} className="stroke-[3]" />
              ACTIVE PROJECTS
              <span className="bg-black text-white border border-black px-2 py-0.5 rounded-none shadow-[1.5px_1.5px_0px_#000000]">{activeTasks.length}</span>
            </div>
            <div className="space-y-4">
              {activeTasks.map(task => (
                <ProjectCard
                  key={task.id}
                  parentTask={task}
                  allTasks={tasks}
                  agents={agents}
                  processTask={processTask}
                  deleteTask={deleteTask}
                  onOpenModal={setModalContent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Done Projects */}
        {doneTasks.length > 0 && (
          <section className="opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-xs font-heading font-black text-black uppercase tracking-wider mb-4 px-1">
              <CheckCircle2 size={14} className="text-black stroke-[3]" />
              COMPLETED ARCHIVE
              <span className="bg-surface border border-black px-2 py-0.5 rounded-none shadow-[1.5px_1.5px_0px_#000000]">{doneTasks.length}</span>
            </div>
            <div className="space-y-4">
              {doneTasks.map(task => (
                <ProjectCard
                  key={task.id}
                  parentTask={task}
                  allTasks={tasks}
                  agents={agents}
                  processTask={processTask}
                  deleteTask={deleteTask}
                  onOpenModal={setModalContent}
                />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white border-4 border-dashed border-black p-8">
            <ListTodo size={40} className="mx-auto mb-3 text-black stroke-[2]" />
            <p className="font-heading font-black uppercase text-sm text-black">No projects found.</p>
          </div>
        )}

      </div>

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
    </main>
  );
}

