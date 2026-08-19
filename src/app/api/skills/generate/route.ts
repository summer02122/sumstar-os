import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AIProvider } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }

    // Fetch user API keys
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    
    if (!settings || (!settings.openai_api_key && !settings.gemini_api_key)) {
      return NextResponse.json({ error: "No AI API keys configured. Please add them in Settings." }, { status: 400 });
    }

    const ai = new AIProvider({
      geminiKey: settings.gemini_api_key,
      openaiKey: settings.openai_api_key
    });

    const systemPrompt = `You are an expert Process Engineer and AI Consultant. Your job is to write a highly effective, structured Standard Operating Procedure (SOP) that an autonomous AI Agent will read and follow strictly.
- Format the SOP as a Markdown list or step-by-step instruction.
- Include clear rules, constraints, and the exact step-by-step workflow.
- Do NOT include any introductory or concluding conversational text. Output ONLY the raw SOP text.
- Keep it concise but comprehensive.`;

    const prompt = `Write an SOP for an AI Agent with the following role/skill:
Skill Name: ${name}
Description: ${description || 'Not provided. Please infer the responsibilities based on the skill name.'}

Generate the SOP now.`;

    const sopText = await ai.generateText(prompt, systemPrompt, false);

    return NextResponse.json({ sop: sopText });

  } catch (error: any) {
    console.error("[API] Generate SOP Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
