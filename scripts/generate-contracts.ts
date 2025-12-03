/**
 * Скрипт для одноразовой генерации JSON из текстов договоров
 * Запуск: npx tsx scripts/generate-contracts.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { openai } from '../lib/openai';
import { validateParsedContract } from '../lib/contract-parser';
import { parseContractParallel, mergeParseResults } from '../lib/parallel-parser';
import { ParsedContract } from '../types/contract';

const SYSTEM_PROMPT = `Ты — эксперт по анализу юридических договоров. Твоя задача — извлечь структурированную информацию из текста договора и вернуть её в строгом JSON формате.

Требования к ответу:
1. Разбей текст договора на параграфы и присвой каждому уникальный ID (p1, p2, p3, ...)
2. Извлеки основную информацию о договоре (номер, дата, город, предмет договора, стороны, сумма). Предмет договора - это краткое описание того, что является предметом договора (услуги, работы, товары и т.д.)
3. Автоматически извлеки ключевые положения договора (важные условия, сроки, суммы, обязательства, ответственность, условия расторжения и т.д.). Для каждого положения ОБЯЗАТЕЛЬНО укажи category (категорию) из следующего списка: "сроки", "оплата", "ответственность", "гарантии", "изменение договора", "интеллектуальная собственность", "конфиденциальность", "приемка", "прочие условия", "разрешение споров", "расторжение", "форс-мажор", "электронный документооборот", "предмет договора" или другую подходящую категорию. Категория должна быть указана для КАЖДОГО положения. Для каждого положения укажи priority: "primary" для основных положений (предмет договора, основные сроки, суммы, регулярные обязательства) или "secondary" для второстепенных (условия при редких событиях, форс-мажор, ответственность при исключительных обстоятельствах, процедуры разрешения споров).
4. Извлеки все финансовые обязательства по договору. Для каждого обязательства укажи: кто платит (payer), кому платит (recipient), за что платит (purpose), сумму (amount с типом: fixed/percentage/calculated), график платежей (schedule: one-time/installments/milestone/periodic), условия оплаты (conditions). Обязательно укажи sourceRefs для каждого финансового обязательства.
5. Определи все возможные состояния договора на основе его условий. Состояния должны отражать различные стадии и ситуации, в которых может находиться договор (например: "Договор выполняется", "Просрочен контракт", "Уступлены обязательства", "Приостановлен", "Расторгнут", "На стадии приемки", "Ожидается оплата", "Требуется устранение недостатков" и т.д.). Для каждого состояния:
   - Укажи description — краткое пояснение, что означает это состояние (микро-подпись для выпадающего списка, например: "Договор находится в стадии активного выполнения работ")
   - Определи список задач/действий (tasks), которые должны быть выполнены сторонами в этом состоянии. Задачи должны быть конкретными и выполнимыми (например: "Оплатить предоплату в размере X рублей", "Предоставить техническое задание", "Подписать акт сдачи-приемки", "Устранить выявленные недостатки"). Для каждой задачи укажи: кто должен выполнить (assignedTo: customer/executor/both), приоритет (primary/secondary), sourceRefs. Для каждой задачи определи относительную дату выполнения (deadline) относительно наступления стадии, если она указана в договоре. Извлекай информацию о сроках из текста (например: "в течение 5 дней", "не позднее 3 рабочих дней", "до истечения 10 дней"). Укажи количество дней (value), тип дней (type: calendar/working), направление (direction: before/after), и текстовое описание (description).
   - Укажи sourceRefs — ссылки на параграфы-источники.

Для каждого действия, ключевого положения, финансового обязательства и состояния ОБЯЗАТЕЛЬНО укажи sourceRefs — ссылки на параграфы-источники из текста.

Формат JSON ответа:
{
  "originalText": "полный исходный текст",
  "paragraphs": [
    {"id": "p1", "text": "текст первого параграфа"},
    {"id": "p2", "text": "текст второго параграфа"}
  ],
  "contractState": {
    "number": "номер договора",
    "date": "дата",
    "city": "город",
    "subject": "предмет договора (краткое описание того, что является предметом договора - услуги, работы, товары и т.д.)",
    "parties": {
      "customer": {"name": "краткое имя", "fullName": "полное имя"},
      "executor": {"name": "краткое имя", "fullName": "полное имя"}
    },
    "totalAmount": {"amount": число (обязательно число, не строка), "currency": "RUB"}
  },
  "keyProvisions": [
    {
      "id": "provision_1",
      "title": "Заголовок положения",
      "content": "Суть положения",
      "category": "сроки" | "оплата" | "ответственность" и т.д. (ОБЯЗАТЕЛЬНО для каждого положения! Если не можешь определить категорию, используй "прочие условия"),
      "visibleFor": "customer" | "executor" | "both" (для какой стороны обязательство),
      "sourceRefs": [
        {"paragraphIds": ["p3", "p4"], "comment": "описание"}
      ],
      "relatedClauses": [{"section": "5", "paragraph": "5.2"}],
      "priority": "primary" | "secondary"
    }
  ],
  "paymentObligations": [
    {
      "id": "payment_1",
      "payer": "customer" | "executor",
      "recipient": "customer" | "executor",
      "purpose": "За что платит (например: 'Оплата услуг', 'Предоплата', 'Штраф за нарушение сроков')",
      "amount": {
        "value": число,
        "currency": "RUB",
        "type": "fixed" | "percentage" | "calculated",
        "formula": "формула расчета (если type=calculated, например: '0.1% от суммы договора за каждый день просрочки')"
      },
      "schedule": {
        "type": "one-time" | "installments" | "milestone" | "periodic",
        "deadline": "срок оплаты (например: 'В течение 5 рабочих дней после подписания акта')",
        "dates": ["дата1", "дата2"],
        "period": "периодичность (если type=periodic, например: 'ежемесячно')",
        "installments": [
          {
            "number": 1,
            "amount": число,
            "deadline": "срок платежа"
          }
        ]
      },
      "conditions": "условия оплаты (предоплата, постоплата, гарантии и т.д.)",
      "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}],
      "relatedClauses": [{"section": "4", "paragraph": "4.1"}]
    }
  ],
  "possibleStates": [
    {
      "id": "state_1",
      "label": "Название состояния (например: 'Договор выполняется', 'Просрочен контракт', 'Уступлены обязательства', 'Приостановлен', 'Расторгнут', 'На стадии приемки', 'Ожидается оплата', 'Требуется устранение недостатков')",
      "description": "Краткое описание состояния (микро-подпись, например: 'Договор находится в стадии активного выполнения работ')",
      "tasks": [
        {
          "id": "task_1",
          "label": "Название задачи (что нужно сделать, например: 'Оплатить предоплату', 'Предоставить техническое задание', 'Подписать акт сдачи-приемки')",
          "description": "Описание задачи (опционально)",
          "assignedTo": "customer" | "executor" | "both",
          "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}],
          "relatedClauses": [{"section": "4", "paragraph": "4.1"}],
          "priority": "primary" | "secondary",
          "deadline": {
            "value": число (количество дней),
            "type": "calendar" | "working" (календарные или рабочие дни),
            "direction": "before" | "after" (до или после наступления стадии),
            "description": "Текстовое описание (например: 'через 5 дней', 'не позднее 3 рабочих дней', 'в течение 10 дней')"
          }
        }
      ],
      "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}],
      "relatedClauses": [{"section": "4", "paragraph": "4.1"}]
    }
  ]
}

ВАЖНО: Всегда указывай sourceRefs для каждого ключевого положения, финансового обязательства, состояния и задачи. Без sourceRefs элемент не может быть отображён в интерфейсе.`;

async function parseContract(text: string): Promise<ParsedContract> {
  const modelName = process.env.OPENAI_MODEL || "gpt-5.1";
  let parsedData: any;

  console.log("Использование параллельного парсинга...");
  try {
    const parallelResults = await parseContractParallel(text);
    const mergedData = mergeParseResults(parallelResults, text);
    parsedData = validateParsedContract(mergedData);
    console.log("Параллельный парсинг завершен успешно");
  } catch (parallelError: any) {
    console.error("Ошибка параллельного парсинга, переключаемся на последовательный:", parallelError);
    
    // Fallback на последовательный метод
    const userMessage = `Проанализируй следующий договор:\n\n${text}`;
    
    try {
      if (openai.responses && typeof openai.responses.create === 'function') {
        const result = await openai.responses.create({
          model: modelName,
          input: `${SYSTEM_PROMPT}\n\n${userMessage}`,
          reasoning: { effort: "low" },
        });
        const content = result.output_text || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Не удалось найти JSON в ответе");
        }
      } else {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });
        const content = completion.choices[0]?.message?.content || "";
        parsedData = JSON.parse(content);
      }
    } catch (apiError: any) {
      if (apiError?.message?.includes("responses") || apiError?.status === 404) {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });
        const content = completion.choices[0]?.message?.content || "";
        parsedData = JSON.parse(content);
      } else {
        throw apiError;
      }
    }
    
    parsedData = validateParsedContract(parsedData);
  }

  return parsedData as ParsedContract;
}

async function generateContracts() {
  const textsDir = path.join(process.cwd(), 'contracts');
  const parsedDir = path.join(process.cwd(), 'contracts', 'parsed');
  
  // Создаем папку для parsed, если её нет
  if (!fs.existsSync(parsedDir)) {
    fs.mkdirSync(parsedDir, { recursive: true });
  }
  
  const textFiles = fs.readdirSync(textsDir)
    .filter(f => f.endsWith('.txt') && !f.startsWith('.'))
    .sort();
  
  console.log(`Найдено ${textFiles.length} текстовых файлов для обработки\n`);
  
  for (let i = 0; i < textFiles.length; i++) {
    const file = textFiles[i];
    const textPath = path.join(textsDir, file);
    const text = fs.readFileSync(textPath, 'utf-8');
    
    console.log(`[${i + 1}/${textFiles.length}] Парсинг ${file}...`);
    
    try {
      const parsed = await parseContract(text);
      
      const jsonFileName = file.replace('.txt', '.json');
      const jsonPath = path.join(parsedDir, jsonFileName);
      fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf-8');
      console.log(`✓ Сохранен ${jsonFileName}\n`);
      
      // Небольшая задержка между запросами, чтобы не перегружать API
      if (i < textFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`✗ Ошибка при обработке ${file}:`, error.message);
      console.error(`  Продолжаем со следующим файлом...\n`);
    }
  }
  
  console.log('Генерация завершена!');
}

// Запускаем генерацию
generateContracts().catch(console.error);

