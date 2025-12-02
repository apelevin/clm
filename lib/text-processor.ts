import { Paragraph } from "@/types/contract";

export function splitTextIntoParagraphs(text: string): Paragraph[] {
  const normalizedText = text.replace(/\r\n/g, "\n");
  const blocks = normalizedText.split(/\n{2,}/);
  const paragraphs: Paragraph[] = [];
  let index = 1;

  const pushParagraph = (lines: string[]) => {
    if (!lines.length) return;
    const paragraphText = lines.join(" ").replace(/\s+/g, " ").trim();
    if (!paragraphText) return;
    paragraphs.push({ id: `p${index++}`, text: paragraphText });
  };

  const isEnumeratedLine = (line: string) => /^\d+(\.\d+)+/.test(line);
  const isSectionHeading = (line: string) =>
    /^[A-ZА-Я0-9][A-ZА-Я0-9\s.,-]{3,}$/.test(line) && !line.includes(".");

  blocks.forEach((block) => {
    const cleanedBlock = block.trim();
    if (!cleanedBlock) return;

    const lines = cleanedBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentParagraph: string[] = [];

    lines.forEach((line, idx) => {
      if (
        currentParagraph.length > 0 &&
        (isEnumeratedLine(line) ||
          (isSectionHeading(line) && !isSectionHeading(currentParagraph.join(" "))))
      ) {
        pushParagraph(currentParagraph);
        currentParagraph = [];
      }

      currentParagraph.push(line);

      // Если следующая строка — пустая, завершить параграф
      if (idx === lines.length - 1) {
        pushParagraph(currentParagraph);
        currentParagraph = [];
      }
    });
  });

  return paragraphs;
}

/**
 * Извлекает ключевые фрагменты текста для анализа определенных аспектов
 */
export function extractRelevantSections(
  paragraphs: Paragraph[],
  type: "metadata" | "payments" | "obligations" | "states"
): string {
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

  // Фильтруем параграфы, содержащие релевантные ключевые слова
  const relevantParagraphs = paragraphs.filter((para) => {
    const paraLower = para.text.toLowerCase();
    return relevantKeywords.some((keyword) => paraLower.includes(keyword));
  });

  const formatParagraphs = (items: Paragraph[]): string => {
    return items
      .map((p) => `[${p.id}] ${p.text}`)
      .join("\n\n");
  };

  // Если найдено мало релевантных параграфов, возвращаем первые 30% текста
  if (relevantParagraphs.length < 3) {
    const fallbackCount = Math.max(3, Math.floor(paragraphs.length * 0.3));
    const fallbackParagraphs = paragraphs.slice(0, fallbackCount || 3);
    return formatParagraphs(fallbackParagraphs);
  }

  // Возвращаем релевантные параграфы
  return formatParagraphs(relevantParagraphs);
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

