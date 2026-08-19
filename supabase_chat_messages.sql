-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for performance when querying history by user and agent
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_agent 
    ON public.chat_messages(user_id, agent_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chat messages" 
    ON public.chat_messages FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" 
    ON public.chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" 
    ON public.chat_messages FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" 
    ON public.chat_messages FOR DELETE 
    USING (auth.uid() = user_id);
