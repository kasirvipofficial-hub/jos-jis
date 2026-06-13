import { OpenAI } from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-api-key",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

export const OPENAI_MODEL = "gpt-4.1-nano";
