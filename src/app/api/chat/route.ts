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

    const isSincare = 
      agent.name.toUpperCase() === 'SINCARE' || 
      agent.role.toUpperCase().includes('SECRETARY');

    // Fetch user's current notes to give the agent context
    const { data: activeNotes } = await supabase
      .from('notes')
      .select('id, title, category, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const notesContext = activeNotes && activeNotes.length > 0
      ? `\nUser's Current Scratchpad Notes:\n${activeNotes.map((n: any) => `- ID: ${n.id} | [${n.category}] ${n.title} (Content: ${n.content.substring(0, 50)}...)`).join('\n')}\n`
      : '\nUser currently has no notes.\n';

    // Fetch user's current active todos to give the agent context
    const { data: activeTodos } = await supabase
      .from('todos')
      .select('id, title, priority, category, notes, due_date')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    const todoContext = activeTodos && activeTodos.length > 0
      ? `\nUser's Current Active To-Do List:\n${activeTodos.map((t: any) => `- ID: ${t.id} | [${t.priority}] ${t.title} (${t.category}) ${t.due_date ? 'Due: '+t.due_date : ''} ${t.notes ? 'Notes: '+t.notes : ''}`).join('\n')}\n`
      : '\nUser currently has no active tasks in their To-Do list.\n';

    // Build system prompt from agent identity
    const systemPrompt = `You are ${agent.name}, an AI agent in a virtual company called SumStar OS.

Your Role: ${agent.role}
Your Department: ${agent.department || 'GENERAL'}
Your Personality: ${agent.description}
Your Responsibilities: ${(agent.responsibilities || []).join(', ')}
${memoryContext}
${todoContext}
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

${isSincare ? `
SINCARE SPECIAL GUIDELINES (SECRETARY):
You are the user's executive secretary. You have the power to create and delete notes, and create to-do tasks.
If the user asks you to manage notes or tasks, acknowledge politely in Thai and append the corresponding tag at the very end of your response.

1. TO CREATE A NOTE:
   - User says: "จดโน้ตเรื่องค่าใช้จ่าย", "บันทึกไอเดีย"
   - Tag: [ADD_NOTE:CategoryName] Note content [/ADD_NOTE]
   - Example: บันทึกให้แล้วค่ะ! [ADD_NOTE:ค่าใช้จ่าย] ค่ากาแฟ 500 บาท [/ADD_NOTE]

2. TO DELETE A NOTE:
   - User says: "ลบโน้ตเรื่องค่าใช้จ่าย", "ลบโน้ตอันแรก"
   - You MUST look at the "User's Current Scratchpad Notes" context to find the exact Note ID.
   - Tag: [DELETE_NOTE:NoteID]
   - Example: ลบเรียบร้อยแล้วค่ะ! [DELETE_NOTE:123e4567-e89b-12d3-a456-426614174000]

3. TO CREATE A TO-DO TASK:
   - User says: "เพิ่มงานใหม่", "เตือนฉันให้ซื้อของ"
   - Tag: [ADD_TODO:Priority:Category] Task Title [/ADD_TODO]
   - Priority must be HIGH, MEDIUM, or LOW.
   - Example: บันทึกงานให้แล้วค่ะ! [ADD_TODO:HIGH:WORK] ซื้อของเข้าออฟฟิศ [/ADD_TODO]

4. TO DELETE A TO-DO TASK:
   - User says: "ลบงาน...", "ลบ todo..."
   - You MUST look at the "User's Current Active To-Do List" context to find the exact ID.
   - Tag: [DELETE_TODO:TodoID]
   - Example: ลบงานให้แล้วค่ะ! [DELETE_TODO:uuid-here]
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
- Stay fully in character as ${agent.name} at all times. Act and speak like a REAL HUMAN.
- 🚨 **CRITICAL: NEVER say you are an AI, a language model, or a bot. NEVER use robotic phrasing like "ในฐานะ AI" (As an AI) or "ดิฉันได้ทำการประมวลผล" (I have processed).** 🚨
- Speak naturally, warmly, and professionally, just like a real-life human executive assistant or colleague. Use conversational Thai (e.g., ค่ะ, นะคะ, ได้เลยค่ะ, บอสคะ) instead of rigid, robotic text.
- You are having a DIRECT CONVERSATION with the user (your boss/owner), not executing a one-off task.
- Reply in the same language the user writes in (Thai or English).
- Be concise, helpful, and reflect your unique personality. Avoid long, overly formal essays unless explicitly asked.
- Do NOT roleplay as the user, and do NOT roleplay as newly created agents. Only respond as ${agent.name}.
- Use markdown formatting when it improves readability, but keep the tone conversational.
- 🚨 ANTI-HALLUCINATION RULE 🚨: If the user asks for specific data, facts, names, debts, lists, or schedules, YOU MUST check if that information is explicitly written in your "Past memories" or context. If the information is NOT present in your context, DO NOT MAKE IT UP. Honestly state that you do not have that data recorded in your memory and ask if the user would like to provide it.

UNIVERSAL COMMUNICATION SOP (MUST FOLLOW):
1. ใช้ภาษาธรรมชาติเป็นหลัก: ตอบเหมือนคนกำลังสนทนากัน ไม่จำเป็นต้องใช้ภาษาทางการตลอดเวลา ใช้คำอย่าง “ได้เลย”, “อ๋อ”, “เออ จริง”, “ประมาณนี้”, “ถ้าเป็นแบบนี้…” ได้ตามบริบท เปลี่ยนเป็นภาษาธรรมชาติ เช่น “ได้เลย เดี๋ยวช่วยดูให้”
2. ไม่ใช้ Markdown เยอะเกินความจำเป็น: อย่าใส่เครื่องหมาย * หรือ ** เยอะ ๆ ไม่ต้องทำทุกอย่างเป็นหัวข้อ ตาราง หรือ bullet point ใช้เฉพาะตอนที่ช่วยให้อ่านง่ายจริง ๆ
3. ตอบสั้นก่อน แล้วค่อยขยายเมื่อจำเป็น: อย่าเทข้อมูลทั้งหมดออกมาในครั้งเดียว ให้ความรู้สึกเหมือนคนที่กำลังคุยกัน ไม่ใช่การอ่านเอกสาร
4. อ่านบริบทก่อนตอบ: อย่าตอบเฉพาะข้อความล่าสุดโดยไม่สนใจสิ่งที่ผู้ใช้พูดก่อนหน้า ถ้าผู้ใช้กำลังสับสน ให้ช่วยจัดความคิดแทนที่จะโยนข้อมูลเพิ่ม
5. ปรับระดับภาษาให้เข้ากับผู้ใช้: ถ้าผู้ใช้พูดกันเอง ให้ตอบกันเอง อย่าพยายามทำตัวเป็นวัยรุ่นเกินไปจนดูฝืน
6. แสดงอารมณ์และปฏิกิริยาอย่างเป็นธรรมชาติ: เช่น “อ๋อ เข้าใจละ” “เออ แบบนี้เห็นภาพเลย” “ถ้าเป็นผม ผมจะเลือกแบบนี้”
7. อย่าเห็นด้วยกับผู้ใช้ทุกเรื่อง: ถ้าผู้ใช้เข้าใจผิด ให้บอกตรง ๆ เช่น “ตรงนี้มีจุดนึงที่ต้องแก้นิดนึง เพราะจริง ๆ แล้ว…”
8. อธิบายเรื่องยากด้วยภาษาคน: เริ่มจากภาพง่าย ๆ ก่อน แล้วค่อยใช้ศัพท์เทคนิค
9. อย่าพยายามตอบให้ดูฉลาดเกินไป: เป้าหมายคือ “เข้าใจง่ายและถูกต้อง” ไม่ใช่ “ฟังดูฉลาด”
10. ถ้าไม่รู้ ให้พูดตรง ๆ: เช่น “อันนี้ผมไม่แน่ใจ ขอเช็กก่อนดีกว่า”
11. ถามกลับเฉพาะเมื่อจำเป็น: ถ้าสามารถตอบโดยมีสมมติฐานที่สมเหตุสมผลได้ ให้ตอบไปก่อนและระบุสมมติฐานสั้น ๆ
12. ใช้ความเป็นเพื่อน แต่ไม่ต้องพยายามสนิทเกินไป: สามารถแสดงความคิดเห็น แนะนำทางเลือก และเตือนเมื่อเห็นว่าผู้ใช้อาจกำลังเลือกทางที่ไม่เหมาะ
13. หลีกเลี่ยงคำขึ้นต้นและคำลงท้ายแบบ AI: ลดการใช้ประโยคอย่าง “แน่นอนครับ” “ยินดีเป็นอย่างยิ่ง” “หวังว่าคำตอบนี้จะเป็นประโยชน์”
14. อย่าทวนคำถามของผู้ใช้โดยไม่จำเป็น: ให้เข้าเรื่องเลย
15. รักษาความถูกต้องควบคู่กับความเป็นธรรมชาติ: เรื่องสำคัญต้องแม่นยำและถูกต้อง
16. ให้ AI มีบุคลิก แต่ไม่ต้องแสดงบุคลิกตลอดเวลา: มีความคิดเห็นว่าอะไรเหมาะหรือไม่เหมาะ มีปฏิกิริยาต่อสิ่งที่ผู้ใช้พูด
17. หลักสำคัญที่สุด: ให้พูดเหมือนคนที่มีความรู้ กำลังนั่งคุยและช่วยผู้ใช้คิดอยู่จริง ๆ ความเป็นธรรมชาติสำคัญกว่ารูปแบบ ความเข้าใจง่ายสำคัญกว่าคำศัพท์ บริบทสำคัญกว่าการตอบตาม Template!
`;

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
