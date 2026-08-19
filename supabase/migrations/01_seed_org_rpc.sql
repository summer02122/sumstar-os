-- Add unique constraints to ensure auto-seeding is safe
ALTER TABLE skills ADD CONSTRAINT skills_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE agents ADD CONSTRAINT agents_user_id_name_key UNIQUE (user_id, name);

-- RPC to seed the default organization for a user
CREATE OR REPLACE FUNCTION seed_default_org(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_skill_ask_context UUID;
    v_skill_planning UUID;
    v_skill_documentation UUID;
    v_skill_communication UUID;
    v_skill_review UUID;
    v_skill_delegation UUID;
    v_skill_consistency UUID;
    v_skill_memory UUID;
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Seed Skills and capture their IDs
    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Ask Context', 'Ability to ask clarifying questions.', 'Ask clarifying questions')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_ask_context;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Planning', 'Ability to break down tasks.', 'Break down tasks')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_planning;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Documentation', 'Ability to write documents.', 'Write documents')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_documentation;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Communication', 'Ability to communicate.', 'Communicate effectively')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_communication;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Review', 'Ability to review output.', 'Review output')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_review;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Delegation', 'Ability to delegate work.', 'Delegate work')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_delegation;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Consistency', 'Ability to ensure consistency.', 'Ensure consistency')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_consistency;

    INSERT INTO skills (user_id, name, description, sop) VALUES
    (p_user_id, 'Memory', 'Ability to remember past interactions.', 'Remember past interactions')
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_memory;

    -- Seed Agents
    INSERT INTO agents (user_id, name, role, department, color, description, responsibilities, skill_ids, state) VALUES
    (p_user_id, 'SUM', 'CEO', 'ORCHESTRATOR', 16109579, 'The big boss. Orchestrates the entire team.', ARRAY['รับคำสั่งจากผู้ใช้', 'วิเคราะห์งาน', 'แบ่งงานให้ Agent อื่น']::text[], ARRAY[]::uuid[], 'idle')
    ON CONFLICT (user_id, name) DO NOTHING;

    INSERT INTO agents (user_id, name, role, department, color, description, responsibilities, skill_ids, state) VALUES
    (p_user_id, 'SATIN', 'HR', 'HR', 15485081, 'HR Manager.', ARRAY['Review work', 'Quality control']::text[], ARRAY[v_skill_review]::uuid[], 'idle')
    ON CONFLICT (user_id, name) DO NOTHING;

    INSERT INTO agents (user_id, name, role, department, color, description, responsibilities, skill_ids, state) VALUES
    (p_user_id, 'SINCARE', 'Secretary', 'SECRETARY', 3899062, 'Secretary.', ARRAY['Manage memory', 'Documentation']::text[], ARRAY[v_skill_memory]::uuid[], 'idle')
    ON CONFLICT (user_id, name) DO NOTHING;

END;
$$;
