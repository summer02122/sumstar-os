import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AIProvider } from '@/lib/ai/provider';

interface Subtask {
  title: string;
  department: string;
  assigneeId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskTitle, taskDetails } = await req.json();

    // 1. Fetch user API keys
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    
    if (!settings || (!settings.openai_api_key && !settings.gemini_api_key)) {
      return NextResponse.json({ error: "No AI API keys configured. Please add them in Settings." }, { status: 400 });
    }

    // 2. Fetch user's available agents
    const { data: agents } = await supabase.from('agents').select('id, name, department, role, responsibilities, description').eq('user_id', user.id);
    
    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "No agents available to assign tasks to." }, { status: 400 });
    }

    // 3. Initialize AI Provider
    const ai = new AIProvider({
      geminiKey: settings.gemini_api_key,
      openaiKey: settings.openai_api_key
    });

    // 4. Construct Prompt for CEO
    const agentsContext = agents.map(a => 
      `- ID: ${a.id} | Name: ${a.name} | Dept: ${a.department} | Role: ${a.role} | Skills: ${JSON.stringify(a.responsibilities)}`
    ).join("\n");

    const systemPrompt = `You are an intelligent Task Manager (CEO). Your job is to break down the user's request into smaller, actionable subtasks and assign them to the most appropriate available agents.
    
Available Agents:
${agentsContext}

RULES:
1. You must respond with a JSON object containing a "subtasks" array.
2. Each subtask must have a "title" (string), "department" (string), and an "assigneeId" (string, must exactly match an Agent ID from the list above, or be null if no agent fits).
3. STRICT RULE: DO NOT overcomplicate the project. If the user only asks for research, information, or a summary, DO NOT generate design, coding, or marketing tasks. Stick STRICTLY to the user's explicit goal.
4. Only assign tasks to agents whose skills are actually needed. If a simple task only requires 1 or 2 subtasks, do not generate more.
5. NO DUPLICATES: Never create duplicate subtasks. Every subtask must be unique and represent a distinct step forward in the project. Do not repeat a task that another agent has already been assigned to do.`;

    const userPrompt = `Project Title: ${taskTitle}\nDetails: ${taskDetails || 'No details provided.'}\n\nPlease generate the subtasks JSON.`;

    // 5. Generate JSON Subtasks
    const result = await ai.generateJSON<{ subtasks: Subtask[] }>(userPrompt, systemPrompt);

    return NextResponse.json({ subtasks: result.subtasks });

  } catch (error: any) {
    console.error("CEO API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
