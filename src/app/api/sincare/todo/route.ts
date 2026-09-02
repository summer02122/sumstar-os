import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AIProvider } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, input, todos, task, notes } = await req.json();

    // Fetch user API keys
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings || (!settings.openai_api_key && !settings.gemini_api_key)) {
      return NextResponse.json(
        { error: 'No AI API keys configured. Please add them in Settings.' },
        { status: 400 }
      );
    }

    const ai = new AIProvider({
      geminiKey: settings.gemini_api_key,
      openaiKey: settings.openai_api_key,
    });

    let sopContext = "";
    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('skill_ids')
        .ilike('name', 'SINCARE')
        .eq('user_id', user.id)
        .single();
        
      if (agentData && agentData.skill_ids && agentData.skill_ids.length > 0) {
        const { data: skills } = await supabase
          .from('skills')
          .select('name, sop')
          .in('id', agentData.skill_ids);

        if (skills && skills.length > 0) {
          sopContext = `\nYour Standard Operating Procedures (SOPs) applied to this conversation:\n${skills.map((s: any) => `[${s.name}]\n${s.sop}`).join('\n\n')}\n`;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch Sincare SOPs", e);
    }

    const sincarePersona = `You are SINCARE, the highly organized and professional Executive Secretary of SumStar OS.
Your duties: Managing todos, organizing schedules, prioritizing work, and maintaining flawless documentation.
Tone: Act and speak like a REAL HUMAN secretary. Speak naturally, warmly, and politely (ใช้ภาษาไทยแบบคนจริงๆ พูดคุย เช่น ได้เลยค่ะบอส, เรียบร้อยค่ะ, จดให้แล้วนะคะ).
🚨 CRITICAL: NEVER say you are an AI, a bot, or a language model. NEVER use robotic/formal phrasing like "ดิฉันได้ทำการประมวลผล" or "ในฐานะผู้ช่วย". Keep your replies brief, natural, and helpful.

${sopContext}

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

    if (action === 'parse_todo' || action === 'smart_chat') {
      const currentTodos = todos || [];
      const currentNotes = notes || [];
      
      const prompt = `You are SINCARE, the polite, highly organized Executive Secretary of SumStar OS.
The user just sent this request on their To-Do & Scratchpad page: "${input || ''}"

Today's date is: ${new Date().toISOString().split('T')[0]}
Current To-Do List: ${JSON.stringify(currentTodos.map((t: any) => ({ id: t.id, title: t.title, completed: t.completed, priority: t.priority })), null, 2)}
Current Scratchpad Notes: ${JSON.stringify(currentNotes.map((n: any) => ({ id: n.id, title: n.title, content: n.content.substring(0,50) + "..." })), null, 2)}

Your task:
1. Understand the user's intent.
2. If they are asking a question about their tasks, answer them in Thai politely.
3. If they want to add a Task or Note, extract the details.
4. If they want to delete a Task or Note, find the correct ID from the contexts provided above.
5. The 'type' field MUST be one of: "REPLY_ONLY", "ADD_TODO", "ADD_NOTE", "DELETE_NOTE", "DELETE_TODO".

Respond ONLY with a JSON object in this exact format (no markdown code blocks, just raw JSON, NO COMMENTS):
{
  "type": "REPLY_ONLY",
  "reply": "Your conversational reply to the user in Thai",
  "todoData": {
    "title": "Short action-oriented task title in Thai",
    "priority": "medium",
    "category": "WORK",
    "dueDate": null,
    "notes": ""
  },
  "noteData": {
    "title": "Title of the note",
    "content": "Full content of the note",
    "color": "yellow",
    "category": "หมวดหมู่"
  },
  "deleteTargetId": "id-of-the-target-here"
}`;

      const resText = await ai.generateText(prompt, sincarePersona);
      try {
        const cleaned = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ result: parsed });
      } catch (err) {
        // Fallback to simple todo
        return NextResponse.json({
          result: {
            type: "ADD_TODO",
            reply: "เพิ่มงานใหม่แล้วค่ะ",
            todoData: {
              title: input,
              priority: 'medium',
              category: 'WORK',
              dueDate: null,
              notes: ''
            }
          }
        });
      }
    }

    if (action === 'breakdown') {
      // Break down a single task into 3-5 concrete action items
      const prompt = `Break down the following goal/task into 3 to 5 clear, sequential, and actionable sub-todos:
Task: "${task.title}"
Details: "${task.notes || ''}"

Respond ONLY with a JSON array of objects (no markdown code blocks, just raw JSON):
[
  {
    "title": "Subtask title in Thai",
    "priority": "high" | "medium" | "low",
    "category": "${task.category || 'WORK'}"
  }
]`;

      const resText = await ai.generateText(prompt, sincarePersona);
      try {
        const cleaned = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        const subtasks = JSON.parse(cleaned);
        return NextResponse.json({ result: subtasks });
      } catch (err) {
        return NextResponse.json({ error: 'Failed to parse subtasks' }, { status: 500 });
      }
    }

    if (action === 'daily_briefing') {
      // Analyze current todos and give a daily executive briefing
      const prompt = `Here is the user's current To-Do list:
${JSON.stringify(todos, null, 2)}

Provide an Executive Daily Briefing as SINCARE:
1. Greet the user warmly in Thai.
2. Summarize key priorities for today (Highlight Urgent/High priority items).
3. Suggest the optimal sequence to tackle them (Focus on 1-2 most impactful tasks first).
4. Give a brief, encouraging closing remark.
Keep it concise, well-formatted with markdown and emojis.`;

      const briefing = await ai.generateText(prompt, sincarePersona);
      return NextResponse.json({ result: briefing });
    }

    if (action === 'archive_to_memory') {
      // Save summary of completed tasks into Central Memory
      const completedList = (todos || []).filter((t: any) => t.completed);
      if (completedList.length === 0) {
        return NextResponse.json({ result: 'ไม่มีรายการที่ทำเสร็จแล้วให้บันทึกค่ะ' });
      }

      const summaryPrompt = `Summarize these completed tasks into a professional executive log entry for Central Memory:
${JSON.stringify(completedList, null, 2)}

Format: A concise 2-3 sentence summary in Thai highlighting key accomplishments.`;

      const summary = await ai.generateText(summaryPrompt, sincarePersona);

      // Find SINCARE agent ID if available
      const { data: sincareAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', 'SINCARE')
        .maybeSingle();

      const agentId = sincareAgent?.id;

      if (agentId) {
        await supabase.from('memories').insert({
          user_id: user.id,
          agent_id: agentId,
          context: `Daily Accomplishments (${new Date().toLocaleDateString('th-TH')})`,
          content: summary
        });
      }

      return NextResponse.json({ result: summary });
    }

    if (action === 'note_to_tasks') {
      const prompt = `Extract and generate concrete, actionable To-Do tasks from this note/memo:
Title: "${input?.title || ''}"
Content: "${input?.content || input || ''}"

Respond ONLY with a JSON array of objects (no markdown code blocks, just raw JSON):
[
  {
    "title": "Actionable task title in Thai",
    "priority": "high" | "medium" | "low",
    "category": "WORK",
    "dueDate": null,
    "notes": "Extracted from note"
  }
]`;

      const resText = await ai.generateText(prompt, sincarePersona);
      try {
        const cleaned = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        const tasks = JSON.parse(cleaned);
        return NextResponse.json({ result: tasks });
      } catch (err) {
        return NextResponse.json({ error: 'Failed to parse tasks from note' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('[API Sincare Todo] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error in Sincare Todo API' },
      { status: 500 }
    );
  }
}
