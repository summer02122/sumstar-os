# Handoff Report: Milestone 1 - DB Schema & RLS Strategy

## 1. Observation
- **Project Structure**:
  - `PROJECT.md` line 5 specifies table `chat_messages` storing `user_id`, `agent_id`, `message`, `created_at`, with RLS policies ensuring users only see their own chats.
  - `PROJECT.md` line 27 specifies DB layout: `supabase_*.sql` files at root.
  - `.agents/sub_orch_m1_1/SCOPE.md` lines 4-5 specify columns `id`, `user_id`, `agent_id`, `message`, `created_at` and RLS `user_id = auth.uid()`, with `supabase_chat_messages.sql` located at project root.
  - Existing DB schema file `supabase_schema.sql` (lines 55-81) demonstrates the workspace standard for table creation and 4-policy RLS pattern (SELECT, INSERT, UPDATE, DELETE) using `auth.uid() = user_id`.
- **Environment & Supabase CLI**:
  - `supabase/` directory exists with `supabase/migrations/` (`00_rag_setup.sql`, `01_seed_org_rpc.sql`).
  - `npx supabase --version` returns version `2.109.1`.
  - Local Docker engine is inactive (`npx supabase status` failed due to missing Docker engine pipe).
  - `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL="https://ylccqceekcktnkdhmrbn.supabase.co"`.

## 2. Logic Chain
1. **Schema Design**:
   - The table `public.chat_messages` must be defined with:
     - `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()` (or `gen_random_uuid()`).
     - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
     - `agent_id`: `UUID REFERENCES public.agents(id) ON DELETE CASCADE` (or `TEXT` if string agent IDs are used; using `UUID` aligns with `public.memories` and `public.agents`).
     - `message`: `TEXT NOT NULL`.
     - `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())`.
   - Indexing: `CREATE INDEX IF NOT EXISTS idx_chat_messages_user_agent ON public.chat_messages(user_id, agent_id);` to optimize user/agent conversation lookup performance.
2. **RLS Security**:
   - `ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;`
   - Create policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` verifying `auth.uid() = user_id`.
3. **File Placement & Deployment Strategy**:
   - The file MUST be created at project root: `supabase_chat_messages.sql`.
   - Optionally mirror to `supabase/migrations/` for Supabase CLI tracking.
   - Since local Docker is not active for local Supabase emulation, applying to the hosted Supabase project (`ylccqceekcktnkdhmrbn`) can be executed via:
     - **Option A (Recommended)**: Copy SQL from `supabase_chat_messages.sql` into the Supabase Web Dashboard SQL Editor for the target project.
     - **Option B (CLI)**: Link project using `npx supabase link --project-ref ylccqceekcktnkdhmrbn` and execute `npx supabase db push`.

## 3. Caveats
- `agent_id` in `public.agents` is `UUID`. If agent selection in future milestones relies on static string slugs (e.g. `'SUM'`), `agent_id` can be defined as `UUID` if linking to DB agents or `TEXT` if using slugs. Defining `agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE` is standard for FK integrity with the `agents` table.
- Direct CLI migration (`npx supabase db push`) requires authenticating/linking to the remote Supabase project if Docker is disabled locally.

## 4. Conclusion
- Proposed SQL content for `supabase_chat_messages.sql`:
```sql
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
```
- Placement: `c:\Users\siraw\OneDrive\Desktop\sumstar-os\supabase_chat_messages.sql`
- Application strategy: Implementer should create `supabase_chat_messages.sql` at root and execute the SQL statement in the Supabase Dashboard SQL Editor or via `npx supabase db push`.

## 5. Verification Method
1. Inspect file existence at `c:\Users\siraw\OneDrive\Desktop\sumstar-os\supabase_chat_messages.sql`.
2. Validate SQL syntax and structure against Postgres/Supabase syntax rules.
3. Test table creation and RLS enforcement in Supabase SQL Editor.
