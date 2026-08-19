"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Brain, Clock, Bot, Trash2, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MemoryPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchMemories();
    const channel = supabase.channel('public:memories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, () => {
        fetchMemories();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); }
  }, []);

  const fetchMemories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('memories')
      .select('*, agents(name, role, department, color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMemories(data || []);
    setLoading(false);
  };

  const deleteMemory = async (id: string) => {
    setDeletingId(id);
    await supabase.from('memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
    setDeletingId(null);
  };

  const clearAllMemories = async () => {
    if (!confirm('ลบความจำทั้งหมดเลยไหมครับ? ข้อมูลนี้จะหายถาวรนะครับ')) return;
    setClearingAll(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('memories').delete().eq('user_id', user.id);
      setMemories([]);
    }
    setClearingAll(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-4 border-black pb-4">
          <div>
            <div className="flex items-center gap-2 text-black mb-2">
              <span className="font-heading font-black text-xs uppercase tracking-widest bg-black text-white px-2 py-0.5 border border-black shadow-[1.5px_1.5px_0px_#000000]">ARCHIVE</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-tight text-black flex items-center gap-3">
              <Brain className="text-black stroke-[2.5]" size={32} /> Central Memory
            </h1>
            <p className="text-xs md:text-sm font-bold text-black/70 mt-1 uppercase">ความทรงจำและประสบการณ์ทำงานของ AI ทุกตัวในทีม</p>
          </div>
          {memories.length > 0 && (
            <button
              onClick={clearAllMemories}
              disabled={clearingAll}
              className="flex items-center gap-2 text-xs font-heading font-black uppercase text-black bg-white hover:bg-[#FF0055] hover:text-white border-2 border-black shadow-[3px_3px_0px_#000000] px-4 py-2.5 rounded-none active:translate-x-0.5 active:translate-y-0.5 transition-all self-start"
            >
              {clearingAll ? (
                <span className="animate-pulse">กำลังลบ...</span>
              ) : (
                <>
                  <Trash size={14} className="stroke-[2.5]" />
                  ล้างความจำทั้งหมด
                </>
              )}
            </button>
          )}
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-black font-heading font-black uppercase text-sm animate-pulse bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_#000000]">
              Accessing Neural Network...
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-20 text-black bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_#000000]">
              <Brain size={48} className="mx-auto mb-4 stroke-[2]" />
              <p className="font-heading font-black text-lg uppercase">ยังไม่มีความทรงจำบันทึกไว้</p>
              <p className="text-xs font-bold text-black/70 mt-2 uppercase">เมื่อ Agent ทำงานเสร็จ ประสบการณ์จะถูกบันทึกที่นี่</p>
            </div>
          ) : (
            <AnimatePresence>
              {memories.map((mem, index) => (
                <motion.div
                  key={mem.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white border-4 border-black rounded-none shadow-[5px_5px_0px_#000000] hover:shadow-[7px_7px_0px_#000000] hover:-translate-y-0.5 transition-all group ${index % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'} hover:rotate-0 mb-5`}
                >
                  <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black bg-surface">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none bg-white border-2 border-black flex items-center justify-center font-heading font-black text-black shrink-0 text-sm shadow-[1.5px_1.5px_0px_#000000]">
                        {mem.agents?.name?.charAt(0) || <Bot size={16} className="stroke-[2.5]" />}
                      </div>
                      <div>
                        <div className="font-heading font-black text-sm uppercase text-black">{mem.agents?.name || 'Unknown Agent'}</div>
                        <div className="text-[10px] font-bold text-black/70 tracking-wide uppercase">{mem.agents?.department} • {mem.agents?.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-black bg-white px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000]">
                        <Clock size={11} className="stroke-[2.5]" /> {new Date(mem.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <button
                        onClick={() => deleteMemory(mem.id)}
                        disabled={deletingId === mem.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-black text-black hover:bg-[#FF0055] hover:text-white rounded-none transition-all shadow-[1px_1px_0px_#000000]"
                      >
                        {deletingId === mem.id
                          ? <span className="text-[10px] animate-pulse">ลบ...</span>
                          : <Trash2 size={13} className="stroke-[2.5]" />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-white">
                    <div className="text-[10px] font-heading font-black text-black mb-2 uppercase tracking-wider bg-surface-2 px-2 py-1 border border-black w-fit">{mem.context}</div>
                    <div className="text-xs md:text-sm text-black leading-relaxed whitespace-pre-wrap pl-3 border-l-3 border-black font-mono">
                      {mem.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {memories.length > 0 && (
          <p className="text-center text-xs font-heading font-bold text-black/60 mt-6 uppercase tracking-wider">
            {memories.length} MEMORIES RECORDED • HOVER A CARD TO DELETE
          </p>
        )}
      </div>
    </main>
  );
}

