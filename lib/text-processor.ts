import { Paragraph } from "@/types/contract";

export function splitTextIntoParagraphs(text: string): Paragraph[] {
  // Разбиваем текст на параграфы по двойным переносам строк
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return paragraphs.map((text, index) => ({
    id: `p${index + 1}`,
    text,
  }));
}

/**
 * Извлекает ключевые фрагменты текста для анализа определенных аспектов
 */
export function extractRelevantSections(text: string, type: "metadata" | "payments" | "obligations" | "states"): string {
  const lowerText = text.toLowerCase();
  
  // Ключевые слова для каждого типа анализа
  const keywords: Record<string, string[]> = {
    metadata: [
      "договор", "контракт", "соглашение", "номер", "дата", "город", 
      "заказчик", "исполнитель", "стороны", "предмет", "сумма", "стоимость"
    ],
    payments: [
      "оплата", "платеж", "предоплата", "постоплата", "сумма", "рубль", 
      "цена", "стоимость", "график платежей", "рассрочка", "аванс"
    ],
    obligations: [
      "обязательство", "обязан", "должен", "срок", "дедлайн", 
      "ответственность", "гарантия", "приемка", "расторжение"
    ],
    states: [
      "состояние", "стадия", "этап", "приостановлен", "расторгнут", 
      "просрочен", "приемка", "выполнение", "завершение"
    ],
  };

  const relevantKeywords = keywords[type] || [];
  
  // Разбиваем текст на параграфы
  const paragraphs = splitTextIntoParagraphs(text);
  
  // Фильтруем параграфы, содержащие релевантные ключевые слова
  const relevantParagraphs = paragraphs.filter((para) => {
    const paraLower = para.text.toLowerCase();
    return relevantKeywords.some((keyword) => paraLower.includes(keyword));
  });

  // Если найдено мало релевантных параграфов, возвращаем первые 30% текста
  if (relevantParagraphs.length < 3 && type === "metadata") {
    return paragraphs.slice(0, Math.max(3, Math.floor(paragraphs.length * 0.3)))
      .map((p) => p.text)
      .join("\n\n");
  }

  // Возвращаем релевантные параграфы
  return relevantParagraphs.map((p) => p.text).join("\n\n") || text.substring(0, Math.min(5000, text.length));
}

/**
 * Дедупликация текста - удаляет повторяющиеся фрагменты
 */
export function deduplicateText(text: string): string {
  const paragraphs = splitTextIntoParagraphs(text);
  const seen = new Set<string>();
  const unique: Paragraph[] = [];

  for (const para of paragraphs) {
    const normalized = para.text.trim().toLowerCase().substring(0, 100);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(para);
    }
  }

  return unique.map((p) => p.text).join("\n\n");
}

/**
 * Извлекает ключевые сущности из текста локально (без OpenAI)
 * Помогает сократить количество токенов, отправляемых в API
 */
export function extractKeyEntities(text: string): {
  dates: string[];
  amounts: string[];
  parties: string[];
  deadlines: string[];
} {
  const dates: string[] = [];
  const amounts: string[] = [];
  const parties: string[] = [];
  const deadlines: string[] = [];

  // Извлечение дат (простой паттерн)
  const datePattern = /\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/g;
  const foundDates = text.match(datePattern);
  if (foundDates) {
    dates.push(...foundDates);
  }

  // Извлечение сумм (рубли)
  const amountPattern = /(\d+(?:\s?\d+)*(?:\s?[.,]\d+)?)\s*(?:руб|рублей|рубля|₽|RUB)/gi;
  const foundAmounts = text.match(amountPattern);
  if (foundAmounts) {
    amounts.push(...foundAmounts);
  }

  // Извлечение сроков
  const deadlinePattern = /(?:в течение|не позднее|до|через)\s+(\d+)\s+(?:дн|дня|дней|рабоч|календарн)/gi;
  const foundDeadlines = text.match(deadlinePattern);
  if (foundDeadlines) {
    deadlines.push(...foundDeadlines);
  }

  return { dates, amounts, parties, deadlines };
}

