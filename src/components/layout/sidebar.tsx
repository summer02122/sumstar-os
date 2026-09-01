"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, CheckSquare, Brain, Settings, Menu, X, Sun, Moon, LogOut, BookOpen, MessageSquare, ListTodo, Upload, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAgentStore } from "@/store/agentStore";
import { createClient } from "@/utils/supabase/client";
import { processAndCompressImage } from "@/lib/imageUtils";
import Swal from "sweetalert2";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBottomNavHidden, setIsBottomNavHidden] = useState(false);
  const [isTopNavCollapsed, setIsTopNavCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  const { settings, updateSettings } = useAgentStore();
  const router = useRouter();
  const supabase = createClient();

  React.useEffect(() => {
    setMounted(true);
    if (window.innerWidth >= 768) {
      setIsOpen(true);
    }
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await processAndCompressImage(file, 400, 400, 0.85);
        await updateSettings({ logoUrl: compressed });
        Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนรูปโลโก้เรียบร้อยแล้วค่ะ!',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Failed to update logo:", err);
      }
    }
  };

  if (pathname === '/login') {
    return null;
  }
  
  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: ListTodo, label: "To-Do List", href: "/todo" },
    { icon: Users, label: "Agent List", href: "/office" },
    { icon: CheckSquare, label: "Recent Tasks", href: "/tasks" },
    { icon: Brain, label: "Memory", href: "/memory" },
    { icon: BookOpen, label: "Skills", href: "/skills" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบ SumStar OS ใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'LOGOUT',
      cancelButtonText: 'CANCEL'
    });

    if (result.isConfirmed) {
      await supabase.auth.signOut();
      await Swal.fire({
        icon: 'success',
        title: 'ออกจากระบบเรียบร้อย!',
        timer: 1500,
        showConfirmButton: false
      });
      router.push('/login');
    }
  };

  return (
    <>
      {/* Invisible Hover Zone at Top to reveal Navbar */}
      {isTopNavCollapsed && (
        <div 
          className="hidden md:block fixed top-0 left-0 w-full h-4 z-50 bg-transparent cursor-pointer" 
          onMouseEnter={() => setIsTopNavCollapsed(false)}
          title="Show Navbar"
        />
      )}

      {/* --- DESKTOP TOP NAV --- */}
      <header 
        className="hidden md:flex w-full h-16 border-b-4 border-black dark:border-border bg-surface dark:bg-card shrink-0 font-sans shadow-[0px_4px_0px_#000000] dark:shadow-[0px_4px_0px_var(--border)] items-center justify-between px-6 z-40 transition-all duration-300 relative"
        style={{ marginTop: isTopNavCollapsed ? '-64px' : '0px' }}
      >
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] overflow-hidden shrink-0">
            <img src={settings.logoUrl || "/logo_star.png"} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <Link href="/" className="flex flex-col group">
            <span className="font-heading font-black tracking-tight text-base text-black dark:text-foreground uppercase leading-none group-hover:text-primary transition-colors">
              SumStar OS
            </span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-[11px] uppercase font-heading tracking-wider transition-all ${
                  isActive
                    ? "bg-white text-black dark:bg-primary dark:text-primary-foreground font-black shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] border-2 border-black dark:border-border rotate-[-1deg]"
                    : "text-black/80 dark:text-foreground/80 font-bold border-2 border-transparent hover:border-black dark:hover:border-border hover:bg-white dark:hover:bg-card hover:text-black dark:hover:text-foreground hover:shadow-[2px_2px_0px_#000000] dark:hover:shadow-[2px_2px_0px_var(--border)] hover:rotate-[0.5deg]"
                }`}
              >
                <item.icon size={14} className="stroke-[2.5]" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={() => setIsTopNavCollapsed(true)} className="p-2 border-2 border-black dark:border-border bg-white dark:bg-surface hover:bg-primary/20 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] text-black dark:text-foreground transition-colors active:translate-x-0.5 active:translate-y-0.5" title="Hide Navbar">
            <ChevronUp size={14} className="stroke-[2.5]" />
          </button>
          <button onClick={toggleTheme} className="p-2 border-2 border-black dark:border-border bg-white dark:bg-surface hover:bg-primary/20 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] text-black dark:text-foreground transition-colors active:translate-x-0.5 active:translate-y-0.5">
            {mounted && settings.theme === 'dark' ? <Sun size={14} className="stroke-[2.5]" /> : <Moon size={14} className="stroke-[2.5]" />}
          </button>
          <button onClick={handleLogout} className="p-2 border-2 border-black dark:border-border bg-primary text-primary-foreground hover:opacity-90 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] transition-colors active:translate-x-0.5 active:translate-y-0.5">
            <LogOut size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* --- MOBILE CONTROLS --- */}
      {/* Mobile toggle (Top Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-2 right-2 z-50 p-2 bg-white dark:bg-card border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] text-black dark:text-foreground active:translate-x-0.5 active:translate-y-0.5"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Bottom Nav (Floating Pill) */}
      {!isOpen && (
        <div className={`md:hidden fixed z-50 transition-all duration-300 ${isBottomNavHidden ? 'bottom-2 right-4 left-auto' : 'bottom-6 left-4 right-4'}`}>
          {isBottomNavHidden ? (
            <button 
              onClick={() => setIsBottomNavHidden(false)}
              className="bg-surface dark:bg-card border-2 border-black dark:border-border rounded-full p-2 shadow-[2px_2px_0px_#000000] text-black dark:text-foreground flex items-center gap-1 text-[10px] font-bold uppercase"
            >
              <Menu size={16} /> <span>Menu</span>
            </button>
          ) : (
            <div className="relative max-w-sm mx-auto">
              <button 
                onClick={() => setIsBottomNavHidden(true)}
                className="absolute -top-10 right-2 bg-surface dark:bg-card border-2 border-black dark:border-border rounded-full px-2 py-1 shadow-[2px_2px_0px_#000000] text-black dark:text-foreground flex items-center gap-1 text-[10px] font-bold uppercase"
              >
                <span>Hide</span> <ChevronDown size={14} />
              </button>
              <nav className="bg-surface dark:bg-card border-2 border-black dark:border-border shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_var(--border)] rounded-full flex items-center justify-between px-2 py-1.5">
                {navItems.slice(0, 4).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex flex-col items-center justify-center w-[3.25rem] h-[3.25rem] rounded-full transition-all duration-300 ${
                        isActive ? "text-primary-foreground -translate-y-3" : "text-black/60 dark:text-foreground/60 hover:text-black dark:hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobileNavActive"
                          className="absolute inset-0 bg-primary border-2 border-black dark:border-border rounded-full shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                      <item.icon size={22} className={`relative z-10 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                      <span className={`text-[9px] font-heading font-black mt-0.5 relative z-10 uppercase ${isActive ? 'block' : 'hidden'}`}>
                        {item.label.split(' ')[0]}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      )}

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside 
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden w-64 border-r-4 border-black dark:border-border bg-surface dark:bg-card h-screen fixed top-0 left-0 flex flex-col z-40 shrink-0 font-sans shadow-[4px_0px_0px_#000000] dark:shadow-[4px_0px_0px_var(--border)]"
          >
            {/* Header */}
            <div className="p-4 border-b-4 border-black dark:border-border flex items-center justify-between bg-white dark:bg-card">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 bg-white flex items-center justify-center border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] overflow-hidden shrink-0">
                  <img src={settings.logoUrl || "/logo_star.png"} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <Link href="/" className="flex flex-col group">
                  <span className="font-heading font-black tracking-tight text-lg text-black dark:text-foreground uppercase leading-none group-hover:text-primary transition-colors">
                    SumStar OS
                  </span>
                </Link>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-none text-black dark:text-foreground transition-colors border border-transparent hover:border-black dark:hover:border-border"
              >
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div key={item.href} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs uppercase font-heading tracking-wider transition-all ${
                        isActive
                          ? "bg-white text-black dark:bg-primary dark:text-primary-foreground font-black shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] border-2 border-black dark:border-border rotate-[-1deg]"
                          : "text-black/80 dark:text-foreground/80 font-bold border-2 border-transparent hover:border-black dark:hover:border-border hover:bg-white dark:hover:bg-card hover:text-black dark:hover:text-foreground hover:shadow-[2px_2px_0px_#000000] dark:hover:shadow-[2px_2px_0px_var(--border)] hover:rotate-[0.5deg]"
                      }`}
                    >
                      <item.icon size={16} className="shrink-0 stroke-[2.5]" />
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            
            {/* Theme Toggle & User (Bottom) */}
            <div className="p-3 border-t-4 border-black dark:border-border bg-white dark:bg-card mt-auto space-y-2">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-surface dark:bg-surface-2 border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] text-black dark:text-foreground font-heading font-black uppercase text-[11px] hover:bg-primary/20 dark:hover:bg-primary/30 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {mounted && settings.theme === 'dark' ? <Sun size={15} className="stroke-[2.5]" /> : <Moon size={15} className="stroke-[2.5]" />}
                <span>
                  {mounted && settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-primary text-primary-foreground border-2 border-black dark:border-border shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)] font-heading font-black uppercase text-[11px] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <LogOut size={15} className="stroke-[2.5]" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

