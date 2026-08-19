-- 1. Create Skills Table
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sop TEXT NOT NULL, -- Standard Operating Procedure (Step-by-step instructions)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Add skill_ids column to agents table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='agents' AND column_name='skill_ids') THEN
        ALTER TABLE public.agents ADD COLUMN skill_ids JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Enable RLS on skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for skills
CREATE POLICY "Users can view own skills" ON public.skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.skills FOR DELETE USING (auth.uid() = user_id);
