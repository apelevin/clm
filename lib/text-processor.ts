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

