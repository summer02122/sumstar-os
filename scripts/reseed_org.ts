import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const USER_ID = process.argv[2];

if (!USER_ID) {
  console.error('Please provide a USER_ID as the first argument.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reseedOrg() {
  console.log(`Starting reseed for user: ${USER_ID}`);

  // Delete agents for the user
  const { error: agentsError } = await supabase
    .from('agents')
    .delete()
    .eq('user_id', USER_ID);

  if (agentsError) {
    console.error('Failed to delete agents:', agentsError.message);
    process.exit(1);
  }
  console.log('Deleted existing agents for the user.');

  // Delete skills for the user
  const { error: skillsError } = await supabase
    .from('skills')
    .delete()
    .eq('user_id', USER_ID);

  if (skillsError) {
    console.error('Failed to delete skills:', skillsError.message);
    process.exit(1);
  }
  console.log('Deleted existing skills for the user.');

  const { error: rpcError } = await supabase.rpc('seed_default_org', { p_user_id: USER_ID });
  if (rpcError) {
    console.error('Failed to seed organization:', rpcError.message);
    process.exit(1);
  }

  console.log('Successfully reseeded organization data.');
}

reseedOrg().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
