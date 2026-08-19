-- Migration: Add skills table and update agents table
-- Run this in your Supabase SQL Editor

-- 1. Create Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sop TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Add skill_ids column to agents (if not already there)
ALTER TABLE public.agents 
    ADD COLUMN IF NOT EXISTS skill_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS assignee_id UUID;

-- 3. Add missing columns to tasks (if not already there)
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS feedback TEXT,
    ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtask_ids UUID[] DEFAULT '{}';

-- 4. Enable Row Level Security on skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Skills
CREATE POLICY "Users can view own skills" ON public.skills 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.skills 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.skills 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.skills 
    FOR DELETE USING (auth.uid() = user_id);

-- Done! Refresh your app after running this.
