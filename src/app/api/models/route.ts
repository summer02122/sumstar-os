import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    if (!settings || !settings.gemini_api_key) {
      return NextResponse.json({ error: "No Gemini key" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(settings.gemini_api_key);
    // Note: older SDKs might not have listModels exposed directly if it's v0.24.1, 
    // wait, fetch from REST API directly to be safe
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${settings.gemini_api_key}`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
