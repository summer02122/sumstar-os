import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

type ProviderType = 'gemini' | 'openai';

interface AIConfig {
  geminiKey?: string;
  openaiKey?: string;
}

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
];

function isRateLimitError(e: any): boolean {
  return e?.message?.includes('429') || e?.message?.includes('Too Many Requests') || e?.message?.includes('quota');
}

export class AIProvider {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private getActiveProvider(): ProviderType {
    if (this.config.openaiKey) return 'openai';
    if (this.config.geminiKey) return 'gemini';
    throw new Error("No AI API keys configured.");
  }

  // Try each Gemini model in order until one succeeds
  private async tryGeminiModels<T>(fn: (model: any) => Promise<T>, systemPrompt?: string, useSearchTool?: boolean): Promise<T> {
    const genAI = new GoogleGenerativeAI(this.config.geminiKey!);
    let lastError: any;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          // Removed Google Search tool per user request
        });
        console.log(`[AI] Trying model: ${modelName}`);
        const result = await fn(model);
        return result;
      } catch (e: any) {
        lastError = e;
        console.warn(`[AI] Model ${modelName} failed:`, e.message);
        continue; // Try next model on ANY error
      }
    }

    // If we get here, all models failed. 
    // Fallback: If we tried with search tool, try again without it.
    if (useSearchTool) {
      console.warn("[AI] All models failed with search tool. Retrying without search tool...");
      return this.tryGeminiModels(fn, systemPrompt, false);
    }

    let availableModels = 'Could not fetch available models';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.geminiKey}`);
      const data = await response.json();
      if (data.models) {
        availableModels = data.models.map((m: any) => m.name).join(', ');
      }
    } catch (fetchErr) {
      console.error("Failed to fetch available models", fetchErr);
    }
    
    throw new Error(`All fallback models failed.
Last Error: ${lastError?.message}
---
Available models for your API Key: 
${availableModels}`);
  }

  async generateText(prompt: string, systemPrompt?: string, useSearchTool?: boolean): Promise<string> {
    const provider = this.getActiveProvider();

    if (provider === 'gemini') {
      return this.tryGeminiModels(async (model) => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      }, systemPrompt, useSearchTool);
    }

    if (provider === 'openai') {
      const isOR = this.config.openaiKey!.startsWith('sk-or-');
      const openai = new OpenAI({ 
        apiKey: this.config.openaiKey!,
        baseURL: isOR ? 'https://openrouter.ai/api/v1' : undefined
      });
      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });
      const response = await openai.chat.completions.create({ 
        model: isOR ? "google/gemini-2.0-flash-001" : "gpt-4o-mini", 
        messages 
      });
      return response.choices[0].message.content || "";
    }

    throw new Error("Unknown provider");
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const provider = this.getActiveProvider();

    const jsonPrompt = `${prompt}\n\nCRITICAL INSTRUCTION: Respond ONLY with a valid JSON object. No markdown, no explanation, no code fences. Just raw JSON starting with { and ending with }.`;

    let rawText = '';

    if (provider === 'gemini') {
      rawText = await this.tryGeminiModels(async (model) => {
        const result = await model.generateContent(jsonPrompt);
        return result.response.text().trim();
      }, systemPrompt);
    } else if (provider === 'openai') {
      const isOR = this.config.openaiKey!.startsWith('sk-or-');
      const openai = new OpenAI({ 
        apiKey: this.config.openaiKey!,
        baseURL: isOR ? 'https://openrouter.ai/api/v1' : undefined
      });
      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: jsonPrompt });
      const response = await openai.chat.completions.create({
        model: isOR ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
        messages,
        response_format: isOR ? undefined : { type: "json_object" } // OpenRouter models may not all support response_format
      });
      rawText = response.choices[0].message.content || "{}";
    } else {
      throw new Error("Unknown provider");
    }

    try {
      // Robust JSON extraction
      let cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];

      return JSON.parse(cleaned) as T;
    } catch (e) {
      console.error("JSON Parse Error. Raw:", rawText.substring(0, 300));
      throw new Error(`AI returned invalid JSON: ${rawText.substring(0, 150)}`);
    }
  }

  async streamText(prompt: string, systemPrompt?: string): Promise<ReadableStream> {
    const provider = this.getActiveProvider();

    if (provider === 'gemini') {
      return this.tryGeminiModels(async (model) => {
        const result = await model.generateContentStream(prompt);
        return new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                  controller.enqueue(new TextEncoder().encode(text));
                }
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          }
        });
      }, systemPrompt);
    }

    if (provider === 'openai') {
      const isOR = this.config.openaiKey!.startsWith('sk-or-');
      const openai = new OpenAI({ 
        apiKey: this.config.openaiKey!,
        baseURL: isOR ? 'https://openrouter.ai/api/v1' : undefined
      });
      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });
      
      const responseStream = await openai.chat.completions.create({ 
        model: isOR ? "google/gemini-2.0-flash-001" : "gpt-4o-mini", 
        messages,
        stream: true
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        }
      });
    }

    throw new Error("Unknown provider");
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const provider = this.getActiveProvider();

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(this.config.geminiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }

    if (provider === 'openai') {
      const isOR = this.config.openaiKey!.startsWith('sk-or-');
      const openai = new OpenAI({ 
        apiKey: this.config.openaiKey!,
        baseURL: isOR ? 'https://openrouter.ai/api/v1' : undefined
      });
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    }

    throw new Error("Unknown provider");
  }
}
