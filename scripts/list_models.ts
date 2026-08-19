import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { GoogleGenerativeAI } from "@google/generative-ai";

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  const embeddings = data.models.filter((m: any) => m.name.includes('embed'));
  console.log(embeddings.map((m:any) => ({ name: m.name, methods: m.supportedGenerationMethods })));
}
list().catch(console.error);
