import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { AIProvider } from '../src/lib/ai/provider';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Signing up a test user to test RLS and chat functionality...');
  const testEmail = `test_${Date.now()}@example.com`;
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123'
  });
  
  if (authError) {
    console.warn('Signup failed. Error:', authError.message);
    process.exit(1);
  }
  
  const userId = authData?.user?.id;
  const session = authData?.session;
  
  if (!userId || !session) {
    console.log('No active session created. Email confirmation might be required.');
    process.exit(1);
  }
  
  console.log(`Test user created with ID: ${userId}`);

  // Create a dummy agent for this user
  const { data: agent, error: insertAgentErr } = await supabase
    .from('agents')
    .insert([{
      user_id: userId,
      name: 'SUM',
      role: 'CEO',
      department: 'Management',
      description: 'Test CEO agent.'
    }])
    .select()
    .single();
    
  if (insertAgentErr || !agent) {
    console.error('Failed to create agent:', insertAgentErr?.message);
    process.exit(1);
  }
  
  const agentId = agent.id;
  console.log(`Test agent created with ID: ${agentId}`);
  
  // Set AI keys for the test user (ignoring RLS since we just signed up, but user_settings might need it)
  await supabase.from('user_settings').insert([{
    user_id: userId,
    openai_api_key: process.env.OPENAI_API_KEY,
    gemini_api_key: process.env.GEMINI_API_KEY
  }]);
  
  const ai = new AIProvider({ geminiKey: process.env.GEMINI_API_KEY, openaiKey: process.env.OPENAI_API_KEY });
  
  // 1. Write user message
  const testMessage = `Hello SUM, please reply with TEST_SUCCESS.`;
  console.log('Writing user message to DB...');
  const { error: insertUserErr } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      agent_id: agentId,
      message: `[User]: ${testMessage}`
    }]);
    
  if (insertUserErr) {
    if (insertUserErr.message.includes('Could not find the table')) {
      console.warn(`WARNING: Table 'chat_messages' does not exist in the database. Please apply supabase_chat_messages.sql!`);
      process.exit(1);
    }
    console.error('Failed to write user message:', insertUserErr.message);
    process.exit(1);
  }
  
  // 2. Generate AI Response
  console.log('Generating AI response...');
  const systemPrompt = "You are SUM, an AI. Always respond briefly.";
  
  let aiResponse = "";
  try {
    aiResponse = await ai.generateText(testMessage, systemPrompt, false);
  } catch (e: any) {
    console.error('AI generation failed:', e.message);
    process.exit(1);
  }
  
  console.log('AI Response:', aiResponse);
  
  // 3. Write AI message
  console.log('Writing AI message to DB...');
  const { error: insertAiErr } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      agent_id: agentId,
      message: `[SUM]: ${aiResponse}`
    }]);
    
  if (insertAiErr) {
    console.error('Failed to write AI message:', insertAiErr.message);
    process.exit(1);
  }
  
  // 4. Read back messages to verify
  console.log('Verifying messages from DB...');
  const { data: messages, error: readErr } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(2);
    
  if (readErr || !messages || messages.length < 2) {
    console.error('Failed to verify messages in DB:', readErr?.message);
    process.exit(1);
  }
  
  console.log('Test successful. Messages read and written correctly.');
  process.exit(0);
}



run().catch(err => {
  console.error(err);
  process.exit(1);
});
