"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, Skill } from "@/store/agentStore";
import { BookOpen, Plus, Trash2, Edit2, Check, X, FileText, Sparkles, Loader2 } from "lucide-react";

export default function SkillsPage() {
  const { skills, createSkill, updateSkill, deleteSkill } = useAgentStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [editForm, setEditForm] = useState<Partial<Skill>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editForm.name) {
      alert("กรุณากรอกชื่อ Skill ก่อนครับ (เช่น 'เซลล์ขายของ')");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/skills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, description: editForm.description })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.sop) {
        setEditForm(prev => ({ ...prev, sop: data.sop }));
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to generate SOP: " + (e.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (editForm.name && editForm.sop) {
      await createSkill(editForm.name, editForm.description || "", editForm.sop);
      setIsCreating(false);
      setEditForm({});
    }
  };

  const handleUpdate = async (id: string) => {
    if (editForm.name && editForm.sop) {
      await updateSkill(id, editForm);
      setIsEditing(null);
      setEditForm({});
    }
  };

  const startEdit = (skill: Skill) => {
    setIsEditing(skill.id);
    setEditForm(skill);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 md:px-10 py-6 border-b-4 border-black bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-4xl font-heading font-black uppercase tracking-tight text-black mb-1 flex items-center gap-3">
            <BookOpen className="text-black stroke-[2.5]" size={28} />
            Skills & SOPs Library
          </h1>
          <p className="text-black/70 text-xs md:text-sm font-bold uppercase tracking-wider">
            Standard Operating Procedures (SOPs) for AI Agents
          </p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setEditForm({}); }}
          className="bg-black text-white px-5 py-2.5 rounded-none text-xs font-heading font-black uppercase tracking-wider flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#FFCAD4] hover:text-black hover:shadow-[5px_5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <Plus size={16} className="stroke-[3]" /> Create New Skill
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <AnimatePresence>
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border-4 border-black rounded-none p-6 shadow-[6px_6px_0px_#000000] mb-8"
              >
                <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                  <h3 className="font-heading font-black text-lg uppercase tracking-tight text-black">Create New Skill (SOP)</h3>
                  <button onClick={() => setIsCreating(false)} className="text-black hover:text-[#FF0055]"><X size={20} className="stroke-[3]" /></button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-black text-black uppercase tracking-wider mb-1.5">Skill Name</label>
                    <input 
                      type="text" 
                      value={editForm.name || ""} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      placeholder="e.g., Market Research, Code Review" 
                      className="w-full bg-surface-2 border-2 border-black rounded-none px-4 py-2.5 text-xs md:text-sm font-medium focus:bg-white text-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-black text-black uppercase tracking-wider mb-1.5">Description</label>
                    <input 
                      type="text" 
                      value={editForm.description || ""} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Brief description of what this skill does" 
                      className="w-full bg-surface-2 border-2 border-black rounded-none px-4 py-2.5 text-xs md:text-sm font-medium focus:bg-white text-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-heading font-black text-black uppercase tracking-wider">SOP Instructions</label>
                      <button 
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="text-xs font-heading font-black uppercase text-black bg-surface px-3 py-1 border border-black shadow-[1.5px_1.5px_0px_#000000] hover:bg-accent flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? <Loader2 size={13} className="animate-spin stroke-[3]" /> : <Sparkles size={13} className="stroke-[2.5]" />}
                        {isGenerating ? 'GENERATING...' : 'AI AUTO-GENERATE'}
                      </button>
                    </div>
                    <textarea 
                      value={editForm.sop || ""} 
                      onChange={e => setEditForm({...editForm, sop: e.target.value})}
                      placeholder="1. First do this...\n2. Then check that...\n3. Finally generate..." 
                      className="w-full h-40 bg-surface-2 border-2 border-black rounded-none px-4 py-3 text-xs md:text-sm focus:bg-white text-black font-mono resize-none focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-none text-xs font-heading font-black uppercase text-black border-2 border-black bg-white hover:bg-black/10 transition-colors">Cancel</button>
                    <button onClick={handleCreate} className="bg-black text-white px-6 py-2 rounded-none text-xs font-heading font-black uppercase flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-black/90 active:translate-x-0.5 active:translate-y-0.5">
                      <Check size={16} className="stroke-[3]" /> Save Skill
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-6">
            {skills.map((skill, index) => (
              <motion.div 
                key={skill.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border-4 border-black rounded-none shadow-[5px_5px_0px_#000000] hover:shadow-[7px_7px_0px_#000000] transition-all group relative ${index % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'} hover:rotate-0`}
              >
                {/* SOP Marker Tape Accent */}
                <div className="absolute -top-3 left-6 z-10 px-2.5 py-0.5 bg-black text-white font-heading font-black text-[9px] uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_#000000] rotate-[-2deg]">
                  #SOP
                </div>
                {isEditing === skill.id ? (
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                      <h3 className="font-heading font-black text-base uppercase text-black">Edit Skill</h3>
                      <button onClick={() => setIsEditing(null)} className="text-black hover:text-[#FF0055]"><X size={20} className="stroke-[3]" /></button>
                    </div>
                    <div>
                      <input 
                        type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-surface-2 border-2 border-black rounded-none px-4 py-2 text-xs md:text-sm font-medium mb-3 focus:bg-white"
                      />
                      <input 
                        type="text" value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="w-full bg-surface-2 border-2 border-black rounded-none px-4 py-2 text-xs md:text-sm font-medium mb-3 focus:bg-white"
                      />
                      <textarea 
                        value={editForm.sop || ""} onChange={e => setEditForm({...editForm, sop: e.target.value})}
                        className="w-full h-40 bg-surface-2 border-2 border-black rounded-none px-4 py-3 text-xs md:text-sm font-mono resize-none focus:bg-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => handleUpdate(skill.id)} className="bg-black text-white px-6 py-2 rounded-none text-xs font-heading font-black uppercase flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-black/90">
                        <Check size={16} className="stroke-[3]" /> Update Skill
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-3">
                      <div>
                        <h3 className="font-heading font-black text-lg uppercase tracking-tight text-black mb-1 flex items-center gap-2">
                          <FileText size={18} className="stroke-[2.5]" />
                          {skill.name}
                        </h3>
                        <p className="text-xs font-medium text-black/70">{skill.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(skill)} className="p-2 text-black bg-white hover:bg-surface border-2 border-black shadow-[2px_2px_0px_#000000] rounded-none active:translate-x-0.5 active:translate-y-0.5 transition-all"><Edit2 size={13} className="stroke-[2.5]" /></button>
                        <button onClick={() => deleteSkill(skill.id)} className="p-2 text-black hover:text-white bg-white hover:bg-[#FF0055] border-2 border-black shadow-[2px_2px_0px_#000000] rounded-none active:translate-x-0.5 active:translate-y-0.5 transition-all"><Trash2 size={13} className="stroke-[2.5]" /></button>
                      </div>
                    </div>
                    <div className="bg-surface-2 border-2 border-black rounded-none p-4 text-xs font-mono text-black whitespace-pre-wrap shadow-[2px_2px_0px_#000000]">
                      {skill.sop}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {skills.length === 0 && !isCreating && (
              <div className="text-center py-20 bg-white border-4 border-dashed border-black rounded-none p-8">
                <BookOpen className="mx-auto text-black mb-4 stroke-[2]" size={48} />
                <h3 className="font-heading font-black text-lg uppercase text-black mb-1">No Skills Found</h3>
                <p className="text-xs font-bold text-black/70 uppercase max-w-md mx-auto">
                  Create Standard Operating Procedures (SOPs) to give your agents strict workflows to follow.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

