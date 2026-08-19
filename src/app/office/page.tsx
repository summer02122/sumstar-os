"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, Agent, Task } from "@/store/agentStore";
import { Plus, X, ArrowLeft, ArrowRight, Image as ImageIcon, Play, Loader2, Maximize2 } from "lucide-react";
import { NotebookModal } from "@/components/NotebookModal";

export default function OfficePage() {
  const { agents } = useAgentStore();
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline'>('grid');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-black mb-3">
                <div className="h-[2px] w-8 bg-black"></div>
                <span className="font-heading font-black text-xs uppercase tracking-widest">CREATIVE STUDIO AGENT ROSTER</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-heading font-black uppercase tracking-tighter text-black leading-none mb-4">
                SumStar OS <span className="underline decoration-wavy decoration-[#FF0055]">doesn't work alone.</span>
              </h1>
              <p className="text-black/80 max-w-xl text-xs md:text-sm font-medium leading-relaxed">
                ทีมเล็กๆ ที่ช่วยให้ ระบบ เกิดขึ้นทุกสัปดาห์ — สามารถคลิกดู card ของแต่ละคนเพื่อดูรายละเอียด SOPs และความรับผิดชอบ
              </p>
            </div>
            
            {/* View Mode Toggles */}
            <div className="inline-flex bg-white p-1 rounded-none border-3 border-black shadow-[4px_4px_0px_#000000] self-start md:self-end shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-xs font-heading font-black uppercase tracking-wider transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-black hover:bg-accent'}`}
              >
                Team grid
              </button>
              <button 
                onClick={() => setViewMode('pipeline')}
                className={`px-4 py-2 text-xs font-heading font-black uppercase tracking-wider transition-colors ${viewMode === 'pipeline' ? 'bg-primary text-primary-foreground' : 'text-black hover:bg-accent'}`}
              >
                Pipeline flow
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {Object.values(agents).map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PipelineView agents={agents} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const getDepartmentBadge = (dept: string) => {
    switch(dept) {
      case 'ORCHESTRATOR': return 'bg-[#FFE5EC] text-black border-black';
      case 'ENGINEERING': return 'bg-[#C7F9CC] text-black border-black';
      case 'RESEARCH': return 'bg-[#E0E1DD] text-black border-black';
      case 'CONTENT': return 'bg-[#FFCCD5] text-black border-black';
      case 'DESIGN': return 'bg-[#FFF3B0] text-black border-black';
      default: return 'bg-white text-black border-black';
    }
  };

  const deptBadgeStyle = getDepartmentBadge(agent.department);

  return (
    <div 
      className="relative h-[430px] perspective-1000 group cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 220, damping: 22 }}
      >
        {/* FRONT FACE */}
        <div className="absolute inset-0 backface-hidden w-full h-full bg-white border-4 border-black rounded-none p-4 flex flex-col shadow-[6px_6px_0px_#000000] group-hover:shadow-[8px_8px_0px_#000000] group-hover:-translate-y-1 transition-all">
          {/* Top Tag */}
          <div className="absolute -top-3 left-4 z-10">
            <span className={`text-[10px] font-heading font-black px-3 py-1 rounded-none border-2 border-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] ${deptBadgeStyle}`}>
              {agent.department}
            </span>
          </div>

          {/* Image Container */}
          <div className="flex-1 w-full bg-surface rounded-none overflow-hidden mb-4 border-2 border-black flex items-center justify-center relative mt-2">
            {agent.imageUrl ? (
              <img src={agent.imageUrl} alt={agent.name} className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300" />
            ) : (
              <div className="flex flex-col items-center justify-center text-black">
                 <ImageIcon size={44} strokeWidth={2} />
                 <span className="font-heading font-black text-[10px] mt-2 uppercase tracking-wider">No Avatar</span>
              </div>
            )}
            
            {/* Status Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-0.5 rounded-none shadow-[2px_2px_0px_#000000]">
              <span className={`w-2 h-2 border border-black ${agent.state === 'idle' ? 'bg-black' : 'bg-[#FFD166] animate-pulse'}`}></span>
              <span className="text-[10px] font-heading font-black uppercase text-black">{agent.state}</span>
            </div>
          </div>

          {/* Details */}
          <div className="px-1 border-t-2 border-black pt-3">
            <h3 className="font-heading font-black text-2xl text-black uppercase tracking-tight mb-0.5">
              {agent.name}
            </h3>
            <div className="flex items-center gap-2 text-black/80 text-[11px] uppercase tracking-wider font-bold">
              <span>— {agent.role}</span>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 backface-hidden w-full h-full bg-surface-2 border-4 border-black rounded-none p-5 flex flex-col shadow-[6px_6px_0px_#000000]"
          style={{ transform: "rotateY(180deg)" }}
        >
          {/* Inner Tag & Back button */}
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <span className={`text-[10px] font-heading font-black px-2.5 py-0.5 rounded-none border-2 border-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000000] ${deptBadgeStyle}`}>
              {agent.department}
            </span>
            <button className="text-xs font-heading font-black uppercase text-black flex items-center gap-1 hover:text-[#FF0055] transition-colors">
              <ArrowLeft size={12} className="stroke-[3]" /> BACK
            </button>
          </div>

          <h3 className="font-heading font-black text-2xl text-black uppercase tracking-tight mb-3">
            {agent.name}
          </h3>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
            <div>
              <h4 className="text-[10px] font-heading font-black text-black tracking-widest uppercase mb-1.5">Description</h4>
              <p className="text-xs font-medium text-black leading-relaxed bg-white border border-black p-2.5 shadow-[1.5px_1.5px_0px_#000000]">
                {agent.description}
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-heading font-black text-black tracking-widest uppercase mb-1.5">Key Duties</h4>
              <ul className="space-y-1.5">
                {agent.responsibilities.map((task, i) => (
                  <li key={i} className="text-xs font-medium text-black flex items-start gap-2 bg-white border border-black p-1.5 shadow-[1px_1px_0px_#000000]">
                    <span className="font-bold text-black">•</span>
                    <span className="leading-snug">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PipelineView({ agents }: { agents: Record<string, Agent> }) {
  const { tasks, createTask, moveTask, processTask } = useAgentStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      createTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const agentDepartments = Array.from(new Set(Object.values(agents).map(a => a.department)));
  
  const dynamicColumns = agentDepartments.map(dept => {
    let title = dept;
    let subtitle = 'Team';
    let headerColor = 'bg-[#FFE5EC] text-black';

    if (dept === 'ORCHESTRATOR') { title = 'ORCHESTRATION'; subtitle = 'CEO Agent'; headerColor = 'bg-[#FFF3B0] text-black'; }
    else if (dept === 'RESEARCH') { title = 'RESEARCH'; subtitle = 'Data & Insights'; headerColor = 'bg-[#E0E1DD] text-black'; }
    else if (dept === 'DESIGN') { title = 'UI/UX DESIGN'; subtitle = 'Layouts & Graphics'; headerColor = 'bg-[#FFCCD5] text-black'; }
    else if (dept === 'ENGINEERING') { title = 'ENGINEERING'; subtitle = 'Code & Bugs'; headerColor = 'bg-[#C7F9CC] text-black'; }
    else if (dept === 'CONTENT') { title = 'WRITING'; subtitle = 'Docs & Copy'; headerColor = 'bg-[#FFD166] text-black'; }
    else { 
      title = dept; 
      subtitle = 'Custom Team'; 
      headerColor = 'bg-[#FFE5EC] text-black'; 
    }

    return { id: dept, title, subtitle, headerColor };
  });

  const orderedDepts = ['ORCHESTRATOR', 'RESEARCH', 'DESIGN', 'ENGINEERING', 'CONTENT'];
  dynamicColumns.sort((a, b) => {
    const indexA = orderedDepts.indexOf(a.id);
    const indexB = orderedDepts.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const columns = [
    {
      id: 'QUEUE',
      title: 'QUEUE',
      subtitle: 'Tasks waiting',
      headerColor: 'bg-white text-black'
    },
    ...dynamicColumns,
    {
      id: 'DONE',
      title: 'DONE',
      subtitle: 'Completed',
      headerColor: 'bg-[#C7F9CC] text-black'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Create Task Input */}
      <form onSubmit={handleCreateTask} className="flex items-center gap-3 bg-white border-4 border-black p-2.5 rounded-none max-w-xl shadow-[5px_5px_0px_#000000]">
        <input 
          type="text" 
          placeholder="Type a new task and press Enter..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none px-3 font-heading font-black text-xs md:text-sm uppercase text-black placeholder:text-black/50"
        />
        <button type="submit" className="bg-primary text-primary-foreground p-2.5 rounded-none border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-primary/90 active:translate-x-0.5 active:translate-y-0.5 transition-all">
          <Plus size={18} className="stroke-[3]" />
        </button>
      </form>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory min-h-[600px] custom-scrollbar">
        {columns.map((col, idx) => {
          const columnTasks = tasks.filter(t => t.department === col.id);
          
          const groupedTasks: Record<string, { parent: Task | null, items: Task[] }> = {};
          columnTasks.forEach(task => {
            if (task.parentId) {
              if (!groupedTasks[task.parentId]) {
                const parent = tasks.find(t => t.id === task.parentId) || null;
                groupedTasks[task.parentId] = { parent, items: [] };
              }
              groupedTasks[task.parentId].items.push(task);
            } else {
              if (!groupedTasks[task.id]) {
                groupedTasks[task.id] = { parent: task, items: [] };
              } else {
                groupedTasks[task.id].parent = task;
              }
            }
          });
          
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className="flex-shrink-0 w-[320px] snap-center bg-white rounded-none border-4 border-black flex flex-col overflow-hidden shadow-[6px_6px_0px_#000000]"
            >
              <div className={`p-4 border-b-4 border-black ${col.headerColor}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-heading font-black text-xs uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground border border-black shadow-[1.5px_1.5px_0px_#000000]">
                    {col.title}
                  </div>
                  <span className="font-heading font-black text-xs text-black border-2 border-black bg-white px-2 py-0.5 shadow-[1.5px_1.5px_0px_#000000]">{columnTasks.length}</span>
                </div>
                <div className="text-[11px] font-bold text-black/70 uppercase">{col.subtitle}</div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto bg-surface-2">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 text-black/40 border-2 border-dashed border-black rounded-none p-4 text-center bg-white">
                    <span className="font-heading font-black text-xs uppercase">No Tasks</span>
                  </div>
                ) : (
                  Object.entries(groupedTasks).map(([groupId, group]) => {
                      const rootTask = group.parent || group.items[0];
                      const hasSubtasks = group.items.length > 0;

                      if (!hasSubtasks) {
                        const task = rootTask;
                        const assignee = task.assigneeId ? agents[task.assigneeId] : null;
                        return (
                          <motion.div 
                            whileHover={{ y: -2, rotate: 0.5 }}
                            key={task.id} 
                            onClick={() => {
                              if (task.details) setModalContent({ title: task.title, content: task.details });
                            }}
                            className="bg-white border-3 border-black rounded-none p-4 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] transition-all group relative cursor-pointer min-h-[120px] flex flex-col"
                          >
                            <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground font-heading font-black text-[9px] uppercase border border-black shadow-[1px_1px_0px_#000000] rotate-[-2deg] z-10">
                              TASK
                            </div>
                            
                            <h4 className="font-heading font-black text-xs md:text-sm text-black mb-3 leading-snug pr-2 mt-1 uppercase">
                              {task.title}
                            </h4>
                            
                            <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-black">
                              {assignee ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-none bg-white overflow-hidden border border-black">
                                     {assignee.imageUrl ? (
                                       <img src={assignee.imageUrl} alt={assignee.name} className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="w-full h-full bg-accent text-black flex items-center justify-center text-[10px] font-black">
                                         {assignee.name.charAt(0)}
                                       </div>
                                     )}
                                  </div>
                                  <span className="text-[10px] font-heading font-black uppercase text-black">{assignee.name}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] font-bold text-black/60 uppercase px-2 py-0.5 bg-white rounded-none border border-black">
                                  Unassigned
                                </div>
                              )}

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center" onClick={e => e.stopPropagation()}>
                                {assignee && col.id !== 'QUEUE' && col.id !== 'DONE' && task.status !== 'done' && (
                                  <button 
                                    onClick={() => {
                                      setProcessingTaskId(task.id);
                                      processTask(task.id).finally(() => setProcessingTaskId(null));
                                    }}
                                    disabled={processingTaskId === task.id || assignee.state === 'thinking'}
                                    className="p-1.5 bg-primary text-primary-foreground rounded-none border border-black shadow-[1.5px_1.5px_0px_#000000] hover:bg-primary/90 mr-1 disabled:opacity-50"
                                  >
                                    {processingTaskId === task.id || assignee.state === 'thinking' ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Play size={13} className="stroke-[3]" />
                                    )}
                                  </button>
                                )}

                                {idx > 0 && (
                                  <button onClick={() => moveTask(task.id, columns[idx - 1].id)} className="p-1 bg-white hover:bg-[#FFCAD4] border border-black rounded-none text-black transition-colors">
                                    <ArrowLeft size={13} className="stroke-[2.5]" />
                                  </button>
                                )}
                                {idx < columns.length - 1 && (
                                  <button onClick={() => moveTask(task.id, columns[idx + 1].id)} className="p-1 bg-white hover:bg-[#FFCAD4] border border-black rounded-none text-black transition-colors">
                                    <ArrowRight size={13} className="stroke-[2.5]" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {task.details && (
                              <div className="absolute top-2 right-2 text-black/60">
                                <Maximize2 size={12} className="stroke-[2.5]" />
                              </div>
                            )}
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div 
                          whileHover={{ y: -2 }}
                          key={`group-${groupId}`} 
                          className="bg-white border-3 border-black rounded-none p-4 shadow-[4px_4px_0px_#000000] relative flex flex-col"
                        >
                          <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground font-heading font-black text-[9px] uppercase border border-black shadow-[1px_1px_0px_#000000] rotate-[-2deg] z-10">
                            PIPELINE BATCH
                          </div>
                          
                          <h4 className="font-heading font-black text-xs md:text-sm text-black mb-3 leading-snug pr-2 mt-1 uppercase">
                            {rootTask.title}
                          </h4>
                          
                          <div className="flex flex-col gap-2 mt-1">
                            {group.items.map(subtask => {
                               const assignee = subtask.assigneeId ? agents[subtask.assigneeId] : null;
                               return (
                                 <div key={subtask.id} className="bg-surface rounded-none p-3 border-2 border-black text-xs text-black group/subtask shadow-[2px_2px_0px_#000000]">
                                   <div className="font-bold mb-2 leading-relaxed">{subtask.title}</div>
                                   <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/20">
                                     {assignee ? (
                                       <div className="flex items-center gap-1.5">
                                         <div className="w-5 h-5 rounded-none bg-white overflow-hidden border border-black">
                                            {assignee.imageUrl ? <img src={assignee.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-accent text-black flex items-center justify-center text-[9px] font-black">{assignee.name.charAt(0)}</div>}
                                         </div>
                                         <span className="text-[10px] font-heading font-black uppercase text-black">{assignee.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[10px] font-bold text-black/60 uppercase">Unassigned</span>
                                     )}
                                     
                                     <div className="flex gap-1 items-center">
                                       {subtask.details && (
                                          <button onClick={() => setModalContent({title: subtask.title, content: subtask.details!})} className="p-1 hover:bg-accent border border-black rounded-none text-black transition-colors">
                                            <Maximize2 size={11} className="stroke-[2.5]" />
                                          </button>
                                       )}
                                       {idx > 0 && (
                                         <button onClick={() => moveTask(subtask.id, columns[idx - 1].id)} className="p-1 opacity-0 group-hover/subtask:opacity-100 bg-white hover:bg-accent border border-black rounded-none text-black transition-all">
                                           <ArrowLeft size={11} className="stroke-[2.5]" />
                                         </button>
                                       )}
                                       {idx < columns.length - 1 && (
                                         <button onClick={() => moveTask(subtask.id, columns[idx + 1].id)} className="p-1 opacity-0 group-hover/subtask:opacity-100 bg-white hover:bg-accent border border-black rounded-none text-black transition-all">
                                           <ArrowRight size={11} className="stroke-[2.5]" />
                                         </button>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               );
                            })}
                          </div>
                        </motion.div>
                      );
                  })
                )}
              </div>
            </motion.div>
          );
        })}
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
    </div>
  );
}

