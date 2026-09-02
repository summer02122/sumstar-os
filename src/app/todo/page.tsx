"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, 
  Calendar, Flag, Tag, Clock, ArrowRight, ArrowLeft,
  Search, Check, Bot, AlertCircle, RefreshCw,
  Layers, BookmarkCheck, ChevronDown, ListTodo, X,
  StickyNote, Pin, Edit3, FileText, CheckSquare
} from "lucide-react";
import Swal from "sweetalert2";

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
  dueDate: string | null;
  notes?: string;
  createdAt: number;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  color: "yellow" | "pink" | "green" | "blue" | "purple" | "white";
  category?: string;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY_TODOS = "sumstar_todos_v1";
const STORAGE_KEY_NOTES = "sumstar_notes_v1";

const INITIAL_TODOS: TodoItem[] = [];

const INITIAL_NOTES: QuickNote[] = [];

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: "bg-[#FFF3B0] dark:bg-[#4A4020]", border: "border-black dark:border-amber-400/40", text: "text-black dark:text-amber-100" },
  pink: { bg: "bg-[#FFCAD4] dark:bg-[#4A202A]", border: "border-black dark:border-rose-400/40", text: "text-black dark:text-rose-100" },
  green: { bg: "bg-[#C7F9CC] dark:bg-[#1C402E]", border: "border-black dark:border-emerald-400/40", text: "text-black dark:text-emerald-100" },
  blue: { bg: "bg-[#BEE1E6] dark:bg-[#1E3545]", border: "border-black dark:border-sky-400/40", text: "text-black dark:text-sky-100" },
  purple: { bg: "bg-[#E2D4F0] dark:bg-[#382647]", border: "border-black dark:border-purple-400/40", text: "text-black dark:text-purple-100" },
  white: { bg: "bg-white dark:bg-card", border: "border-black dark:border-border", text: "text-black dark:text-foreground" }
};

