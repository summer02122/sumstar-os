import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a client without any authentication (no user signed in)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIDOR() {
  console.log('Testing IDOR vulnerability when auth.uid() is null...');
  
  // We will try to seed the org for an arbitrary UUID
  const targetUserId = '11111111-1111-1111-1111-111111111111';
  
  const { data, error } = await supabase.rpc('seed_default_org', { p_user_id: targetUserId });
  
  if (error) {
    console.error('RPC failed:', error.message);
  } else {
    console.log('RPC succeeded! Successfully seeded data for targetUserId:', targetUserId);
    console.log('This confirms the IDOR vulnerability exists because auth.uid() was null, bypassing the check.');
  }
}

testIDOR();
