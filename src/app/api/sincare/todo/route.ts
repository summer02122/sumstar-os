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

    const sincarePersona = `You are SINCARE, the professional, highly organized, and polite Executive Secretary of SumStar OS.
Your duties: Managing todos, organizing schedules, prioritizing work, and maintaining flawless documentation.
Tone: Polite, efficient, supportive, and executive (ใช้ภาษาไทยที่สุภาพ เช่น ค่ะ/นะคะ/เรียบร้อยค่ะ).`;

    if (action === 'parse_todo' || action === 'smart_chat') {
      const currentTodos = todos || [];
      const currentNotes = notes || [];
      
      const prompt = `You are SINCARE, the polite, highly organized Executive Secretary of SumStar OS.
The user just sent this request on their To-Do & Scratchpad page: "${input || ''}"

Today's date is: ${new Date().toISOString().split('T')[0]}
Current To-Do List: ${JSON.stringify(currentTodos.map((t: any) => ({ title: t.title, completed: t.completed, priority: t.priority })), null, 2)}

Your task:
1. Understand the user's intent.
2. If they are asking a question about their tasks (e.g. "What do I have left?"), answer them in Thai politely.
3. If they want to add a Task, extract the details.
4. If they want to add a Note (Scratchpad), extract the details.

Respond ONLY with a JSON object in this exact format (no markdown code blocks, just raw JSON):
{
  "type": "REPLY_ONLY" | "ADD_TODO" | "ADD_NOTE",
  "reply": "Your conversational reply to the user (e.g. 'มีงานที่ยังไม่เสร็จ 3 งานค่ะ ได้แก่...' หรือ 'เพิ่มโน้ตให้เรียบร้อยค่ะ' หรือ 'เพิ่มงานใหม่แล้วค่ะ')",
  "todoData": {
    "title": "Short action-oriented task title in Thai",
    "priority": "high" | "medium" | "low",
    "category": "WORK" | "PERSONAL" | "MEETING",
    "dueDate": "YYYY-MM-DD" or null,
    "notes": "Any extra details"
  },
  "noteData": {
    "title": "Title of the note",
    "content": "Full content of the note",
    "color": "yellow" | "blue" | "green" | "pink" | "purple"
  }
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
