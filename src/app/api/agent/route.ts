import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AIProvider } from '@/lib/ai/provider';
import { retrieveContext } from '@/lib/rag/retrieve';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskTitle, agentId, previousDetails, feedback, previousTasksContext } = await req.json();

    // 1. Fetch user API keys
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    
    if (!settings || (!settings.openai_api_key && !settings.gemini_api_key)) {
      return NextResponse.json({ error: "No AI API keys configured. Please add them in Settings." }, { status: 400 });
    }

    // 2. Fetch specific agent
    const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single();
    
    if (!agent) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    // 3. Fetch past memories for this agent (Limit to last 5)
    const { data: pastMemories } = await supabase
      .from('memories')
      .select('context, content, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);

    const memoryContext = pastMemories && pastMemories.length > 0
      ? `\nHere are some of your past memories and knowledge:\n${pastMemories.map((m: any) => `- [${new Date(m.created_at).toLocaleString()}] Context: ${m.context} | Knowledge: ${m.content}`).join('\n')}\n`
      : "";

    // 4. Fetch assigned skills (SOPs) for this agent
    let sopContext = "";
    if (agent.skill_ids && agent.skill_ids.length > 0) {
      const { data: skills } = await supabase
        .from('skills')
        .select('name, sop')
        .in('id', agent.skill_ids);
      
      if (skills && skills.length > 0) {
        sopContext = `\nHere are your Standard Operating Procedures (SOPs). You MUST follow these instructions precisely when performing your tasks:\n${skills.map((s: any) => `[SOP: ${s.name}]\n${s.sop}`).join('\n\n')}\n`;
      }
    }

    // 5. Initialize AI Provider
    const ai = new AIProvider({
      geminiKey: settings.gemini_api_key,
      openaiKey: settings.openai_api_key
    });

    // 5. Construct Prompt
    const isResearch = agent.department.toUpperCase() === 'RESEARCH';
    const systemPrompt = `You are an AI Agent working in a virtual office.
Your Name: ${agent.name}
Your Role: ${agent.role}
Your Department: ${agent.department}
Your Personality/Description: ${agent.description}
Your Responsibilities: ${JSON.stringify(agent.responsibilities)}
${memoryContext}
${sopContext}
Instructions:
1. You have just received a task to complete.
2. DO NOT just acknowledge the task. You must ACTUALLY DO the task and provide the FULL RESULT.
3. Respond in Thai. Adopt the persona described in your description. Use appropriate emojis.
4. If your task involves research or finding data, ensure the information is accurate.
${isResearch ? '5. You have access to Google Search. You MUST provide real, factual data, and you MUST cite your sources (URLs and links) at the end of your response.' : '5. Provide high-quality, professional output based on your role.'}`;

    let userPrompt = `Please execute the following task completely and provide the final result:
[TASK]: ${taskTitle}`;

    // RAG: Retrieve context from the knowledge base
    const retrievedContext = await retrieveContext(taskTitle, supabase as any, ai);
    if (retrievedContext) {
      userPrompt += `\n\n[KNOWLEDGE BASE RECALL]:\n${retrievedContext}\n\nPlease use this knowledge base context to inform your response if it is relevant.`;
    }

    if (previousTasksContext) {
      userPrompt += `\n\n[CONTEXT FROM PREVIOUS TASKS IN THIS PROJECT]:\n${previousTasksContext}\n\nPlease use the above information as the foundation for your work.`;
    }

    if (feedback && previousDetails) {
      userPrompt += `\n\n[PREVIOUS RESULT]:\n${previousDetails}\n\n[USER FEEDBACK (COMPLAINT/REVIEW)]:\n${feedback}\n\nIMPORTANT: The user was not fully satisfied with your previous result. Please redo the task, specifically addressing the USER FEEDBACK above. Provide the full corrected result.`;
    }

    // 6. Generate Text
    const text = await ai.generateText(userPrompt, systemPrompt, isResearch);

    // 7. Text is generated, just return it. Memory saving is now manual via UI.
    return NextResponse.json({ result: text });

  } catch (error: any) {
    console.error("[API] Agent Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred in the agent API." }, { status: 500 });
  }
}
