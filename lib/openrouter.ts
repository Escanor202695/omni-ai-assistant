import OpenAI from 'openai';

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'Omni AI Assistant',
  },
});

export const MODELS = {
  PRIMARY: 'openai/gpt-4-turbo-preview',
  FALLBACK: 'anthropic/claude-3-sonnet-20240229',
  FAST: 'openai/gpt-3.5-turbo',
} as const;
