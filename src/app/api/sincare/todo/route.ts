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

    const { action, input, todos, task } = await req.json();

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

    if (action === 'parse_todo') {
      // Natural Language parsing of a todo item
      const prompt = `Convert the following user request into a structured Todo item:
"${input}"

Today's date is: ${new Date().toISOString().split('T')[0]}

Respond ONLY with a JSON object in this exact format (no markdown code blocks, just raw JSON):
{
  "title": "Short, clear action-oriented task title in Thai",
  "priority": "high" | "medium" | "low",
  "category": "WORK" | "MEETING" | "URGENT" | "PERSONAL" | "FINANCE" | "STUDIO",
  "dueDate": "YYYY-MM-DD" or null,
  "notes": "Any extra details or context"
}`;

      const resText = await ai.generateText(prompt, sincarePersona);
      try {
        const cleaned = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ result: parsed });
      } catch (err) {
        return NextResponse.json({
          result: {
            title: input,
            priority: 'medium',
            category: 'WORK',
            dueDate: null,
            notes: ''
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
