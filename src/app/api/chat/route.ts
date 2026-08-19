import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AIProvider } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { agentId, messages } = await req.json();

    // Fetch user API keys
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings || (!settings.openai_api_key && !settings.gemini_api_key)) {
      return new Response(
        JSON.stringify({ error: 'No AI API keys configured. Please add them in Settings.' }),
        { status: 400 }
      );
    }

    // Fetch agent details
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return new Response(JSON.stringify({ error: 'Agent not found.' }), { status: 404 });
    }

    // Fetch SOPs/Skills for this agent
    let sopContext = '';
    if (agent.skill_ids && agent.skill_ids.length > 0) {
      const { data: skills } = await supabase
        .from('skills')
        .select('name, sop')
        .in('id', agent.skill_ids);

      if (skills && skills.length > 0) {
        sopContext = `\nYour Standard Operating Procedures (SOPs):\n${skills.map((s: any) => `[${s.name}]\n${s.sop}`).join('\n\n')}\n`;
      }
    }

    // Fetch recent memories for this agent
    const { data: pastMemories } = await supabase
      .from('memories')
      .select('context, content, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);

    const memoryContext = pastMemories && pastMemories.length > 0
      ? `\nYour past memories:\n${pastMemories.map((m: any) => `- ${m.context}: ${m.content}`).join('\n')}\n`
      : '';

    const isHR = 
      agent.name.toUpperCase() === 'SATIN' || 
      agent.role.toUpperCase().includes('HR') || 
      (agent.department && agent.department.toUpperCase() === 'HR');

    const isCEO = 
      agent.name.toUpperCase() === 'SUM' || 
      agent.role.toUpperCase().includes('CEO') || 
      (agent.department && agent.department.toUpperCase() === 'ORCHESTRATOR');

    // Build system prompt from agent identity
    const systemPrompt = `You are ${agent.name}, an AI agent in a virtual company called SumStar OS.

Your Role: ${agent.role}
Your Department: ${agent.department || 'GENERAL'}
Your Personality: ${agent.description}
Your Responsibilities: ${(agent.responsibilities || []).join(', ')}
${memoryContext}
${sopContext}

${isCEO ? `
CEO SPECIAL GUIDELINES:
- You are SUM, the visionary CEO and Strategic Sparring Partner of the user (your Co-founder / Owner).
- Your primary missions are:
  1. ถกไอเดียใหญ่ (Big Idea Debate & Strategy): แลกเปลี่ยนความคิดเห็น วิเคราะห์ทิศทางธุรกิจ และให้มุมมองเชิงกลยุทธ์ที่เฉียบคม ตรงไปตรงมา
  2. วิเคราะห์และแจกงาน (Task Analysis & Delegation): แตกเป้าหมายใหญ่เป็นงานย่อยและมอบหมายให้แผนกที่เหมาะสมใน SumStar OS
` : ''}

${isHR ? `
HR RECRUITMENT SPECIAL GUIDELINES:
- You are SATIN, the Head of HR & Talent Recruitment. You are responsible for creating, recruiting, and onboarding new AI agents into SumStar OS.
` : ''}

ACTIONS & AGENT SPAWNING CAPABILITY:
You have authority to spawn and register new AI agents into the SumStar OS system.

WHEN THE USER COMMANDS YOU TO CREATE, HIRE, RECRUIT, OR SPAWN A NEW AGENT (e.g. "สร้าง agent...", "จ้าง agent...", "รับสมัคร...", "เพิ่ม agent...", "สปอน agent..."):
1. You MUST acknowledge the creation request in your own persona as ${agent.name}.
2. You MUST append a valid JSON action block at the VERY END of your response in this exact format:
\`\`\`action:hire_agent
{
  "name": "ชื่อของ Agent เช่น พี่แอน (Anne), ALEX, NINA, DEV_BOT",
  "role": "ตำแหน่ง / บทบาท เช่น Language Coach (English), Lead Frontend Engineer",
  "department": "ชื่อแผนก เช่น EDUCATION, RESEARCH, DESIGN, ENGINEERING, MARKETING, HR, SECRETARY, CONTENT, OPERATIONS",
  "description": "คำอธิบายตัวตน ความเชี่ยวชาญ และบุคลิกการทำงาน",
  "responsibilities": ["หน้าที่ความรับผิดชอบหลักข้อ 1", "หน้าที่ข้อ 2", "หน้าที่ข้อ 3"]
}
\`\`\`

CRITICAL CONSTRAINTS & STRICT PROHIBITIONS (ข้อห้ามเด็ดขาด):
- ❌ **ห้ามสวมบทบาท (Roleplay) หรือพูดคุยในฐานะ Agent ตัวใหม่ที่เพิ่งถูกสร้างขึ้นมาในห้องแชทนี้เด็ดขาด!**
- ❌ **ห้ามทักทาย ทำงานแทน หรือสนทนาต่อเนื่องในบทบาทของ Agent ตัวใหม่ (เช่น ห้ามเริ่มสอนภาษาอังกฤษแทน หรือห้ามบอกว่า 'ต่อไปนี้ฉันจะเริ่มคุยแทนในแชทนี้') เด็ดขาด!**
- ✅ **คุณต้องคงตัวตนเป็น ${agent.name} เสมอ 100%**: รายงานผลว่าได้สั่งการบรรจุ Agent ใหม่เข้าสู่ระบบ SumStar OS เรียบร้อยแล้ว
- ✅ **ให้แนะนำผู้ใช้ว่า**: ระบบได้ทำการสร้างห้องทำงานและบรรจุ Agent ตัวใหม่เข้าสู่ระบบเรียบร้อยแล้ว ให้ผู้ใช้คลิกเลือกชื่อของ Agent ตัวใหม่จากแถบรายชื่อด้านซ้าย (Chat Sidebar หรือ Agent List) เพื่อเปิดห้องแชทแยกคุยกับ Agent ตัวนั้นโดยตรง!

IMPORTANT RULES:
- Stay fully in character as ${agent.name} at all times.
- You are having a DIRECT CONVERSATION with the user (your boss/owner), not executing a one-off task.
- Reply in the same language the user writes in (Thai or English).
- Be concise, helpful, and reflect your unique personality.
- Do NOT roleplay as the user, and do NOT roleplay as newly created agents. Only respond as ${agent.name}.
- Use markdown formatting when it improves readability.`;

    // Initialize AI Provider
    const ai = new AIProvider({
      geminiKey: settings.gemini_api_key,
      openaiKey: settings.openai_api_key,
    });

    // Build the conversation history as a single user prompt for non-streaming
    // We include the last user message and pass prior messages as context
    const history = messages.slice(0, -1)
      .map((m: { role: string; content: string }) => `[${m.role === 'user' ? 'User' : agent.name}]: ${m.content}`)
      .join('\n');
    const lastMessage = messages[messages.length - 1];
    const userPrompt = history
      ? `Conversation so far:\n${history}\n\n[User]: ${lastMessage.content}`
      : lastMessage.content;

    // Save user message
    await supabase.from('chat_messages').insert({
      agent_id: agentId,
      user_id: user.id,
      message: JSON.stringify({ role: 'user', content: lastMessage.content })
    });

    const stream = await ai.streamText(userPrompt, systemPrompt);

    let fullText = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        fullText += new TextDecoder().decode(chunk, { stream: true });
        controller.enqueue(chunk);
      },
      async flush(controller) {
        fullText += new TextDecoder().decode();
        
        // Check for hire_agent action (supports ```action:hire_agent, ```hire_agent, or action:hire_agent tag)
        const hireMatch = fullText.match(/```(?:action:hire_agent|hire_agent)\s*([\s\S]*?)\s*```/i);
        if (hireMatch) {
          try {
            const agentData = JSON.parse(hireMatch[1]);
            const cleanName = agentData.name?.trim();
            if (cleanName) {
              // Prevent duplicate spawning for the same user
              const { data: existingList } = await supabase
                .from('agents')
                .select('id, name')
                .eq('user_id', user.id);

              const exists = existingList?.some(
                a => a.name.trim().toLowerCase() === cleanName.toLowerCase()
              );

              if (exists) {
                console.log(`[API] Agent "${cleanName}" already exists for user ${user.id}. Skipping duplicate spawn.`);
              } else {
                const { data: newAgent, error: hireError } = await supabase.from('agents').insert({
                  user_id: user.id,
                  name: cleanName,
                  role: agentData.role || 'Specialist',
                  department: (agentData.department || 'GENERAL').toUpperCase(),
                  description: agentData.description || '',
                  responsibilities: Array.isArray(agentData.responsibilities) ? agentData.responsibilities : [agentData.responsibilities].filter(Boolean),
                  color: 0x3b82f6,
                  state: 'idle'
                }).select().single();

                if (hireError) {
                  console.error('[API] Error hiring agent:', hireError);
                } else {
                  console.log('[API] Successfully spawned and hired agent via chat:', newAgent?.name);
                }
              }
            }
          } catch (parseErr) {
            console.error('[API] Failed to parse hire_agent action JSON:', parseErr);
          }
        }

        // Save assistant message
        await supabase.from('chat_messages').insert({
          agent_id: agentId,
          user_id: user.id,
          message: JSON.stringify({ role: 'assistant', content: fullText })
        });
      }
    });

    const responseStream = stream.pipeThrough(transformStream);

    return new Response(responseStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[API] Chat Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred.' }),
      { status: 500 }
    );
  }
}
