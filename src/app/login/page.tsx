"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    setError(null);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "YOUR_SUPABASE_URL_HERE") {
        throw new Error("Supabase is not configured yet. Please check .env.local");
      }

      const { error } = type === 'login' 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;
      
      Swal.fire({
        icon: 'success',
        title: type === 'login' ? 'Logged In Successfully!' : 'Account Created!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // Force a hard reload to ensure middleware catches the new cookie session
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-card p-8 rounded-none border-4 border-black dark:border-border shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_var(--border)] rotate-[-1deg] hover:rotate-0 transition-transform duration-200">
        <div className="text-center mb-8 border-b-3 border-black dark:border-border pb-4">
          <div className="inline-block px-3 py-0.5 bg-primary text-primary-foreground font-heading font-black text-[10px] uppercase tracking-widest border border-black dark:border-border shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_var(--border)] mb-2">
            STUDIO OS ACCESS
          </div>
          <h1 className="text-4xl font-heading font-black uppercase tracking-tighter text-black dark:text-foreground mb-1">SumStar OS</h1>
          <p className="text-xs font-bold text-black/70 dark:text-foreground/70 uppercase tracking-wider">Enter your credentials to access the command center.</p>
        </div>

        {error && (
          <div className="mb-6 bg-[#FF0055]/10 border-2 border-[#FF0055] text-black dark:text-foreground px-4 py-3 rounded-none flex items-center gap-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0 text-[#FF0055] stroke-[2.5]" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/70 dark:text-foreground/70 stroke-[2.5]" size={16} />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border rounded-none pl-10 pr-4 py-3 text-xs md:text-sm font-medium focus:bg-white dark:focus:bg-surface-2 text-black dark:text-foreground placeholder:text-black/40 dark:placeholder:text-foreground/40 focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-heading font-black text-black dark:text-foreground uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/70 dark:text-foreground/70 stroke-[2.5]" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-2 dark:bg-surface border-2 border-black dark:border-border rounded-none pl-10 pr-4 py-3 text-xs md:text-sm font-medium focus:bg-white dark:focus:bg-surface-2 text-black dark:text-foreground placeholder:text-black/40 dark:placeholder:text-foreground/40 focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_var(--border)]"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button 
            disabled={loading || !email || !password}
            onClick={() => handleAuth('login')}
            className="w-full bg-primary text-primary-foreground font-heading font-black uppercase text-xs tracking-wider py-3 rounded-none border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin stroke-[2.5]" /> : "Sign In"}
          </button>
          
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t-2 border-black dark:border-border"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-heading font-black uppercase text-black dark:text-foreground">Or</span>
            <div className="flex-grow border-t-2 border-black dark:border-border"></div>
          </div>

          <button 
            disabled={loading || !email || !password}
            onClick={() => handleAuth('signup')}
            className="w-full bg-surface dark:bg-surface-2 text-black dark:text-foreground font-heading font-black uppercase text-xs tracking-wider py-3 rounded-none border-2 border-black dark:border-border shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_var(--border)] hover:bg-accent hover:text-black active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

