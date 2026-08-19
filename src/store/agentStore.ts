import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export type AgentState = 'idle' | 'thinking' | 'coding' | 'searching' | 'sleeping' | 'finished';

export interface Task {
  id: string;
  title: string;
  details?: string;
  tag?: string;
  completed: boolean;
  status: 'pending-review' | 'queued' | 'in-progress' | 'done';
  department: string;
  scheduledDate?: string;
  assigneeId?: string; 
  parentId?: string;
  subtaskIds?: string[]; // Note: we'll handle this in UI by filtering tasks by parentId
  feedback?: string;
  orderIndex?: number;
  isGenerating?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  department: string;
  description: string;
  responsibilities: string[];
  skill_ids?: string[];
  imageUrl: string;
  color: number;
  state: AgentState;
}

interface LogEntry {
  time: string;
  message: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  sop: string;
}

export interface Settings {
  openAIApiKey: string;
  geminiApiKey: string;
  theme: 'dark' | 'light';
  logoUrl?: string;
  primaryColor?: string;
}

interface AgentStore {
  initialized: boolean;
  isInitializing: boolean;
  pendingSync: boolean;
  agents: Record<string, Agent>;
  tasks: Task[];
  skills: Skill[];
  logs: LogEntry[];
  settings: Settings;
  
  initialize: (force?: boolean) => Promise<void>;
  hireAgent: (name: string, role: string, department: string, description: string, responsibilities: string[], imageUrl: string, color: number, skill_ids?: string[]) => Promise<void>;
  fireAgent: (id: string) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  createSkill: (name: string, description: string, sop: string) => Promise<void>;
  updateSkill: (id: string, updates: Partial<Skill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  setAgentState: (id: string, state: AgentState) => void;
  createTask: (title: string) => Promise<void>;
  moveTask: (id: string, newDepartment: string) => Promise<void>;
  delegateTaskByCEO: (title: string, details: string, tag: string, autoExecute: boolean) => Promise<void>;
  regenerateCEOPlan: (parentId: string) => Promise<void>;
  approveTaskPlan: (parentId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  processTask: (taskId: string) => Promise<void>;
  provideFeedback: (taskId: string, feedback: string) => Promise<void>;
  addLog: (message: string) => void;
}

const supabase = createClient();

const DEFAULT_SKILLS = [
  { tempId: 'ask-context', name: 'Ask Context', description: 'Ability to ask clarifying questions.', sop: 'Ask clarifying questions' },
  { tempId: 'planning', name: 'Planning', description: 'Ability to break down tasks.', sop: 'Break down tasks' },
  { tempId: 'documentation', name: 'Documentation', description: 'Ability to write documents.', sop: 'Write documents' },
  { tempId: 'communication', name: 'Communication', description: 'Ability to communicate.', sop: 'Communicate effectively' },
  { tempId: 'quality-control', name: 'Review', description: 'Ability to review output.', sop: 'Review output' },
  { tempId: 'delegation', name: 'Delegation', description: 'Ability to delegate work.', sop: 'Delegate work' },
  { tempId: 'consistency', name: 'Consistency', description: 'Ability to ensure consistency.', sop: 'Ensure consistency' },
  { tempId: 'memory', name: 'Memory', description: 'Ability to remember past interactions.', sop: 'Remember past interactions' }
];

const DEFAULT_AGENTS = [
  { 
    name: 'SUM', 
    role: 'CEO', 
    department: 'ORCHESTRATOR', 
    color: 0xf59e0b, 
    description: 'Visionary CEO & Strategic Sparring Partner. Debates big ideas, analyzes business goals, and delegates tasks.', 
    responsibilities: ['ถกไอเดียใหญ่และวางกลยุทธ์ร่วมกับผู้ใช้', 'วิเคราะห์งานและแบ่งงานให้แผนกต่างๆ', 'ควบคุมทิศทางภาพรวมของ SumStar OS'], 
    skill_temp_ids: [] 
  },
  { 
    name: 'SATIN', 
    role: 'HR', 
    department: 'HR', 
    color: 0xec4899, 
    description: 'Head of HR & Talent Recruitment. Solely responsible for creating, recruiting, and onboarding new AI agents.', 
    responsibilities: ['สรรหาและสร้าง Agent ใหม่เข้าสู่ระบบ (Recruitment)', 'กำหนดบทบาท หน้าที่ และ SOPs ประจำตำแหน่ง', 'ควบคุมคุณภาพและโครงสร้างทีม'], 
    skill_temp_ids: ['quality-control'] 
  },
  { 
    name: 'SINCARE', 
    role: 'Secretary', 
    department: 'SECRETARY', 
    color: 0x3b82f6, 
    description: 'Executive Secretary. Manages knowledge base, Central Memory, documentation, and scheduling.', 
    responsibilities: ['บันทึกและจัดการความทรงจำกลาง (Central Memory)', 'จัดเก็บเอกสารและสรุปรายงาน', 'สนับสนุนงานบริหาร'], 
    skill_temp_ids: ['memory'] 
  }
];

function getInitialSettings(): Settings {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('sumstar_settings');
      const backupLogo = localStorage.getItem('sumstar_custom_logo') || '';
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          openAIApiKey: parsed.openAIApiKey || '',
          geminiApiKey: parsed.geminiApiKey || '',
          theme: parsed.theme || 'dark',
          logoUrl: parsed.logoUrl || backupLogo || '',
          primaryColor: parsed.primaryColor || ''
        };
      } else if (backupLogo) {
        return {
          openAIApiKey: '',
          geminiApiKey: '',
          theme: 'dark',
          logoUrl: backupLogo,
          primaryColor: ''
        };
      }
    } catch {}
  }
  return {
    openAIApiKey: '',
    geminiApiKey: '',
    theme: 'dark',
    logoUrl: '',
    primaryColor: ''
  };
}

