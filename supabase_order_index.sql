-- Add order_index column to tasks table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='tasks' AND column_name='order_index') THEN
        ALTER TABLE public.tasks ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
END $$;
