"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/store/agentStore";
import { THEME_PRESETS } from "@/lib/theme";
import { processAndCompressImage } from "@/lib/imageUtils";
import { Key, PaintRoller, Users, Save, Check, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";

export default function SettingsPage() {
  const { agents, settings, updateSettings, updateAgent, hireAgent, fireAgent } = useAgentStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'ui'>('profile');
  
  const [openAIKey, setOpenAIKey] = useState(settings.openAIApiKey || "");
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || "");
  const [theme, setTheme] = useState(settings.theme || "dark");
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || "#000000");
  const [saved, setSaved] = useState(false);
  
  const [showHireForm, setShowHireForm] = useState(false);
  const [orBalance, setOrBalance] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await processAndCompressImage(file, 400, 400, 0.85);
        setLogoUrl(compressed);
        await updateSettings({ logoUrl: compressed });
        showSaved();
      } catch (err) {
        console.error("Failed to process logo image:", err);
      }
    }
  };

  useEffect(() => {
    setOpenAIKey(settings.openAIApiKey || "");
    setGeminiKey(settings.geminiApiKey || "");
    setTheme(settings.theme || "dark");
    setLogoUrl(settings.logoUrl || "");
    setPrimaryColor(settings.primaryColor || "#000000");
  }, [settings.openAIApiKey, settings.geminiApiKey, settings.theme, settings.logoUrl, settings.primaryColor]);

  useEffect(() => {
    if (openAIKey?.startsWith('sk-or-')) {
      fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${openAIKey}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.data?.limit != null && data?.data?.usage != null) {
            const limit = data.data.limit;
            const usage = data.data.usage;
            const remaining = (limit - usage).toFixed(4);
            setOrBalance(`OpenRouter Balance: $${remaining} remaining (Usage: $${usage.toFixed(4)})`);
          } else if (data?.data?.usage != null) {
            setOrBalance(`OpenRouter Usage: $${data.data.usage.toFixed(4)}`);
          } else {
            setOrBalance(null);
          }
        })
        .catch(() => setOrBalance(null));
    } else {
      setOrBalance(null);
    }
  }, [openAIKey]);

  const handleSaveApi = async () => {
    await updateSettings({ openAIApiKey: openAIKey, geminiApiKey: geminiKey });
    showSaved();
  };

  const handleSaveTheme = async () => {
    await updateSettings({ theme, logoUrl, primaryColor });
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black dark:border-border pb-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-tight text-black dark:text-foreground mb-1">Settings & Control</h1>
            <p className="text-xs md:text-sm font-bold text-black/70 dark:text-foreground/70 uppercase tracking-wider">Configure your AI team, API keys, and studio identity.</p>
          </div>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-xs font-heading font-black uppercase border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]">
              <Check size={16} className="stroke-[3]" /> Saved Successfully
            </motion.div>
          )}
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs */}
          <div className="w-full md:w-56 space-y-2 shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all text-xs font-heading font-black uppercase tracking-wider border-3 border-black dark:border-border ${activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] rotate-[-1deg]' : 'bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent hover:text-black shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]'}`}
            >
              <Users size={16} className="stroke-[2.5]" /> Team Profiles
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all text-xs font-heading font-black uppercase tracking-wider border-3 border-black dark:border-border ${activeTab === 'api' ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] rotate-[-1deg]' : 'bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent hover:text-black shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]'}`}
            >
              <Key size={16} className="stroke-[2.5]" /> API Keys
            </button>
            <button
              onClick={() => setActiveTab('ui')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all text-xs font-heading font-black uppercase tracking-wider border-3 border-black dark:border-border ${activeTab === 'ui' ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] rotate-[-1deg]' : 'bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent hover:text-black shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]'}`}
            >
              <PaintRoller size={16} className="stroke-[2.5]" /> Appearance
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-card border-4 border-black dark:border-border rounded-none p-6 md:p-8 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_var(--border)] min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-black dark:border-border pb-4">
                    <h3 className="font-heading font-black text-base uppercase text-black dark:text-foreground">Agent Profiles</h3>
                    <button 
                      onClick={() => setShowHireForm(!showHireForm)}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none text-xs font-heading font-black uppercase tracking-wider hover:opacity-90 border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      {showHireForm ? 'Cancel' : <><Plus size={14} className="stroke-[3]" /> Hire New Agent</>}
                    </button>
                  </div>
                  
                  {showHireForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                      <NewAgentForm 
                        onSave={(data) => {
                          hireAgent(data.name, data.role, data.department, data.description, data.responsibilities, data.imageUrl, 0x000000);
                          setShowHireForm(false);
                          showSaved();
                        }} 
                      />
                    </motion.div>
                  )}

                  <div className="space-y-6 mt-4">
                    {Object.values(agents).map(agent => (
                      <AgentProfileEditor 
                        key={agent.id} 
                        agent={agent} 
                        onSave={(id, updates) => { updateAgent(id, updates); showSaved(); }} 
                        onFire={(id) => { fireAgent(id); showSaved(); }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'api' && (
                <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="border-b-2 border-black dark:border-border pb-3">
                    <h3 className="font-heading font-black text-base uppercase text-black dark:text-foreground">LLM Model Integration</h3>
                    <p className="text-xs font-bold text-black/70 dark:text-foreground/70 mt-1 uppercase">Enter your API keys to connect the agents to real AI models.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider">OpenAI / OpenRouter API Key</label>
                        {orBalance && (
                          <span className="text-[10px] font-heading font-bold text-black bg-[#C7F9CC] px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000]">
                            {orBalance}
                          </span>
                        )}
                      </div>
                      <input 
                        type="password" 
                        value={openAIKey}
                        onChange={e => setOpenAIKey(e.target.value)}
                        placeholder="sk-... or sk-or-v1-..." 
                        className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border rounded-none px-4 py-2.5 text-xs md:text-sm font-medium focus:bg-white dark:focus:bg-surface-2 text-black dark:text-foreground focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider">Google Gemini API Key</label>
                        <a 
                          href="https://aistudio.google.com/app/plan_information" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-heading font-black text-black dark:text-foreground hover:text-[#FF0055] dark:hover:text-[#FF4D6D] underline uppercase tracking-wider transition-colors"
                        >
                          Google AI Studio ↗
                        </a>
                      </div>
                      <input 
                        type="password" 
                        value={geminiKey}
                        onChange={e => setGeminiKey(e.target.value)}
                        placeholder="AIza..." 
                        className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border rounded-none px-4 py-2.5 text-xs md:text-sm font-medium focus:bg-white dark:focus:bg-surface-2 text-black dark:text-foreground focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                      />
                    </div>
                  </div>

                  <button onClick={handleSaveApi} className="mt-6 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-none text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all">
                    <Save size={15} className="stroke-[2.5]" /> Save API Keys
                  </button>
                </motion.div>
              )}

              {activeTab === 'ui' && (
                <motion.div key="ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="border-b-2 border-black dark:border-border pb-3">
                    <h3 className="font-heading font-black text-base uppercase text-black dark:text-foreground">Appearance</h3>
                    <p className="text-xs font-bold text-black/70 dark:text-foreground/70 mt-1 uppercase">Adjust display and visual preferences.</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider mb-3">Studio Color Palette</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                      {THEME_PRESETS.map((preset) => {
                        const isSelected = (preset.id === 'noir' && theme === 'dark') || 
                                           (theme === 'light' && (primaryColor === preset.background || primaryColor === preset.accent || (primaryColor === '#000000' && preset.id === 'pink')));
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              if (preset.id === 'noir') {
                                setTheme('dark');
                                setPrimaryColor('#FFFFFF');
                                updateSettings({ theme: 'dark', primaryColor: '#FFFFFF' });
                              } else {
                                setTheme('light');
                                setPrimaryColor(preset.background);
                                updateSettings({ theme: 'light', primaryColor: preset.background });
                              }
                            }}
                            className={`p-3 rounded-none border-3 transition-all text-left flex flex-col justify-between ${
                              isSelected
                                ? 'border-black dark:border-border bg-primary text-primary-foreground shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] rotate-[-1deg]'
                                : 'border-black dark:border-border bg-white dark:bg-surface text-black dark:text-foreground hover:shadow-[3px_3px_0px_#000000] dark:hover:shadow-[3px_3px_0px_var(--border)]'
                            }`}
                          >
                            <div 
                              className="h-10 w-full mb-2 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_var(--border)] flex items-center justify-center text-sm"
                              style={{ backgroundColor: preset.background }}
                            >
                              <span>{preset.emoji}</span>
                            </div>
                            <span className="text-[11px] font-heading font-black uppercase tracking-tight">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-black dark:border-border">
                    <h4 className="font-heading font-black text-xs uppercase text-black dark:text-foreground mb-3">Custom Theme & Branding</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider mb-1.5">Workspace Logo / Profile Picture</label>
                        <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                        <div className="flex gap-3 items-center">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-none text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
                          >
                            <Upload size={14} className="stroke-[2.5]" /> Upload Image
                          </button>
                          <input 
                            type="text" 
                            value={logoUrl}
                            onChange={e => {
                              setLogoUrl(e.target.value);
                              updateSettings({ logoUrl: e.target.value });
                            }}
                            placeholder="https://... or paste image URL / upload file" 
                            className="flex-1 bg-surface-2 dark:bg-surface border-2 border-black dark:border-border rounded-none px-4 py-2.5 text-xs md:text-sm font-medium focus:bg-white dark:focus:bg-surface-2 text-black dark:text-foreground focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                          />
                          {logoUrl && (
                            <div className="w-10 h-10 rounded-none overflow-hidden border-2 border-black dark:border-border shrink-0 shadow-[1.5px_1.5px_0px_#000000]">
                              <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider mb-1.5">Custom Studio Tone Color (Hex)</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            value={primaryColor || "#FFCAD4"}
                            onChange={e => {
                              setTheme('light');
                              setPrimaryColor(e.target.value);
                              updateSettings({ theme: 'light', primaryColor: e.target.value });
                            }}
                            className="w-12 h-10 rounded-none cursor-pointer bg-white dark:bg-surface border-2 border-black dark:border-border p-1 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                          />
                          <input 
                            type="text" 
                            value={primaryColor}
                            onChange={e => {
                              setTheme('light');
                              setPrimaryColor(e.target.value);
                              updateSettings({ theme: 'light', primaryColor: e.target.value });
                            }}
                            placeholder="#FFCAD4" 
                            className="flex-1 bg-surface-2 dark:bg-surface border-2 border-black dark:border-border rounded-none px-4 py-2 text-xs md:text-sm font-medium focus:bg-white dark:focus:bg-surface-2 text-black dark:text-foreground focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                          />
                        </div>
                        <p className="text-[10px] font-bold text-black/60 dark:text-foreground/60 uppercase mt-1">
                          เลือกสีโทนที่คุณชอบ ระบบจะสร้างเฉดสีพื้นหลัง กรอบ และแอกเซนต์ที่แมตช์กันทั้งเว็บอัตโนมัติ
                        </p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSaveTheme} className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-none text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all">
                    <Save size={15} className="stroke-[2.5]" /> Save Appearance
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

function NewAgentForm({ onSave }: { onSave: (data: any) => void }) {
  const { skills } = useAgentStore();
  const [data, setData] = useState({
    name: '', role: '', department: 'MARKETING', imageUrl: '', description: '', responsibilities: '', skill_ids: [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await processAndCompressImage(file, 360, 360, 0.85);
        setData(prev => ({ ...prev, imageUrl: compressed }));
      } catch (err) {
        console.error("Failed to compress agent image:", err);
      }
    }
  };

  return (
    <div className="bg-surface-2 p-5 rounded-none border-3 border-black mb-6 space-y-4 shadow-[4px_4px_0px_#000000]">
      <h4 className="font-heading font-black text-sm uppercase text-black border-b-2 border-black pb-2">Recruit New AI Agent</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Display Name</label><input type="text" value={data.name} onChange={e=>setData({...data, name: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-2 text-xs font-medium text-black focus:outline-none" /></div>
        <div><label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Job Role</label><input type="text" placeholder="e.g. Content Marketer" value={data.role} onChange={e=>setData({...data, role: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-2 text-xs font-medium text-black focus:outline-none" /></div>
        <div><label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Department</label><input type="text" placeholder="e.g. MARKETING" value={data.department} onChange={e=>setData({...data, department: e.target.value.toUpperCase()})} className="w-full bg-white border-2 border-black rounded-none px-3 py-2 text-xs font-medium text-black focus:outline-none" /></div>
        <div>
          <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Avatar Image</label>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 flex-1 bg-white border-2 border-black rounded-none px-3 py-2 text-xs font-heading font-black uppercase text-black hover:bg-accent shadow-[1.5px_1.5px_0px_#000000] transition-colors"
            >
              <Upload size={14} className="stroke-[2.5]" /> {data.imageUrl ? 'Change Image' : 'Upload File'}
            </button>
            {data.imageUrl && (
               <div className="w-9 h-9 rounded-none overflow-hidden border-2 border-black shrink-0">
                 <img src={data.imageUrl} alt="" className="w-full h-full object-cover" />
               </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">System Prompt / Core Description</label>
        <textarea value={data.description} onChange={e=>setData({...data, description: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-2 text-xs font-medium text-black focus:outline-none h-20 resize-none" placeholder="You are an expert in..."></textarea>
      </div>
      <div>
        <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Responsibilities (comma separated)</label>
        <input type="text" value={data.responsibilities} onChange={e=>setData({...data, responsibilities: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-2 text-xs font-medium text-black focus:outline-none" placeholder="Write tweets, Analyze trends..." />
      </div>
      <div>
        <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Assigned Skills (SOPs)</label>
        {skills.length === 0 ? (
          <div className="text-xs font-bold text-black/60 bg-white p-2 border-2 border-black">No skills created yet. Go to the Skills page to create some.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <button 
                key={skill.id}
                onClick={() => {
                  if (data.skill_ids.includes(skill.id)) {
                    setData({...data, skill_ids: data.skill_ids.filter((id: string) => id !== skill.id)});
                  } else {
                    setData({...data, skill_ids: [...data.skill_ids, skill.id]});
                  }
                }}
                className={`text-[10px] font-heading font-black uppercase px-3 py-1 rounded-none border-2 border-black transition-colors ${data.skill_ids.includes(skill.id) ? 'bg-black text-white shadow-[2px_2px_0px_#000000]' : 'bg-white text-black hover:bg-accent'}`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button 
        disabled={!data.name || !data.department}
        onClick={() => onSave({ ...data, responsibilities: data.responsibilities.split(',').map((s: string)=>s.trim()).filter(Boolean), skill_ids: data.skill_ids })}
        className="w-full bg-black text-white font-heading font-black uppercase text-xs py-2.5 rounded-none border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-black/90 disabled:opacity-50"
      >
        Confirm Hiring
      </button>
    </div>
  );
}

function AgentProfileEditor({ agent, onSave, onFire }: { agent: any, onSave: (id: string, updates: any) => void, onFire: (id: string) => void }) {
  const { skills } = useAgentStore();
  const [data, setData] = useState({
    name: agent.name, imageUrl: agent.imageUrl || '', description: agent.description, 
    responsibilities: agent.responsibilities.join(', '), skill_ids: agent.skill_ids || [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await processAndCompressImage(file, 360, 360, 0.85);
        setData(prev => ({ ...prev, imageUrl: compressed }));
      } catch (err) {
        console.error("Failed to compress agent image:", err);
      }
    }
  };

  const isChanged = data.name !== agent.name || data.imageUrl !== (agent.imageUrl || '') || data.description !== agent.description || data.responsibilities !== agent.responsibilities.join(', ') || JSON.stringify(data.skill_ids) !== JSON.stringify(agent.skill_ids || []);

  const isCore = ['SUM', 'SATIN', 'SINCARE'].includes(agent.name?.trim().toUpperCase());

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-2 rounded-none border-3 border-black shadow-[3px_3px_0px_#000000]">
      <div className="flex items-start justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-none bg-white border-2 border-black overflow-hidden shrink-0 group cursor-pointer shadow-[1.5px_1.5px_0px_#000000]" onClick={() => fileInputRef.current?.click()}>
            {data.imageUrl ? <img src={data.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-heading font-black text-black text-lg">{data.name.charAt(0)}</div>}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={14} className="text-white stroke-[2.5]" />
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>
          <div>
            <div className="font-heading font-black text-sm uppercase text-black">{agent.name}</div>
            <div className="text-[10px] font-bold text-black/70 uppercase tracking-wider">{agent.department} • {agent.role}</div>
          </div>
        </div>
        {isCore ? (
          <span className="text-[9px] font-heading font-black uppercase px-2 py-0.5 bg-black text-white border border-black shadow-[1px_1px_0px_#000000]">
            #CORE
          </span>
        ) : (
          <button onClick={() => onFire(agent.id)} className="text-black hover:text-white hover:bg-[#FF0055] p-1.5 border border-black bg-white rounded-none transition-colors" title="Fire Agent">
            <Trash2 size={14} className="stroke-[2.5]" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
        <div className="col-span-full"><label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Display Name</label><input type="text" value={data.name} onChange={e=>setData({...data, name: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-1.5 text-xs text-black font-medium focus:outline-none" /></div>
      </div>
      <div>
        <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">System Prompt / Description</label>
        <textarea value={data.description} onChange={e=>setData({...data, description: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-1.5 text-xs text-black font-medium focus:outline-none h-16 resize-none" />
      </div>
      <div>
        <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Responsibilities (comma separated)</label>
        <input type="text" value={data.responsibilities} onChange={e=>setData({...data, responsibilities: e.target.value})} className="w-full bg-white border-2 border-black rounded-none px-3 py-1.5 text-xs text-black font-medium focus:outline-none" />
      </div>
      <div>
        <label className="block text-[10px] font-heading font-black uppercase text-black mb-1">Assigned Skills (SOPs)</label>
        {skills.length === 0 ? (
          <div className="text-xs font-bold text-black/60 bg-white p-2 border border-black">No skills created yet. Go to the Skills page to create some.</div>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {skills.map(skill => (
              <button 
                key={skill.id}
                onClick={() => {
                  if (data.skill_ids.includes(skill.id)) {
                    setData({...data, skill_ids: data.skill_ids.filter((id: string) => id !== skill.id)});
                  } else {
                    setData({...data, skill_ids: [...data.skill_ids, skill.id]});
                  }
                }}
                className={`text-[10px] font-heading font-black uppercase px-2.5 py-0.5 rounded-none border border-black transition-colors ${data.skill_ids.includes(skill.id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#FFCAD4]'}`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isChanged && (
        <button 
          onClick={() => onSave(agent.id, { ...data, responsibilities: data.responsibilities.split(',').map((s: string)=>s.trim()).filter(Boolean), skill_ids: data.skill_ids })}
          className="text-xs font-heading font-black uppercase bg-black text-white px-4 py-1.5 rounded-none border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-black/90 w-fit mt-1"
        >
          Save Changes
        </button>
      )}
    </div>
  );
}

