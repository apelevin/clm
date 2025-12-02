import { openai } from "@/lib/openai";
import { splitTextIntoParagraphs, extractRelevantSections } from "@/lib/text-processor";
import { METADATA_PROMPT, PROVISIONS_PROMPT, PAYMENTS_PROMPT, STATES_PROMPT } from "./contract-parser-prompts";
import { ParsedContract } from "@/types/contract";

interface ParseResult {
  metadata?: any;
  provisions?: any;
  payments?: any;
  states?: any;
  paragraphs: any[];
}

/**
 * Выполняет параллельный парсинг договора через несколько специализированных запросов
 */
export async function parseContractParallel(text: string): Promise<ParseResult> {
  const modelName = process.env.OPENAI_MODEL || "gpt-5.1";
  
  // Предобработка: разбиваем на параграфы
  const paragraphs = splitTextIntoParagraphs(text);
  
  // Извлекаем релевантные секции для каждого типа анализа
  const metadataSection = extractRelevantSections(text, "metadata");
  const paymentsSection = extractRelevantSections(text, "payments");
  const obligationsSection = extractRelevantSections(text, "obligations");
  const statesSection = extractRelevantSections(text, "states");

  // Выполняем параллельные запросы
  const [metadataResult, provisionsResult, paymentsResult, statesResult] = await Promise.allSettled([
    callOpenAI(modelName, METADATA_PROMPT, metadataSection, "metadata"),
    callOpenAI(modelName, PROVISIONS_PROMPT, obligationsSection, "provisions"),
    callOpenAI(modelName, PAYMENTS_PROMPT, paymentsSection, "payments"),
    callOpenAI(modelName, STATES_PROMPT, statesSection, "states"),
  ]).then((results) => {
    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Ошибка при парсинге этапа ${index}:`, result.reason);
        // Возвращаем пустую структуру при ошибке
        const types = ["metadata", "provisions", "payments", "states"];
        return getEmptyResult(types[index]);
      }
    });
  });

  return {
    metadata: metadataResult,
    provisions: provisionsResult,
    payments: paymentsResult,
    states: statesResult,
    paragraphs: paragraphs.map((p) => ({ id: p.id, text: p.text })),
  };
}

/**
 * Вспомогательная функция для вызова OpenAI API
 */
async function callOpenAI(
  modelName: string,
  systemPrompt: string,
  userContent: string,
  type: string
): Promise<any> {
  const userMessage = `Проанализируй следующий фрагмент договора:\n\n${userContent}`;

  try {
    if (openai.responses && typeof openai.responses.create === "function") {
      const result = await openai.responses.create({
        model: modelName,
        input: `${systemPrompt}\n\n${userMessage}`,
        reasoning: { effort: "low" },
      });
      const content = result.output_text || "";
      return parseJSONResponse(content, type);
    } else {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 2000, // Меньше токенов для специализированных запросов
      });
      const content = completion.choices[0]?.message?.content || "";
      return parseJSONResponse(content, type);
    }
  } catch (error: any) {
    // Fallback на стандартный API
    if (error?.message?.includes("responses") || error?.status === 404) {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });
      const content = completion.choices[0]?.message?.content || "";
      return parseJSONResponse(content, type);
    }
    throw error;
  }
}

/**
 * Возвращает пустую структуру для типа
 */
function getEmptyResult(type: string): any {
  switch (type) {
    case "metadata":
      return { contractState: {} };
    case "provisions":
      return { keyProvisions: [] };
    case "payments":
      return { paymentObligations: [] };
    case "states":
      return { possibleStates: [] };
    default:
      return {};
  }
}

/**
 * Парсит JSON ответ от OpenAI
 */
function parseJSONResponse(content: string, type: string): any {
  try {
    let jsonContent = content.trim();
    if (!jsonContent.startsWith("{")) {
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
    }
    return JSON.parse(jsonContent);
  } catch (e) {
    console.error(`Ошибка парсинга JSON для типа ${type}:`, e);
    return getEmptyResult(type);
  }
}

/**
 * Объединяет результаты параллельного парсинга в единый ParsedContract
 */
export function mergeParseResults(
  results: ParseResult,
  originalText: string
): Partial<ParsedContract> {
  return {
    originalText,
    paragraphs: results.paragraphs,
    contractState: results.metadata?.contractState || {},
    keyProvisions: results.provisions?.keyProvisions || [],
    paymentObligations: results.payments?.paymentObligations || [],
    possibleStates: results.states?.possibleStates || [],
  };
}