let realtimeSubscribed = false;

export const useAgentStore = create<AgentStore>((set, get) => ({
  initialized: false,
  isInitializing: false,
  pendingSync: false,
  agents: {},
  tasks: [],
  skills: [],
  logs: [],
  settings: getInitialSettings(),

  initialize: async (force?: boolean) => {
    const wasInitialized = get().initialized;
    if (get().isInitializing) {
      if (force) set({ pendingSync: true });
      return;
    }
    if (!force && wasInitialized) return;

    set({ isInitializing: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[AgentStore] Auth user:', user?.id ?? 'NO USER');
      if (!user) {
        set({ isInitializing: false });
        return;
      }

      // Fetch Settings
      let { data: settingsData } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
      
      // Fetch Skills
      let { data: skillsData, error: skillsError } = await supabase.from('skills').select('*');
      if (skillsError) { console.error('[AgentStore] Skills error:', skillsError); throw new Error(skillsError.message); }
      let skills = skillsData?.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        sop: s.sop
      })) || [];

      // Fetch Agents
      let { data: agentsData, error: agentsError } = await supabase.from('agents').select('*');
      console.log('[AgentStore] Agents fetched:', agentsData?.length ?? 0, 'agents', agentsError ? `ERROR: ${agentsError.message}` : 'OK');
      if (agentsError) { console.error('[AgentStore] Agents error:', agentsError); throw new Error(agentsError.message); }
      if (!agentsData) {
        agentsData = [];
      }

      if (agentsData.length === 0) {
        console.log('[AgentStore] No agents found, attempting auto-seed...');
        try {
          // Insert default skills first
          const skillsToInsert = DEFAULT_SKILLS.map(s => ({
            user_id: user.id,
            name: s.name,
            description: s.description,
            sop: s.sop
          }));
          const { data: insertedSkills, error: skillInsertError } = await supabase
            .from('skills').insert(skillsToInsert).select();
          if (skillInsertError) throw new Error(skillInsertError.message);

          // Build a map from tempId -> real UUID
          const skillIdMap: Record<string, string> = {};
          DEFAULT_SKILLS.forEach(ds => {
            const found = insertedSkills?.find(s => s.name === ds.name);
            if (found) skillIdMap[ds.tempId] = found.id;
          });

          // Insert default agents with resolved skill_ids
          const agentsToInsert = DEFAULT_AGENTS.map(a => ({
            user_id: user.id,
            name: a.name,
            role: a.role,
            department: a.department,
            color: a.color,
            description: a.description,
            responsibilities: a.responsibilities,
            skill_ids: a.skill_temp_ids.map(tid => skillIdMap[tid]).filter(Boolean),
            state: 'idle'
          }));
          const { error: agentInsertError } = await supabase
            .from('agents').insert(agentsToInsert);
          if (agentInsertError) throw new Error(agentInsertError.message);

          // Re-fetch after seeding
          const { data: refreshedSkills } = await supabase.from('skills').select('*');
          skillsData = refreshedSkills;
          skills = skillsData?.map(s => ({
            id: s.id, name: s.name, description: s.description, sop: s.sop
          })) || [];

          const { data: refreshedAgents } = await supabase.from('agents').select('*');
          agentsData = refreshedAgents || [];
        } catch (error) {
          console.error('Auto-seed failed:', error);
        }
      }

      // Ensure all 3 core agents (SUM, SATIN, SINCARE) exist
      const missingCoreAgents = DEFAULT_AGENTS.filter(
        da => !agentsData?.some(a => a.name.trim().toUpperCase() === da.name.toUpperCase())
      );

      if (missingCoreAgents.length > 0) {
        console.log(`[AgentStore] Restoring ${missingCoreAgents.length} missing core agent(s)...`);
        try {
          const agentsToInsert = missingCoreAgents.map(a => ({
            user_id: user.id,
            name: a.name,
            role: a.role,
            department: a.department,
            color: a.color,
            description: a.description,
            responsibilities: a.responsibilities,
            skill_ids: [],
            state: 'idle'
          }));
          await supabase.from('agents').insert(agentsToInsert);

          const { data: refreshedAgents } = await supabase.from('agents').select('*');
          if (refreshedAgents) agentsData = refreshedAgents;
        } catch (restoreErr) {
          console.error('[AgentStore] Failed to restore missing core agents:', restoreErr);
        }
      }

      const agentsMap: Record<string, Agent> = {};
      agentsData?.forEach(a => {
        agentsMap[a.id] = {
          id: a.id, name: a.name, role: a.role, department: a.department, color: a.color,
          state: a.state as AgentState, description: a.description || '', responsibilities: a.responsibilities || [], 
          skill_ids: a.skill_ids || [], imageUrl: a.image_url || ''
        };
      });

      // Fetch Tasks
      const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const tasksMap: Task[] = tasksData?.map(t => ({
        id: t.id, title: t.title, details: t.details || '', tag: t.tag || '',
        completed: t.status === 'done', status: t.status as 'pending-review'|'queued'|'in-progress'|'done',
        department: t.department || 'QUEUE',
        assigneeId: t.assignee || undefined, parentId: t.parent_id || undefined,
        feedback: t.feedback || undefined,
        orderIndex: t.order_index || 0
      })) || [];
      
      const localSettings = getInitialSettings();
      const backupLogo = (typeof window !== 'undefined' ? localStorage.getItem('sumstar_custom_logo') : null) || '';

      const mergedSettings: Settings = { 
        openAIApiKey: settingsData?.openai_api_key || localSettings.openAIApiKey || '', 
        geminiApiKey: settingsData?.gemini_api_key || localSettings.geminiApiKey || '', 
        theme: (settingsData?.theme as 'dark'|'light') || localSettings.theme || 'dark',
        logoUrl: settingsData?.logo_url || localSettings.logoUrl || backupLogo || '',
        primaryColor: settingsData?.primary_color || localSettings.primaryColor || ''
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sumstar_settings', JSON.stringify(mergedSettings));
          if (mergedSettings.logoUrl) {
            localStorage.setItem('sumstar_custom_logo', mergedSettings.logoUrl);
          }
        } catch {}
      }

      set({ 
        agents: agentsMap, 
        tasks: tasksMap, 
        skills: skills,
        settings: mergedSettings,
        initialized: true,
        isInitializing: false
      });

      // Realtime Sync
      if (!realtimeSubscribed) {
        realtimeSubscribed = true;
        try {
          supabase.channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
              get().initialize(true);
            })
            .subscribe();

          supabase.channel('public:agents')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, (payload) => {
              get().initialize(true);
            })
            .subscribe();
        } catch (subErr) {
          console.warn('[AgentStore] Realtime subscription notice:', subErr);
        }
      }
    } catch (e) {
      console.error('[AgentStore] Initialization error:', e);
      set({ isInitializing: false });
    }
  },

  hireAgent: async (name, role, department, description, responsibilities, imageUrl, color, skill_ids) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase.from('agents').insert({
      user_id: user.id,
      name,
      role,
      department,
      description,
      responsibilities,
      image_url: imageUrl,
      color,
      skill_ids: skill_ids || [],
      state: 'idle'
    }).select().single();

    if (error) {
      console.error('Failed to hire agent:', error);
      return;
    }

    if (data) {
      set(store => ({
        agents: {
          ...store.agents,
          [data.id]: {
            id: data.id,
            name: data.name,
            role: data.role,
            department: data.department,
            color: data.color,
            state: 'idle',
            description: data.description || '',
            responsibilities: data.responsibilities || [],
            skill_ids: data.skill_ids || [],
            imageUrl: data.image_url || ''
          }
        }
      }));
    }
  },

  fireAgent: async (id) => {
    const target = get().agents[id];
    if (target) {
      const coreNames = ['SUM', 'SATIN', 'SINCARE'];
      if (coreNames.includes(target.name.trim().toUpperCase())) {
        console.warn(`[AgentStore] Protected core agent cannot be deleted: ${target.name}`);
        return;
      }
    }
    await supabase.from('agents').delete().eq('id', id);
    set(store => {
      const newAgents = { ...store.agents };
      delete newAgents[id];
      return { agents: newAgents };
    });
    get().addLog(`[System] Terminated agent contract.`);
  },

  updateAgent: async (id, updates) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.responsibilities !== undefined) dbUpdates.responsibilities = updates.responsibilities;
    if (updates.skill_ids !== undefined) dbUpdates.skill_ids = updates.skill_ids;
    
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('agents').update(dbUpdates).eq('id', id);
    }
    
    set((store) => {
      if (!store.agents[id]) return store;
      return { agents: { ...store.agents, [id]: { ...store.agents[id], ...updates } } };
    });
  },

  updateSettings: async (updates) => {
    const current = get().settings;
    const newSettings: Settings = { ...current, ...updates };

    // 1. Immediately update store
    set({ settings: newSettings });

    // 2. Immediately save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sumstar_settings', JSON.stringify(newSettings));
        if (updates.logoUrl !== undefined) {
          if (updates.logoUrl) {
            localStorage.setItem('sumstar_custom_logo', updates.logoUrl);
          } else {
            localStorage.removeItem('sumstar_custom_logo');
          }
        }
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }

    // 3. Persist to Supabase user_settings if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUpdates: any = {};
        if (updates.openAIApiKey !== undefined) dbUpdates.openai_api_key = updates.openAIApiKey;
        if (updates.geminiApiKey !== undefined) dbUpdates.gemini_api_key = updates.geminiApiKey;
        if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
        if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
        
        await supabase.from('user_settings').upsert({ user_id: user.id, ...dbUpdates });
      }
    } catch (e) {
      console.warn('Could not sync user_settings to Supabase:', e);
    }
  },

  createSkill: async (name, description, sop) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('skills').insert({ user_id: user.id, name, description, sop }).select().single();
    if (!error && data) {
      set(state => ({ skills: [...state.skills, { id: data.id, name, description, sop }] }));
    }
  },

  updateSkill: async (id, updates) => {
    const { error } = await supabase.from('skills').update(updates).eq('id', id);
    if (!error) {
      set(state => ({ skills: state.skills.map(s => s.id === id ? { ...s, ...updates } : s) }));
    }
  },

  deleteSkill: async (id) => {
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (!error) {
      set(state => ({ skills: state.skills.filter(s => s.id !== id) }));
    }
  },

  setAgentState: (id, state) => set((store) => ({ 
    agents: { ...store.agents, [id]: { ...store.agents[id], state } }
  })),

  createTask: async (title) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('tasks').insert({ user_id: user?.id, title, status: 'queued' }).select().single();
    if (!data) return;

    const newTask: Task = { id: data.id, title, completed: false, status: 'queued', department: 'QUEUE' };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    get().addLog(`[System] New task created: ${title}`);
  },

  moveTask: async (id, newDepartment) => {
    let newStatus = 'in-progress';
    let assigneeId: string | undefined = undefined;

    const state = get();
    if (newDepartment === 'DONE') { newStatus = 'done'; assigneeId = undefined; }
    else if (newDepartment === 'QUEUE') { newStatus = 'queued'; assigneeId = undefined; }
    else {
      newStatus = 'in-progress';
      const deptAgents = Object.values(state.agents).filter(a => a.department === newDepartment);
      if (deptAgents.length > 0) assigneeId = deptAgents[0].id;
    }

    await supabase.from('tasks').update({ 
      department: newDepartment, 
      status: newStatus, 
      assignee: assigneeId || null 
    }).eq('id', id);

    set((state) => {
      const updatedTasks = state.tasks.map(t => {
        if (t.id !== id) return t;
        return { ...t, department: newDepartment, status: newStatus as any, assigneeId };
      });
      return { tasks: updatedTasks };
    });
    get().addLog(`[System] Task moved to ${newDepartment}`);
  },

  delegateTaskByCEO: async (title, details, tag, autoExecute) => {
    const initialStatus = autoExecute ? 'queued' : 'pending-review';
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert Parent Task
    const { data: parentData, error: parentError } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      details,
      tag,
      status: initialStatus,
      department: 'ORCHESTRATOR'
    }).select().single();

    if (parentError || !parentData) {
      get().addLog(`[CEO] ❌ DB Error: ${parentError?.message}`);
      return;
    }

    const parentTask: Task = {
      id: parentData.id, title, details, tag, completed: false, status: initialStatus as any, department: 'ORCHESTRATOR', isGenerating: true
    };

    // Optimistically show parent task
    set((state) => ({ tasks: [parentTask, ...state.tasks] }));
    get().addLog(`[CEO] Analyzing mission: ${title} ... (Thinking)`);

    try {
      const res = await fetch('/api/ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: title, taskDetails: details })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Prepare subtasks for DB
      const subtasksToInsert = (data.subtasks || []).map((st: any, index: number) => ({
        user_id: user.id,
        title: st.title,
        details: `Part of ${title}`,
        status: initialStatus,
        department: st.department || 'QUEUE',
        parent_id: parentData.id,
        assignee: st.assigneeId || null,
        order_index: index
      }));

      const { data: insertedSubtasks, error: subError } = await supabase.from('tasks').insert(subtasksToInsert).select();
      
      if (subError) throw new Error(subError.message);

      const subtasks: Task[] = (insertedSubtasks || []).map(t => ({
        id: t.id,
        title: t.title,
        details: t.details || '',
        completed: false,
        status: t.status as any,
        department: t.department || 'QUEUE',
        parentId: t.parent_id,
        assigneeId: t.assignee || undefined,
        orderIndex: t.order_index || 0
      }));

      set((state) => ({ 
        tasks: [
          ...subtasks, 
          ...state.tasks.map(t => t.id === parentData.id ? { ...t, isGenerating: false } : t)
        ] 
      }));
      get().addLog(`[CEO] Mission breakdown complete. Generated ${subtasks.length} subtasks.`);
      
      // Auto-Execute (Sequential: Start the first one)
      if (autoExecute) {
        const firstSubtask = subtasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0];
        if (firstSubtask) {
          get().processTask(firstSubtask.id);
        }
      }

    } catch (e: any) {
      get().addLog(`[CEO] ❌ Error: ${e.message}`);
      set((state) => ({ tasks: state.tasks.map(t => t.id === parentData.id ? { ...t, isGenerating: false } : t) }));
    }
  },

  regenerateCEOPlan: async (parentId) => {
    const parentTask = get().tasks.find(t => t.id === parentId);
    if (!parentTask) return;
    
    get().addLog(`[CEO] Retrying mission breakdown: ${parentTask.title} ... (Thinking)`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Set generating state
      set((state) => ({ tasks: state.tasks.map(t => t.id === parentTask.id ? { ...t, isGenerating: true } : t) }));

      // Delete existing subtasks first to avoid duplicates
      await supabase.from('tasks').delete().eq('parent_id', parentTask.id);
      set((state) => ({ tasks: state.tasks.filter(t => t.parentId !== parentTask.id) }));

      const res = await fetch('/api/ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: parentTask.title, taskDetails: parentTask.details })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Prepare subtasks for DB
      const subtasksToInsert = (data.subtasks || []).map((st: any, index: number) => ({
        user_id: user.id,
        title: st.title,
        details: `Part of ${parentTask.title}`,
        status: parentTask.status, // use existing parent status
        department: st.department || 'QUEUE',
        parent_id: parentTask.id,
        assignee: st.assigneeId || null,
        order_index: index
      }));

      const { data: insertedSubtasks, error: subError } = await supabase.from('tasks').insert(subtasksToInsert).select();
      
      if (subError) throw new Error(subError.message);

      const subtasks: Task[] = (insertedSubtasks || []).map(t => ({
        id: t.id,
        title: t.title,
        details: t.details || '',
        completed: false,
        status: t.status as any,
        department: t.department || 'QUEUE',
        parentId: t.parent_id,
        assigneeId: t.assignee || undefined,
        orderIndex: t.order_index || 0
      }));

      set((state) => ({ 
        tasks: [
          ...subtasks, 
          ...state.tasks.map(t => t.id === parentTask.id ? { ...t, isGenerating: false } : t)
        ] 
      }));
      get().addLog(`[CEO] Mission breakdown complete. Generated ${subtasks.length} subtasks.`);
      
      // Auto-Execute if parent was queued
      if (parentTask.status === 'queued') {
        const firstSubtask = subtasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0];
        if (firstSubtask) {
          get().processTask(firstSubtask.id);
        }
      }

    } catch (e: any) {
      get().addLog(`[CEO] ❌ Retry Error: ${e.message}`);
      set((state) => ({ tasks: state.tasks.map(t => t.id === parentTask.id ? { ...t, isGenerating: false } : t) }));
    }
  },

  approveTaskPlan: async (parentId) => {
    await supabase.from('tasks').update({ status: 'in-progress' }).eq('id', parentId);
    await supabase.from('tasks').update({ status: 'queued' }).eq('parent_id', parentId);

    set((state) => {
      const updatedTasks = state.tasks.map(t => {
        if (t.id === parentId) return { ...t, status: 'in-progress' as const };
        if (t.parentId === parentId) return { ...t, status: 'queued' as const };
        return t;
      });
      return { tasks: updatedTasks };
    });
    get().addLog(`[CEO] Mission approved. Subtasks dispatched.`);

    // Sequential: Start executing the FIRST queued subtask
    const firstSubtask = get().tasks
      .filter(t => t.parentId === parentId && t.status === 'queued')
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0];
      
    if (firstSubtask) {
      get().processTask(firstSubtask.id);
    }
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id); // will cascade to parent_id
    set((state) => {
      const idsToDelete = new Set([id]);
      state.tasks.filter(t => t.parentId === id).forEach(t => idsToDelete.add(t.id));
      return { tasks: state.tasks.filter(t => !idsToDelete.has(t.id)) };
    });
  },

  processTask: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    // Auto-assign: if no assignee but has a department, find first agent in that dept
    let assigneeId = task.assigneeId;
    if (!assigneeId && task.department && task.department !== 'QUEUE' && task.department !== 'DONE' && task.department !== 'ORCHESTRATOR') {
      const deptAgent = Object.values(get().agents).find(a => a.department === task.department);
      if (deptAgent) {
        assigneeId = deptAgent.id;
        // Save assignee to DB
        await supabase.from('tasks').update({ assignee: deptAgent.id }).eq('id', taskId);
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, assigneeId: deptAgent.id } : t)
        }));
      }
    }

    if (!assigneeId) {
      get().addLog(`[System] ⚠️ No agent found for department '${task.department}'. Please hire an agent for this department.`);
      throw new Error(`No agent found for department: ${task.department}`);
    }

    const agent = get().agents[assigneeId];
    if (!agent) return;

    // Set state to working
    set((state) => ({
      agents: { ...state.agents, [agent.id]: { ...state.agents[agent.id], state: 'thinking' } },
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'in-progress' } : t)
    }));

    get().addLog(`[${agent.name}] 🏃 เริ่มทำงาน: ${task.title}`);

    // Gather context from previously completed sibling tasks (Sequential Collaboration)
    let previousTasksContext = "";
    if (task.parentId) {
      const completedSiblings = get().tasks
        .filter(t => t.parentId === task.parentId && t.status === 'done' && (t.orderIndex || 0) < (task.orderIndex || 0))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      
      if (completedSiblings.length > 0) {
        previousTasksContext = completedSiblings.map(t => `[Task: ${t.title}]\n${t.details}`).join('\n\n---\n\n');
      }
    }

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskTitle: task.title, 
          agentId: agent.id,
          previousDetails: task.details,
          feedback: task.feedback,
          previousTasksContext: previousTasksContext
        })
      });
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      // Save to DB
      await supabase.from('tasks').update({ 
        status: 'done', 
        department: 'DONE', 
        details: data.result,
        feedback: null
      }).eq('id', taskId);

      // Update task with result in details, set to done, move to DONE column in memory
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: true, status: 'done', department: 'DONE', details: data.result, feedback: undefined } : t),
        agents: { ...state.agents, [agent.id]: { ...state.agents[agent.id], state: 'finished' } }
      }));

      get().addLog(`[${agent.name}] 💡 งานเสร็จแล้ว!`);

      // Check for next sequential task
      if (task?.parentId) {
        const parentId = task.parentId;
        
        // Find next queued sibling task based on orderIndex
        const nextSibling = get().tasks
          .filter(t => t.parentId === parentId && t.status === 'queued')
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0];

        if (nextSibling) {
          get().addLog(`[System] Sending output to next agent: ${nextSibling.title}`);
          get().processTask(nextSibling.id);
        } else {
          // If no next sibling, check if ALL siblings are done
          const siblings = get().tasks.filter(t => t.parentId === parentId);
          if (siblings.every(t => t.status === 'done')) {
            await supabase.from('tasks').update({ status: 'done', department: 'DONE' }).eq('id', parentId);
            set((state) => ({
              tasks: state.tasks.map(t => t.id === parentId ? { ...t, completed: true, status: 'done', department: 'DONE' } : t)
            }));
            get().addLog(`[System] 🎉 Mission complete: Project done.`);
          }
        }
      }

      setTimeout(() => {
        set((state) => ({ agents: { ...state.agents, [agent.id]: { ...state.agents[agent.id], state: 'idle' } } }));
      }, 5000);

    } catch (error: any) {
      console.error(error);
      get().addLog(`[System] ❌ Error processing task: ${error.message || 'Unknown error'}`);
      
      // Update DB to reset status
      await supabase.from('tasks').update({ status: 'queued' }).eq('id', taskId);

      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'queued' } : t),
        agents: { ...state.agents, [agent.id]: { ...state.agents[agent.id], state: 'idle' } }
      }));
    }
  },

  provideFeedback: async (taskId, feedback) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    // Get the agent who originally did the task
    const assigneeId = task.assigneeId;
    let originalDepartment = task.department;

    if (assigneeId) {
      const agent = get().agents[assigneeId];
      if (agent) originalDepartment = agent.department;
    }

    // Update DB
    await supabase.from('tasks').update({
      status: 'queued',
      department: originalDepartment,
      feedback: feedback
    }).eq('id', taskId);

    // Update local state and trigger processTask again
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { 
        ...t, 
        status: 'queued', 
        department: originalDepartment, 
        feedback: feedback,
        completed: false
      } : t)
    }));

    get().addLog(`[System] Feedback sent for task: ${task.title}. Agent will re-process it.`);
    get().processTask(taskId);
  },
  
  addLog: (message) => set((state) => ({
    logs: [{ time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), message }, ...state.logs].slice(0, 50)
  }))
}));
