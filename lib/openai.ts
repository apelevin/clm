import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("Проверка API ключа:", apiKey ? `Установлен (${apiKey.substring(0, 10)}...)` : "НЕ УСТАНОВЛЕН");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables. Please create .env.local file with your API key.");
    }
    openaiInstance = new OpenAI({
      apiKey,
    });
  }
  return openaiInstance;
}

export const openai = {
  get chat() {
    return getOpenAIClient().chat;
  },
  get responses() {
    return getOpenAIClient().responses;
  },
  get client() {
    return getOpenAIClient();
  },
};

