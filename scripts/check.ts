import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
    headers: { 'Accept': 'application/openapi+json' }
  });
  console.log('OpenAPI schema summary:');
  const data = await res.json();
  console.log(Object.keys(data.paths || {}));
}
check();
