-- Add feedback column to tasks table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='tasks' AND column_name='feedback') THEN
        ALTER TABLE public.tasks ADD COLUMN feedback TEXT;
    END IF;
END $$;
