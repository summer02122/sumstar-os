-- 1. Add feedback column for the Review/Reject feature
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='tasks' AND column_name='feedback') THEN
        ALTER TABLE public.tasks ADD COLUMN feedback TEXT;
    END IF;
END $$;

-- 2. Add order_index column for the Sequential Agent Collaboration feature
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='tasks' AND column_name='order_index') THEN
        ALTER TABLE public.tasks ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
