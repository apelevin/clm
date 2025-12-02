import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { validateParsedContract } from "@/lib/contract-parser";
import { splitTextIntoParagraphs } from "@/lib/text-processor";
import { metricsCollector } from "@/lib/metrics";
import { parseContractParallel, mergeParseResults } from "@/lib/parallel-parser";
import { ParsedContract } from "@/types/contract";

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/parse-contract";
  let inputSize = 0;
  let outputSize = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let modelName = "";

  try {
    console.log("=== Начало обработки запроса ===");
    const body = await request.json();
    const { text, useParallel: useParallelParam = true } = body;
    let useParallel = useParallelParam;
    inputSize = new Blob([text]).size;
    console.log("Получен текст длиной:", text?.length || 0);
    console.log("Использование параллельного парсинга:", useParallel);

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.error("Ошибка: пустой текст");
      return NextResponse.json(
        { error: "Текст договора не может быть пустым" },
        { status: 400 }
      );
    }

    if (text.length > 300000) {
      console.error("Ошибка: текст слишком большой");
      return NextResponse.json(
        { error: "Текст договора слишком большой (максимум 300 КБ)" },
        { status: 400 }
      );
    }

    modelName = process.env.OPENAI_MODEL || "gpt-5.1";
    let parsedData: any;

    // Используем параллельный парсинг, если включен
    if (useParallel) {
      console.log("Использование параллельного парсинга...");
      try {
        const parallelResults = await parseContractParallel(text);
        const mergedData = mergeParseResults(parallelResults, text);
        
        // Валидируем данные после параллельного парсинга
        console.log("Валидация данных после параллельного парсинга...");
        parsedData = validateParsedContract(mergedData);
        
        // Подсчитываем примерные токены (параллельные запросы)
        // Каждый запрос использует примерно 1/4 от полного текста
        const avgSectionSize = text.length / 4;
        inputTokens = Math.ceil((avgSectionSize * 4) / 4); // Примерная оценка
        outputTokens = Math.ceil(JSON.stringify(parsedData).length / 4);
        totalTokens = inputTokens + outputTokens;
        
        console.log("Параллельный парсинг завершен успешно");
      } catch (parallelError: any) {
        console.error("Ошибка параллельного парсинга, переключаемся на последовательный:", parallelError);
        console.error("Детали ошибки:", parallelError?.message, parallelError?.stack);
        // Fallback на последовательный метод
        useParallel = false;
        parsedData = null;
      }
    }

    // Последовательный парсинг (старый метод)
    if (!useParallel || !parsedData) {
      console.log("Использование последовательного парсинга...");
      const systemPromptSize = new Blob([SYSTEM_PROMPT]).size;
      const userMessage = `Проанализируй следующий договор:\n\n${text}`;
      const userMessageSize = new Blob([userMessage]).size;
      let content: string;
      
      try {
        // Новый формат API с responses.create()
        if (openai.responses && typeof openai.responses.create === 'function') {
          console.log("Используется новый API responses.create()");
          const result = await openai.responses.create({
            model: modelName,
            input: `${SYSTEM_PROMPT}\n\n${userMessage}`,
            reasoning: { effort: "low" },
          });
          content = result.output_text || "";
          if (result.usage) {
            // ResponseUsage может иметь другую структуру, используем безопасный доступ
            inputTokens = (result.usage as any).prompt_tokens || (result.usage as any).input_tokens || 0;
            outputTokens = (result.usage as any).completion_tokens || (result.usage as any).output_tokens || 0;
            totalTokens = result.usage.total_tokens || 0;
          }
        } else {
          // Fallback на стандартный API
          console.log("Используется стандартный API chat.completions.create()");
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
          content = completion.choices[0]?.message?.content || "";
          if (completion.usage) {
            inputTokens = completion.usage.prompt_tokens || 0;
            outputTokens = completion.usage.completion_tokens || 0;
            totalTokens = completion.usage.total_tokens || 0;
          }
        }
      } catch (apiError: any) {
        // Если новый API не поддерживается, пробуем стандартный
        if (apiError?.message?.includes("responses") || apiError?.status === 404) {
          console.log("Новый API не поддерживается, используем стандартный");
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
          content = completion.choices[0]?.message?.content || "";
          if (completion.usage) {
            inputTokens = completion.usage.prompt_tokens || 0;
            outputTokens = completion.usage.completion_tokens || 0;
            totalTokens = completion.usage.total_tokens || 0;
          }
        } else {
          throw apiError;
        }
      }
      
      console.log("OpenAI API ответил успешно");
      if (!content) {
        console.error("Ошибка: пустой ответ от OpenAI");
        throw new Error("Empty response from OpenAI");
      }

      console.log("Парсинг JSON ответа...");
      let jsonContent = content.trim();
      if (!jsonContent.startsWith('{')) {
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log("Найден JSON блок в ответе");
        }
      }
      
      try {
        parsedData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        throw new Error("Неверный формат ответа от OpenAI. Ожидается JSON объект.");
      }
    }

    // Валидация данных (если еще не была выполнена для параллельного парсинга)
    let validatedData: ParsedContract;
    if (useParallel && parsedData) {
      // Данные уже валидированы в параллельном парсинге
      validatedData = parsedData;
    } else {
      console.log("Валидация данных...");
      validatedData = validateParsedContract(parsedData);
    }

    // Если параграфы не были извлечены, разобьём текст вручную
    if (validatedData.paragraphs.length === 0) {
      console.log("Параграфы не найдены, разбиваем текст вручную...");
      validatedData.paragraphs = splitTextIntoParagraphs(text);
    }

    console.log("Успешно обработано:", {
      paragraphs: validatedData.paragraphs.length,
      provisions: validatedData.keyProvisions.length,
      payments: validatedData.paymentObligations.length,
      states: validatedData.possibleStates.length,
    });

    outputSize = new Blob([JSON.stringify(validatedData)]).size;
    const duration = Date.now() - startTime;

    // Логируем метрики
    const finalInputSize = useParallel ? inputSize : (new Blob([SYSTEM_PROMPT]).size + new Blob([`Проанализируй следующий договор:\n\n${text}`]).size);
    metricsCollector.log({
      endpoint,
      timestamp: Date.now(),
      inputTokens,
      outputTokens,
      totalTokens,
      duration,
      inputSize: finalInputSize,
      outputSize,
      model: modelName,
    });

    return NextResponse.json(validatedData);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Логируем метрики даже при ошибке
    metricsCollector.log({
      endpoint,
      timestamp: Date.now(),
      inputTokens,
      outputTokens,
      totalTokens,
      duration,
      inputSize,
      outputSize,
      model: modelName,
      error: error?.message || "Unknown error",
    });
    console.error("=== ОШИБКА ПРИ ОБРАБОТКЕ ДОГОВОРА ===");
    console.error("Тип ошибки:", error?.constructor?.name);
    console.error("Сообщение:", error?.message);
    console.error("Стек:", error?.stack);
    
    // Проверяем специфичные ошибки OpenAI
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Неверный API ключ OpenAI. Проверьте файл .env.local" },
        { status: 500 }
      );
    }
    
    if (error?.status === 404 || error?.message?.includes("model")) {
      return NextResponse.json(
        { error: `Модель "gpt-5-mini-2025-08-07" не найдена. Проверьте название модели в настройках.` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error.message || "Не удалось обработать договор. Попробуйте снова или сократите текст.",
      },
      { status: 500 }
    );
  }
}