export default function TodoPage() {
  const [activeTab, setActiveTab] = useState<"todos" | "notes">("todos");

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "high" | "today" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [noteFilterCategory, setNoteFilterCategory] = useState("all");
  const [isNoteCategoryDropdownOpen, setIsNoteCategoryDropdownOpen] = useState(false);

  // SINCARE Assistant States
  const [nlInput, setNlInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  // Manual Add Task Modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPriority, setManualPriority] = useState<"high" | "medium" | "low">("medium");
  const [manualCategory, setManualCategory] = useState("WORK");
  const [manualDueDate, setManualDueDate] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState<QuickNote["color"]>("yellow");
  const [noteCategory, setNoteCategory] = useState("");

  // Load from Supabase instead of localStorage
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const supabase = createClient();
        
        // Fetch Todos
        const { data: todosData, error: tErr } = await supabase
          .from("todos")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (!tErr && todosData) {
          const parsedTodos: TodoItem[] = todosData.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            priority: t.priority as any,
            category: t.category,
            dueDate: t.due_date,
            notes: t.notes || "",
            createdAt: new Date(t.created_at).getTime()
          }));
          if (mounted) setTodos(parsedTodos);
        } else {
          if (mounted) setTodos(INITIAL_TODOS);
        }

        // Fetch Notes
        const { data: notesData, error: nErr } = await supabase
          .from("notes")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (!nErr && notesData) {
          const parsedNotes: QuickNote[] = notesData.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            color: n.color as any,
            category: n.category,
            isPinned: n.is_pinned,
            createdAt: new Date(n.created_at).getTime(),
            updatedAt: new Date(n.updated_at).getTime()
          }));
          if (mounted) setNotes(parsedNotes);
        } else {
          if (mounted) setNotes(INITIAL_NOTES);
        }

        if (mounted) setIsLoaded(true);

      } catch (e) {
        console.error("Failed to load from Supabase:", e);
        if (mounted) {
          setTodos(INITIAL_TODOS);
          setNotes(INITIAL_NOTES);
          setIsLoaded(true);
        }
      }
    }
    
    loadData();
    
    return () => { mounted = false; };
  }, []);

  // Now we update state immediately for UI, and then sync to Supabase in background
  const addTodosToDb = async (newTodos: TodoItem[]) => {
    // Optimistically update UI
    setTodos(prev => [...newTodos, ...prev]);
    
    // Insert into DB
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const inserts = newTodos.map(t => ({
      user_id: user.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      category: t.category,
      due_date: t.dueDate,
      notes: t.notes
    }));
    
    const { data } = await supabase.from("todos").insert(inserts).select();
    if (data) {
      // Replace temporary IDs with real UUIDs from DB
      setTodos(prev => {
        const next = [...prev];
        data.forEach((dbTodo, i) => {
          const matchIndex = next.findIndex(t => t.title === dbTodo.title && t.id.startsWith("todo-"));
          if (matchIndex >= 0) {
            next[matchIndex] = { ...next[matchIndex], id: dbTodo.id, createdAt: new Date(dbTodo.created_at).getTime() };
          }
        });
        return next;
      });
    }
  };
  
  const toggleTodo = async (id: string) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;
    
    const newCompleted = !target.completed;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    
    // Attempt DB Update if it's a UUID (not mock data)
    if (id.includes("-") && id.length > 10) {
      const supabase = createClient();
      await supabase.from("todos").update({ completed: newCompleted }).eq("id", id);
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (id.includes("-") && id.length > 10) {
      const supabase = createClient();
      await supabase.from("todos").delete().eq("id", id);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (id.includes("-") && id.length > 10) {
      const supabase = createClient();
      await supabase.from("notes").delete().eq("id", id);
    }
  };

  const toggleNotePin = async (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    
    const newPinned = !target.isPinned;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: newPinned } : n));
    
    if (id.includes("-") && id.length > 10) {
      const supabase = createClient();
      await supabase.from("notes").update({ is_pinned: newPinned }).eq("id", id);
    }
  };

  const openNoteModal = (note?: QuickNote) => {
    if (note) {
      setEditingNoteId(note.id);
      setNoteTitle(note.title);
      setNoteContent(note.content);
      setNoteColor(note.color);
      setNoteCategory(note.category || "");
    } else {
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteContent("");
      setNoteColor("yellow");
      setNoteCategory("");
    }
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (editingNoteId) {
      // Optimistic UI update
      const updatedTitle = noteTitle.trim() || "Untitled Note";
      const updatedContent = noteContent.trim();
      const updatedCategory = noteCategory.trim();
      
      setNotes(prev => prev.map(n => n.id === editingNoteId ? {
        ...n, title: updatedTitle, content: updatedContent, color: noteColor, category: updatedCategory, updatedAt: Date.now()
      } : n));
      setShowNoteModal(false);

      if (editingNoteId.includes("-") && editingNoteId.length > 10) {
        await supabase.from("notes").update({
          title: updatedTitle,
          content: updatedContent,
          color: noteColor,
          category: updatedCategory,
          updated_at: new Date().toISOString()
        }).eq("id", editingNoteId);
      }
    } else {
      // Create new
      setShowNoteModal(false);
      
      if (user) {
        const { data: newDbNote } = await supabase.from("notes").insert({
          user_id: user.id,
          title: noteTitle.trim() || "Untitled Note",
          content: noteContent.trim(),
          color: noteColor,
          category: noteCategory.trim(),
          is_pinned: false
        }).select().single();
        
        if (newDbNote) {
          const freshNote: QuickNote = {
            id: newDbNote.id,
            title: newDbNote.title,
            content: newDbNote.content,
            color: newDbNote.color as any,
            category: newDbNote.category,
            isPinned: newDbNote.is_pinned,
            createdAt: new Date(newDbNote.created_at).getTime(),
            updatedAt: new Date(newDbNote.updated_at).getTime()
          };
          setNotes(prev => [freshNote, ...prev]);
        }
      }
    }
  };

  // AI: Convert Note to Tasks via SINCARE
  const handleNoteToTasks = async (note: QuickNote) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note_to_tasks",
          input: {
            title: note.title,
            content: note.content
          }
        })
      });

      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        const generatedTodos: TodoItem[] = data.result.map((item: any, idx: number) => ({
          id: `todo-${Date.now()}-${idx}`,
          title: item.title,
          completed: false,
          priority: item.priority || "medium",
          category: item.category || "WORK",
          dueDate: item.dueDate || null,
          notes: item.notes || `แปลงมาจากโน้ต: "${note.title}"`,
          createdAt: Date.now() + idx
        }));

        addTodosToDb(generatedTodos);
        setActiveTab("todos");

        Swal.fire({
          icon: "success",
          title: "SINCARE แปลงโน้ตเป็นงานสำเร็จ!",
          text: `สร้าง To-Do ใหม่ให้แล้ว ${generatedTodos.length} รายการค่ะ`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถแปลงโน้ตได้"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI: Archive Note to Central Memory
  const handleArchiveNoteToMemory = async (note: QuickNote) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive_to_memory",
          todos: [{
            title: note.title,
            notes: note.content,
            completed: true
          }]
        })
      });

      const data = await res.json();
      if (data.result) {
        Swal.fire({
          icon: "success",
          title: "SINCARE บันทึกโน้ตลง Memory แล้วค่ะ!",
          text: "ข้อมูลนี้ถูกจัดเก็บเข้าสู่ Central Memory เรียบร้อยแล้ว",
          confirmButtonColor: "#000000"
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถบันทึกลง Memory ได้"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Smart Chat (NLP for Todos & Notes)
  const handleAiParse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlInput.trim()) return;

    setIsAiLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "smart_chat",
          input: nlInput.trim(),
          todos: todos,
          notes: notes
        })
      });

      const data = await res.json();
      if (data.result) {
        const { type, reply, todoData, noteData } = data.result;

        if (type === "ADD_TODO" && todoData) {
          const newTodo: TodoItem = {
            id: `todo-${Date.now()}`,
            title: todoData.title || nlInput.trim(),
            completed: false,
            priority: todoData.priority || "medium",
            category: (todoData.category || "WORK").toUpperCase(),
            dueDate: todoData.dueDate || null,
            notes: todoData.notes || "",
            createdAt: Date.now()
          };
          addTodosToDb([newTodo]);
          setActiveTab("todos");
        } else if (type === "ADD_NOTE" && noteData) {
          // Manually construct the NoteItem and use the supabase flow
          const newNote: QuickNote = {
             id: `note-${Date.now()}`, // Temporary ID
             title: noteData.title || "Untitled",
             content: noteData.content || "",
             color: noteData.color || "yellow",
             category: noteData.category || "General",
             isPinned: false,
             createdAt: Date.now(),
             updatedAt: Date.now()
          };
          
          // Save note to DB directly since addNotesToDb doesn't exist
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: newDbNote } = await supabase.from("notes").insert({
              user_id: user.id,
              title: newNote.title,
              content: newNote.content,
              color: newNote.color,
              category: newNote.category,
              is_pinned: false
            }).select().single();
            
            if (newDbNote) {
              newNote.id = newDbNote.id;
              setNotes(prev => [newNote, ...prev]);
            }
          }
          setActiveTab("notes");
        } else if (type === "DELETE_NOTE" && data.result.deleteTargetId) {
          const noteId = data.result.deleteTargetId;
          deleteNote(noteId);
          setActiveTab("notes");
        } else if (type === "DELETE_TODO" && data.result.deleteTargetId) {
          const todoId = data.result.deleteTargetId;
          deleteTodo(todoId);
        }

        // Show SINCARE's response to the user
        Swal.fire({
          title: "SINCARE ตอบกลับ",
          text: reply || "เรียบร้อยค่ะ",
          confirmButtonColor: "#000000",
          confirmButtonText: "รับทราบ"
        });

        setNlInput("");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถติดต่อ SINCARE ได้ในขณะนี้"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Task Breakdown via SINCARE
  const handleAiBreakdown = async (task: TodoItem) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "breakdown",
          task: task
        })
      });

      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        const subtasks: TodoItem[] = data.result.map((st: any, idx: number) => ({
          id: `todo-${Date.now()}-${idx}`,
          title: st.title,
          completed: false,
          priority: st.priority || task.priority,
          category: st.category || task.category,
          dueDate: task.dueDate,
          notes: `แตกงานย่อยมาจาก: "${task.title}"`,
          createdAt: Date.now() + idx
        }));

        addTodosToDb(subtasks);

        Swal.fire({
          icon: "success",
          title: "SINCARE แตกงานย่อยสำเร็จ!",
          text: `เพิ่มงานย่อย ${subtasks.length} รายการลงใน To-Do List แล้วค่ะ`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถแตกงานได้"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Daily Briefing
  const handleDailyBriefing = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "daily_briefing",
          todos: todos.filter(t => !t.completed)
        })
      });

      const data = await res.json();
      if (data.result) {
        setBriefing(data.result);
        setShowBriefingModal(true);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถดึงข้อมูลสรุปได้"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Archive Completed to Central Memory
  const handleArchiveToMemory = async () => {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) {
      Swal.fire({
        icon: "info",
        title: "ยังไม่มีงานที่ทำเสร็จ",
        text: "ทำเครื่องหมายถูกที่งานที่เสร็จแล้วก่อนนะคะ"
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch("/api/sincare/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive_to_memory",
          todos: todos
        })
      });

      const data = await res.json();
      if (data.result) {
        Swal.fire({
          icon: "success",
          title: "SINCARE บันทึกความจำแล้ว!",
          text: data.result,
          confirmButtonColor: "#000000"
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถบันทึกความจำได้"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Manual Add Task Submit
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title: manualTitle.trim(),
      completed: false,
      priority: manualPriority,
      category: manualCategory.trim().toUpperCase() || "WORK",
      dueDate: manualDueDate || null,
      notes: manualNotes.trim() || undefined,
      createdAt: Date.now()
    };

    addTodosToDb([newTodo]);
    setManualTitle("");
    setManualNotes("");
    setManualDueDate("");
    setShowAddTaskModal(false);
  };

  // Filtered Todos
  const todayStr = new Date().toISOString().split("T")[0];
  const filteredTodos = todos.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "high") return t.priority === "high" && !t.completed;
    if (filter === "today") return t.dueDate === todayStr;
    return true;
  });

  // Filtered Notes (Sorted: Pinned first)
  const filteredNotes = notes
    .filter(n => {
      const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = noteFilterCategory === "all" || n.category === noteFilterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const noteCategories = Array.from(new Set(notes.map(n => n.category).filter(Boolean))) as string[];

  const totalCount = todos.length;
  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;
  const highPriorityCount = todos.filter(t => t.priority === "high" && !t.completed).length;

  if (!isLoaded) return null;

  return (
    <main className="flex-1 overflow-y-auto bg-background p-3 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 mt-12 md:mt-0">

        {/* Header */}
        <header className="border-b-4 border-black dark:border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary text-primary-foreground text-[10px] font-heading font-black px-2 py-0.5 border border-black shadow-[1.5px_1.5px_0px_#000000]">
                SINCARE EXECUTIVE ASSISTANT
              </span>
            </div>
            <h1 className="text-2xl md:text-5xl font-heading font-black uppercase tracking-tight text-black dark:text-foreground">
              To-Do & Scratchpad
            </h1>
            <p className="text-[10px] md:text-sm font-bold text-black/70 dark:text-foreground/70 uppercase tracking-wider mt-0.5 md:mt-1">
              ระบบจัดการงาน ตารางเวลา และสมุดบันทึกด่วน โดยมีเลขา SINCARE ช่วยดูแล
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDailyBriefing}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 bg-white dark:bg-card text-black dark:text-foreground px-2.5 md:px-3.5 py-1.5 md:py-2 text-[10px] md:text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2.5px_2.5px_0px_var(--border)] hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              <Sparkles size={12} className="stroke-[2.5] text-amber-500 md:w-3.5 md:h-3.5" />
              <span>Briefing</span>
            </button>
            <button
              onClick={handleArchiveToMemory}
              disabled={isAiLoading || completedCount === 0}
              className="flex items-center gap-1.5 bg-white dark:bg-card text-black dark:text-foreground px-2.5 md:px-3.5 py-1.5 md:py-2 text-[10px] md:text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2.5px_2.5px_0px_var(--border)] hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
              title="สรุปงานที่ทำเสร็จแล้วลงใน Central Memory"
            >
              <BookmarkCheck size={12} className="stroke-[2.5] text-emerald-600 md:w-3.5 md:h-3.5" />
              <span>Archive</span>
            </button>

            {activeTab === "todos" ? (
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2.5px_2.5px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Plus size={12} className="stroke-[3] md:w-3.5 md:h-3.5" />
                <span>Task</span>
              </button>
            ) : (
              <button
                onClick={() => openNoteModal()}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2.5px_2.5px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Plus size={12} className="stroke-[3] md:w-3.5 md:h-3.5" />
                <span>Note</span>
              </button>
            )}
          </div>
        </header>

        {/* SINCARE Natural Language Smart Input Bar */}
        <section className="bg-white dark:bg-card border-3 md:border-4 border-black dark:border-border p-3 md:p-4 shadow-[4px_4px_0px_#000000] md:shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-none bg-primary text-primary-foreground border border-black flex items-center justify-center text-[10px] md:text-xs font-black">
              📑
            </div>
            <span className="font-heading font-black text-[10px] md:text-xs uppercase text-black dark:text-foreground">
              สั่งงานเลขา SINCARE ด้วยภาษาพูด (AI Input)
            </span>
          </div>

          <form onSubmit={handleAiParse} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder="เช่น 'พรุ่งนี้บ่าย 2 โทรหาลูกค้า'"
              className="flex-1 bg-surface-2 dark:bg-surface border-2 border-black dark:border-border px-3 md:px-3.5 py-2 md:py-2.5 text-[10px] md:text-sm font-medium text-black dark:text-foreground focus:bg-white dark:focus:bg-surface-2 focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
            />
            <button
              type="submit"
              disabled={isAiLoading || !nlInput.trim()}
              className="flex items-center justify-center gap-1.5 md:gap-2 bg-primary text-primary-foreground px-4 md:px-5 py-2 md:py-2.5 rounded-none text-[10px] md:text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50 shrink-0"
            >
              {isAiLoading ? (
                <RefreshCw size={12} className="animate-spin md:w-3.5 md:h-3.5" />
              ) : (
                <Sparkles size={12} className="stroke-[2.5] md:w-3.5 md:h-3.5" />
              )}
              <span>SINCARE จัดให้</span>
            </button>
          </form>
        </section>

        {/* View Mode Switcher (To-Do vs Notes) */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex bg-white dark:bg-card p-1 border-3 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)]">
            <button
              onClick={() => setActiveTab("todos")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-heading font-black uppercase tracking-wider transition-all ${
                activeTab === "todos"
                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                  : "text-black dark:text-foreground hover:bg-accent"
              }`}
            >
              <CheckSquare size={14} className="stroke-[2.5]" />
              <span>To-Do List ({activeCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-heading font-black uppercase tracking-wider transition-all ${
                activeTab === "notes"
                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                  : "text-black dark:text-foreground hover:bg-accent"
              }`}
            >
              <StickyNote size={14} className="stroke-[2.5]" />
              <span>Quick Notes & Memo ({notes.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-foreground/60 stroke-[3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "todos" ? "ค้นหารายการงาน..." : "ค้นหาบันทึก / โน้ต..."}
              className="w-full bg-white dark:bg-card border-2 border-black dark:border-border pl-8 pr-3 py-2 text-xs font-bold uppercase text-black dark:text-foreground placeholder:text-black/40 focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
            />
          </div>
        </div>

        {/* Tab 1: To-Do Tasks View */}
        {activeTab === "todos" && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "ทั้งหมด", count: totalCount },
                { id: "active", label: "รอดำเนินการ", count: activeCount },
                { id: "high", label: "ด่วนมาก (High)", count: highPriorityCount },
                { id: "today", label: "วันนี้", count: todos.filter(t => t.dueDate === todayStr).length },
                { id: "completed", label: "เสร็จแล้ว", count: completedCount }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border transition-all ${
                    filter === tab.id
                      ? "bg-primary text-primary-foreground shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] rotate-[-0.5deg]"
                      : "bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent shadow-[1.5px_1.5px_0px_#000000]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1.5 opacity-70 text-[10px]">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Todo Items List */}
            <section className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTodos.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white dark:bg-card border-4 border-dashed border-black dark:border-border p-12 text-center"
                  >
                    <ListTodo size={44} className="mx-auto mb-3 text-black/40 dark:text-foreground/40 stroke-[2]" />
                    <h3 className="font-heading font-black text-sm uppercase text-black dark:text-foreground">
                      ไม่พบรายการงานในหมวดนี้
                    </h3>
                    <p className="text-xs font-medium text-black/60 dark:text-foreground/60 mt-1">
                      พิมพ์สั่งเลขา SINCARE ที่แถบด้านบน หรือกดปุ่ม "Add Task" เพื่อเริ่มสร้างงานได้เลยค่ะ
                    </p>
                  </motion.div>
                ) : (
                  filteredTodos.map((todo) => {
                    const isHigh = todo.priority === "high";
                    const isMedium = todo.priority === "medium";

                    return (
                      <motion.div
                        key={todo.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-white dark:bg-card border-3 border-black dark:border-border p-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] transition-all ${
                          todo.completed ? "opacity-60 bg-surface-2 dark:bg-surface" : "hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className="mt-0.5 p-1 rounded-none text-black dark:text-foreground hover:scale-110 active:scale-95 transition-all shrink-0"
                          >
                            {todo.completed ? (
                              <CheckCircle2 size={20} className="stroke-[3] text-emerald-600" />
                            ) : (
                              <Circle size={20} className="stroke-[2.5] text-black/50 dark:text-foreground/50 hover:text-black" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`font-heading font-black text-sm uppercase leading-snug break-words ${
                                  todo.completed
                                    ? "line-through text-black/50 dark:text-foreground/50"
                                    : "text-black dark:text-foreground"
                                }`}
                              >
                                {todo.title}
                              </h4>

                              {/* Delete Button */}
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="p-1 text-black/40 dark:text-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors shrink-0"
                                title="ลบงาน"
                              >
                                <Trash2 size={14} className="stroke-[2.5]" />
                              </button>
                            </div>

                            {/* Notes */}
                            {todo.notes && (
                              <p className="text-xs text-black/70 dark:text-foreground/70 mt-1 font-medium bg-surface dark:bg-surface-2 p-2 border border-black/20 dark:border-border/40">
                                {todo.notes}
                              </p>
                            )}

                            {/* Badges & Actions */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {/* Priority Badge */}
                              <span
                                className={`text-[9px] font-heading font-black uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000] ${
                                  isHigh
                                    ? "bg-[#FF0055] text-white"
                                    : isMedium
                                    ? "bg-[#FFD166] text-black"
                                    : "bg-[#C7F9CC] text-black"
                                }`}
                              >
                                {todo.priority}
                              </span>

                              {/* Category Badge */}
                              <span className="text-[9px] font-heading font-bold uppercase px-2 py-0.5 bg-surface dark:bg-surface-2 text-black dark:text-foreground border border-black/40">
                                #{todo.category}
                              </span>

                              {/* Due Date */}
                              {todo.dueDate && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-black/70 dark:text-foreground/70 bg-white dark:bg-card px-2 py-0.5 border border-black/40">
                                  <Calendar size={10} className="stroke-[2.5]" /> {todo.dueDate}
                                </span>
                              )}

                              {/* AI Breakdown Action Button */}
                              {!todo.completed && (
                                <button
                                  onClick={() => handleAiBreakdown(todo)}
                                  disabled={isAiLoading}
                                  className="ml-auto inline-flex items-center gap-1 text-[10px] font-heading font-black uppercase text-black dark:text-foreground bg-accent hover:bg-accent/80 px-2.5 py-1 border border-black shadow-[1px_1px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
                                  title="ให้ SINCARE ช่วยแตกเป็นงานย่อยๆ"
                                >
                                  <Sparkles size={11} className="stroke-[3]" />
                                  <span>แตกงานย่อย (AI)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </section>
          </div>
        )}

        {/* Tab 2: Quick Notes & Scratchpad View */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-heading font-black uppercase text-black dark:text-foreground hidden md:inline-block">
                  สมุดโน้ตทั้งหมด ({filteredNotes.length})
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsNoteCategoryDropdownOpen(!isNoteCategoryDropdownOpen)}
                    className="flex items-center gap-1.5 bg-white dark:bg-card border-2 border-black dark:border-border px-3 py-1.5 text-[10px] md:text-xs font-heading font-black uppercase text-black dark:text-foreground shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    <span>{noteFilterCategory === "all" ? "ทุกหมวดหมู่ (ALL)" : noteFilterCategory}</span>
                    <ChevronDown size={14} className="stroke-[3]" />
                  </button>
                  
                  {isNoteCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-card border-3 border-black dark:border-border rounded-none shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] z-[60] py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      <button
                        onClick={() => { setNoteFilterCategory("all"); setIsNoteCategoryDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-heading font-bold uppercase text-black dark:text-foreground hover:bg-accent hover:text-black transition-colors"
                      >
                        ทุกหมวดหมู่ (ALL)
                      </button>
                      {noteCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setNoteFilterCategory(cat); setIsNoteCategoryDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-heading font-bold uppercase text-black dark:text-foreground hover:bg-accent hover:text-black transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => openNoteModal()}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-heading font-black uppercase tracking-wider border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] hover:opacity-90 transition-all"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>เขียนโน้ตใหม่</span>
              </button>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="bg-white dark:bg-card border-4 border-dashed border-black dark:border-border p-12 text-center">
                <StickyNote size={44} className="mx-auto mb-3 text-black/40 dark:text-foreground/40 stroke-[2]" />
                <h3 className="font-heading font-black text-sm uppercase text-black dark:text-foreground">
                  ยังไม่มีบันทึกโน้ต
                </h3>
                <p className="text-xs font-medium text-black/60 dark:text-foreground/60 mt-1">
                  กดปุ่ม "เขียนโน้ตใหม่" เพื่อจดไอเดีย บันทึกการประชุม หรือข้อมูลสำคัญได้ทันทีค่ะ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => {
                    const colorStyle = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

                    return (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`${colorStyle.bg} border-3 ${colorStyle.border} p-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] flex flex-col justify-between group relative`}
                      >
                        {/* Pin Badge */}
                        <div className="flex items-start justify-between gap-2 border-b-2 border-black/20 dark:border-white/10 pb-2 mb-2">
                          <h4 className={`font-heading font-black text-sm uppercase tracking-tight line-clamp-1 ${colorStyle.text}`}>
                            {note.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleNotePin(note.id)}
                              className={`p-1 border border-black/30 rounded-none transition-colors ${
                                note.isPinned ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-black/10 text-black/60 dark:text-white/60"
                              }`}
                              title={note.isPinned ? "ถอนหมุด" : "ปักหมุดไว้ด้านบน"}
                            >
                              <Pin size={11} className="stroke-[2.5]" />
                            </button>
                            <button
                              onClick={() => openNoteModal(note)}
                              className="p-1 border border-black/30 hover:bg-black/10 rounded-none text-black/70 dark:text-white/70 transition-colors"
                              title="แก้ไขโน้ต"
                            >
                              <Edit3 size={11} className="stroke-[2.5]" />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1 border border-black/30 hover:bg-red-500 hover:text-white rounded-none text-black/70 dark:text-white/70 transition-colors"
                              title="ลบโน้ต"
                            >
                              <Trash2 size={11} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 my-2 overflow-y-auto max-h-48 custom-scrollbar">
                          {note.category && (
                            <span className="inline-block bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 text-[9px] font-heading font-black uppercase mb-1.5">
                              {note.category}
                            </span>
                          )}
                          <p className={`text-xs font-medium leading-relaxed whitespace-pre-wrap ${colorStyle.text}`}>
                            {note.content}
                          </p>
                        </div>

                        {/* Footer AI Superpowers */}
                        <div className="pt-2 mt-2 border-t border-black/15 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[9px] font-mono opacity-60 uppercase font-bold">
                            {new Date(note.updatedAt).toLocaleDateString("th-TH")}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleNoteToTasks(note)}
                              disabled={isAiLoading}
                              className="inline-flex items-center gap-1 text-[9px] font-heading font-black uppercase px-2 py-1 bg-white dark:bg-black/40 text-black dark:text-white border border-black dark:border-border shadow-[1px_1px_0px_#000000] hover:bg-black hover:text-white transition-all disabled:opacity-50"
                              title="ให้ SINCARE วิเคราะห์และแปลงโน้ตนี้เป็น To-Do List"
                            >
                              <Sparkles size={10} className="stroke-[3]" />
                              <span>แปลงเป็น To-Do</span>
                            </button>
                            <button
                              onClick={() => handleArchiveNoteToMemory(note)}
                              disabled={isAiLoading}
                              className="inline-flex items-center gap-1 text-[9px] font-heading font-black uppercase px-2 py-1 bg-white dark:bg-black/40 text-black dark:text-white border border-black dark:border-border shadow-[1px_1px_0px_#000000] hover:bg-black hover:text-white transition-all disabled:opacity-50"
                              title="บันทึกโน้ตนี้ลงใน Central Memory"
                            >
                              <BookmarkCheck size={10} className="stroke-[3]" />
                              <span>Memory</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Modal: SINCARE Daily Briefing */}
        <AnimatePresence>
          {showBriefingModal && briefing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-card border-4 border-black dark:border-border p-6 rounded-none shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] max-w-xl w-full max-h-[80vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b-3 border-black dark:border-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-none bg-primary text-primary-foreground border-2 border-black flex items-center justify-center text-sm font-black">
                      📑
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base uppercase text-black dark:text-foreground">
                        SINCARE Executive Briefing
                      </h3>
                      <p className="text-[10px] font-bold text-black/60 dark:text-foreground/60 uppercase">
                        สรุปและจัดลำดับความสำคัญประจำวัน
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBriefingModal(false)}
                    className="p-1 hover:bg-accent border border-black rounded-none text-black dark:text-foreground"
                  >
                    <X size={16} className="stroke-[3]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-xs font-medium text-black dark:text-foreground leading-relaxed whitespace-pre-wrap">
                  {briefing}
                </div>

                <div className="mt-4 pt-3 border-t-2 border-black dark:border-border flex justify-end">
                  <button
                    onClick={() => setShowBriefingModal(false)}
                    className="bg-primary text-primary-foreground font-heading font-black text-xs uppercase px-5 py-2 rounded-none border-2 border-black shadow-[2px_2px_0px_#000000] hover:opacity-90"
                  >
                    รับทราบค่ะ (Close)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Manual Add Task */}
        <AnimatePresence>
          {showAddTaskModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-card border-4 border-black dark:border-border p-6 rounded-none shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] max-w-lg w-full"
              >
                <div className="flex items-center justify-between border-b-3 border-black dark:border-border pb-3 mb-4">
                  <h3 className="font-heading font-black text-base uppercase text-black dark:text-foreground">
                    สร้างรายการ To-Do ใหม่
                  </h3>
                  <button
                    onClick={() => setShowAddTaskModal(false)}
                    className="p-1 hover:bg-accent border border-black rounded-none text-black dark:text-foreground"
                  >
                    <X size={16} className="stroke-[3]" />
                  </button>
                </div>

                <form onSubmit={handleManualAdd} className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1">
                      ชื่องาน (Task Title) *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="เช่น ส่งใบเสนอราคาให้ลูกค้า..."
                      className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border px-3.5 py-2 text-xs font-medium text-black dark:text-foreground focus:bg-white dark:focus:bg-surface-2 focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1">
                        ความสำคัญ (Priority)
                      </label>
                      <select
                        value={manualPriority}
                        onChange={(e) => setManualPriority(e.target.value as any)}
                        className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border px-3 py-2 text-xs font-heading font-bold uppercase text-black dark:text-foreground focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                      >
                        <option value="high">🔥 High (ด่วนมาก)</option>
                        <option value="medium">⚡ Medium (ปานกลาง)</option>
                        <option value="low">🌱 Low (ปกติ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1">
                        หมวดหมู่ (Category)
                      </label>
                      <input
                        type="text"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        placeholder="WORK, MEETING, PERSONAL..."
                        className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border px-3 py-2 text-xs font-medium text-black dark:text-foreground focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1.5">
                      กำหนดส่ง (Due Date)
                    </label>
                    <NeobrutalistDatePicker 
                      value={manualDueDate} 
                      onChange={(date) => setManualDueDate(date)} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1.5">
                      รายละเอียดเพิ่มเติม (Notes)
                    </label>
                    <textarea
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      rows={3}
                      placeholder="บันทึกข้อความหรือขั้นตอนเพิ่มเติม..."
                      className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border px-3.5 py-2.5 text-xs font-medium text-black dark:text-foreground focus:bg-white dark:focus:bg-surface-2 focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-black dark:border-border">
                    <button
                      type="button"
                      onClick={() => setShowAddTaskModal(false)}
                      className="px-5 py-2.5 text-xs font-heading font-black uppercase text-black dark:text-foreground bg-white dark:bg-card hover:bg-accent border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground font-heading font-black text-xs uppercase px-6 py-2.5 border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      Create Task +
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Add / Edit Note */}
        <AnimatePresence>
          {showNoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-card border-4 border-black dark:border-border p-6 rounded-none shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] max-w-lg w-full"
              >
                <div className="flex items-center justify-between border-b-3 border-black dark:border-border pb-3 mb-4">
                  <h3 className="font-heading font-black text-base uppercase text-black dark:text-foreground">
                    {editingNoteId ? "แก้ไขบันทึกโน้ต" : "เขียนบันทึกโน้ตใหม่"}
                  </h3>
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="p-1 hover:bg-accent border border-black rounded-none text-black dark:text-foreground"
                  >
                    <X size={16} className="stroke-[3]" />
                  </button>
                </div>

                <form onSubmit={handleSaveNote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1">
                      หัวข้อโน้ต (Note Title)
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="เช่น ไอเดียการตลาด, สรุปประชุม..."
                      className={`w-full border-2 border-black dark:border-border px-3.5 py-2 text-xs font-medium focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] transition-colors ${NOTE_COLORS[noteColor].bg} ${NOTE_COLORS[noteColor].text}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1.5">
                      เลือกสีการ์ดโน้ต (Color Theme)
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(["yellow", "pink", "green", "blue", "purple", "white"] as const).map((colorKey) => (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNoteColor(colorKey)}
                          className={`w-7 h-7 border-2 border-black rounded-none transition-transform ${
                            noteColor === colorKey ? "scale-110 shadow-[2px_2px_0px_#000000] border-3" : "opacity-80 hover:opacity-100"
                          } ${
                            colorKey === "yellow" ? "bg-[#FFF3B0]" :
                            colorKey === "pink" ? "bg-[#FFCAD4]" :
                            colorKey === "green" ? "bg-[#C7F9CC]" :
                            colorKey === "blue" ? "bg-[#BEE1E6]" :
                            colorKey === "purple" ? "bg-[#E2D4F0]" : "bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1">
                      หมวดหมู่ (Category)
                    </label>
                    <input
                      type="text"
                      value={noteCategory}
                      onChange={(e) => setNoteCategory(e.target.value)}
                      placeholder="เช่น ติดหนี้, ค่าใช้จ่าย, ไอเดีย..."
                      className="w-full border-2 border-black dark:border-border px-3.5 py-2 text-xs font-medium focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] bg-white dark:bg-surface-2 text-black dark:text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase mb-1.5">
                      เนื้อหาบันทึก (Content) *
                    </label>
                    <textarea
                      required
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={6}
                      placeholder="พิมพ์ข้อความหรือเนื้อหาที่ต้องการจดบันทึก..."
                      className={`w-full border-2 border-black dark:border-border px-3.5 py-2.5 text-xs font-medium focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] resize-none transition-colors ${NOTE_COLORS[noteColor].bg} ${NOTE_COLORS[noteColor].text}`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-black dark:border-border">
                    <button
                      type="button"
                      onClick={() => setShowNoteModal(false)}
                      className="px-5 py-2.5 text-xs font-heading font-black uppercase text-black dark:text-foreground bg-white dark:bg-card hover:bg-accent border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground font-heading font-black text-xs uppercase px-6 py-2.5 border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}

function NeobrutalistDatePicker({
  value,
  onChange
}: {
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const getNextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    return d.toISOString().split("T")[0];
  };

  const nextMondayStr = getNextMonday();

  const formatDisplay = (val: string) => {
    if (!val) return "เลือกวันที่ (Select Date)";
    if (val === todayStr) return `วันนี้ (${val})`;
    if (val === tomorrowStr) return `พรุ่งนี้ (${val})`;
    return val;
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-surface-2 dark:bg-surface border-2 border-black dark:border-border px-3.5 py-2.5 text-xs font-bold uppercase text-black dark:text-foreground shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] hover:bg-white dark:hover:bg-surface-2 active:translate-x-0.5 active:translate-y-0.5 transition-all text-left"
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} className="stroke-[2.5]" />
          <span>{formatDisplay(value)}</span>
        </div>
        <ChevronDown size={14} className={`stroke-[3] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Quick Shortcuts */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <button
          type="button"
          onClick={() => { onChange(todayStr); setIsOpen(false); }}
          className={`text-[10px] font-heading font-black uppercase px-2.5 py-1 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_#000000] ${
            value === todayStr ? "bg-primary text-primary-foreground" : "bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent"
          }`}
        >
          วันนี้ (Today)
        </button>
        <button
          type="button"
          onClick={() => { onChange(tomorrowStr); setIsOpen(false); }}
          className={`text-[10px] font-heading font-black uppercase px-2.5 py-1 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_#000000] ${
            value === tomorrowStr ? "bg-primary text-primary-foreground" : "bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent"
          }`}
        >
          พรุ่งนี้ (Tomorrow)
        </button>
        <button
          type="button"
          onClick={() => { onChange(nextMondayStr); setIsOpen(false); }}
          className={`text-[10px] font-heading font-black uppercase px-2.5 py-1 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_#000000] ${
            value === nextMondayStr ? "bg-primary text-primary-foreground" : "bg-white dark:bg-card text-black dark:text-foreground hover:bg-accent"
          }`}
        >
          จันทร์หน้า (Next Mon)
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setIsOpen(false); }}
            className="text-[10px] font-heading font-bold uppercase px-2 py-1 text-black/60 dark:text-foreground/60 hover:text-[#FF0055] underline"
          >
            ล้างวันที่
          </button>
        )}
      </div>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-card border-3 border-black dark:border-border p-4 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_var(--border)]"
          >
            {/* Header: Month & Year & Arrows */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-border pb-2 mb-3">
              <span className="font-heading font-black text-xs uppercase text-black dark:text-foreground">
                {monthNames[month]} {year + 543} ({year})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 border border-black dark:border-border bg-surface dark:bg-surface-2 hover:bg-accent rounded-none shadow-[1px_1px_0px_#000000]"
                >
                  <ArrowLeft size={12} className="stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 border border-black dark:border-border bg-surface dark:bg-surface-2 hover:bg-accent rounded-none shadow-[1px_1px_0px_#000000]"
                >
                  <ArrowRight size={12} className="stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {dayNames.map((d, i) => (
                <span key={i} className="text-[10px] font-heading font-black uppercase text-black/60 dark:text-foreground/60 py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = value === dateStr;
                const isToday = todayStr === dateStr;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      onChange(dateStr);
                      setIsOpen(false);
                    }}
                    className={`h-8 text-xs font-heading font-bold border transition-all flex items-center justify-center ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-black dark:border-border font-black shadow-[2px_2px_0px_#000000] rotate-[-1deg]"
                        : isToday
                        ? "bg-accent text-black border-2 border-black font-black"
                        : "bg-surface-2 dark:bg-surface text-black dark:text-foreground border-black/20 dark:border-border/40 hover:border-black hover:bg-white"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
