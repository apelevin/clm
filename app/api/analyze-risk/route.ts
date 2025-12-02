import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { ClauseRiskAnalysis } from "@/types/contract";

const RISK_PROMPT = `Ты — опытный юрист по договорному праву с экспертизой в CLM (Contract Lifecycle Management). Тебе будет передана формулировка обязательства из коммерческого договора (на русском языке) и, возможно, полный текст договора для анализа зависимостей.

Твоя задача — провести глубокий профессиональный анализ рисков и вернуть структурированные данные в JSON формате.

ТРЕБОВАНИЯ К АНАЛИЗУ:

1. КРАТКОЕ РЕЗЮМЕ (summary):
   - Одна строка формата: "Риск: [низкий/средний/высокий]. Причина: [краткое описание основной причины риска]"
   - Пример: "Риск: Средний. Причина: неопределённость условий приостановления"

2. ИНДИКАТОРЫ РИСКА (indicators):
   - riskLevel: "low" | "medium" | "high"
   - riskType: один из типов: "неопределённость" | "дисбаланс" | "неправомерность" | "процедурный"
   - disputeProbability: число от 0 до 100 (процент вероятности спора)
   - consequenceSeverity: "легкие" | "средние" | "критичные"

3. ЮРИДИЧЕСКАЯ КАРТА РИСКА (legalRiskMap):
   - problematicElements: массив объектов с полями:
     * element: описание проблемного элемента формулировки (например: "неясность 'приостановить на 50%'")
     * issue: в чем конкретно проблема (например: "Отсутствие определения объема приостановления")
   - consequences: массив объектов с полями:
     * description: что может случиться (например: "Спор о том, что именно приостановлено")
     * affectedParty: "customer" | "executor" | "both"
     * probability: опционально, число от 0 до 100
   - conflictProbability: общая AI-оценка вероятности конфликта (0-100)

4. IMPACT-АНАЛИЗ (impactAnalysis):
   - ifLeftAsIs: массив строк с последствиями, если оставить формулировку как есть
   - ifFixed: массив строк с последствиями, если исправить формулировку

5. ГРАФ ЗАВИСИМОСТЕЙ (dependencyGraph, опционально):
   - Если передан полный договор, проанализируй связи между обязательствами
   - nodes: массив узлов с полями id, label, type
   - edges: массив связей с полями from, to, relationship (тип связи: "активирует", "влияет на", "приводит к")
   - Показывай только реальные зависимости, если их нет — не включай это поле

6. BENCHMARK СРАВНЕНИЕ (benchmark):
   - Массив сравнений с рыночными стандартами для категории обязательства
   - Каждый элемент содержит:
     * element: элемент для сравнения (например: "Уведомление", "Пропорциональность")
     * requirement: требование (например: "обязано быть", "должна быть")
     * status: "present" | "missing" | "partial"
     * recommendation: опциональная рекомендация

7. ТАЙМЛАЙН СОБЫТИЙ (timeline):
   - Извлеки из текста все даты, сроки, периоды
   - Построй последовательность событий с днями относительно начала
   - Каждое событие содержит:
     * day: число (может быть отрицательным или относительным, например: 0, 10, +5, +30)
     * event: описание события (например: "счет", "истек срок", "уведомление")
     * description: опциональное дополнительное описание

8. ОТЛИЧИЯ ФОРМУЛИРОВКИ (differences, опционально):
   - Краткий список ключевых отличий рекомендованной формулировки от исходной
   - Формат: ["+ уведомление", "+ сроки", "+ пропорциональность"]

9. РЕКОМЕНДОВАННАЯ ФОРМУЛИРОВКА (suggestedClause):
   - Альтернативная формулировка на русском языке
   - Должна лучше защищать интересы заказчика
   - Соответствовать деловому юридическому стилю

10. РИСКИ (risks):
    - Массив кратких описаний возможных рисков

ВСЕГДА возвращай СТРОГО JSON в следующем формате (без лишнего текста вне JSON):
{
  "riskLevel": "low" | "medium" | "high",
  "risks": ["краткое описание риска 1", "краткое описание риска 2"],
  "suggestedClause": "альтернативная формулировка условия",
  "summary": "Риск: Средний. Причина: неопределённость условий приостановления",
  "indicators": {
    "riskLevel": "medium",
    "riskType": "неопределённость",
    "disputeProbability": 25,
    "consequenceSeverity": "средние"
  },
  "legalRiskMap": {
    "problematicElements": [
      {"element": "неясность 'приостановить на 50%'", "issue": "Отсутствие определения объема приостановления"}
    ],
    "consequences": [
      {"description": "Спор о том, что именно приостановлено", "affectedParty": "both", "probability": 30}
    ],
    "conflictProbability": 25
  },
  "impactAnalysis": {
    "ifLeftAsIs": ["Высокий риск оспаривания расторжения в суде", "Возможные доначисления по неустойкам"],
    "ifFixed": ["Прозрачная процедура", "Равновесие интересов", "Снижение вероятности конфликта до 5-7%"]
  },
  "dependencyGraph": {
    "nodes": [{"id": "payment_delay", "label": "Просрочка оплаты", "type": "obligation"}],
    "edges": [{"from": "payment_delay", "to": "work_suspension", "relationship": "активирует"}]
  },
  "benchmark": [
    {"element": "Уведомление", "requirement": "обязано быть", "status": "missing", "recommendation": "Добавить требование письменного уведомления"}
  ],
  "timeline": [
    {"day": 0, "event": "счет", "description": "Выставление счета"},
    {"day": 10, "event": "истек срок", "description": "Истечение срока оплаты"}
  ],
  "differences": ["+ уведомление", "+ сроки", "+ пропорциональность"]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clauseText: string | undefined = body?.clauseText;
    const fullContract: any | undefined = body?.fullContract;
    const provisionId: string | undefined = body?.provisionId;
    const provisionCategory: string | undefined = body?.provisionCategory;

    if (!clauseText || typeof clauseText !== "string" || clauseText.trim().length === 0) {
      return NextResponse.json(
        { error: "Текст обязательства обязателен для анализа." },
        { status: 400 }
      );
    }

    const modelName = process.env.OPENAI_MODEL || "gpt-5.1";

    // Формируем контекст для анализа
    let userMessage = `Проанализируй следующее условие договора:\n\n${clauseText}`;
    
    if (provisionCategory) {
      userMessage += `\n\nКатегория обязательства: ${provisionCategory}`;
    }
    
    if (fullContract) {
      userMessage += `\n\nПолный текст договора для анализа зависимостей:\n${JSON.stringify(fullContract, null, 2)}`;
    }

    let content: string;

    try {
      if (openai.responses && typeof openai.responses.create === "function") {
        const result = await openai.responses.create({
          model: modelName,
          input: `${RISK_PROMPT}\n\n${userMessage}`,
          reasoning: { effort: "medium" },
        });
        content = result.output_text || "";
      } else {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: RISK_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });
        content = completion.choices[0]?.message?.content || "";
      }
    } catch (apiError: any) {
      // Fallback, если новый API недоступен
      if (apiError?.message?.includes("responses") || apiError?.status === 404) {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: RISK_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });
        content = completion.choices[0]?.message?.content || "";
      } else {
        throw apiError;
      }
    }

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error("Неверный формат ответа от OpenAI при анализе рисков. Ожидается JSON объект.");
    }

    // Нормализация и валидация данных
    const riskLevel: ClauseRiskAnalysis["riskLevel"] =
      parsed.riskLevel === "high" || parsed.riskLevel === "medium" ? parsed.riskLevel : "low";

    const risks = Array.isArray(parsed.risks)
      ? parsed.risks.map((r) => String(r)).filter((r) => r.trim().length > 0)
      : [];

    const suggestedClause =
      typeof parsed.suggestedClause === "string" && parsed.suggestedClause.trim().length > 0
        ? parsed.suggestedClause
        : clauseText;

    // Нормализация новых полей
    const summary = typeof parsed.summary === "string" ? parsed.summary : `Риск: ${riskLevel === "high" ? "Высокий" : riskLevel === "medium" ? "Средний" : "Низкий"}.`;

    const indicators = parsed.indicators && typeof parsed.indicators === "object"
      ? {
          riskLevel: parsed.indicators.riskLevel || riskLevel,
          riskType: parsed.indicators.riskType || "неопределённость",
          disputeProbability: typeof parsed.indicators.disputeProbability === "number" 
            ? Math.max(0, Math.min(100, parsed.indicators.disputeProbability)) 
            : 0,
          consequenceSeverity: parsed.indicators.consequenceSeverity || "средние",
        }
      : {
          riskLevel,
          riskType: "неопределённость" as const,
          disputeProbability: 0,
          consequenceSeverity: "средние" as const,
        };

    const legalRiskMap = parsed.legalRiskMap && typeof parsed.legalRiskMap === "object"
      ? {
          problematicElements: Array.isArray(parsed.legalRiskMap.problematicElements)
            ? parsed.legalRiskMap.problematicElements.filter((e: any) => e && e.element && e.issue)
            : [],
          consequences: Array.isArray(parsed.legalRiskMap.consequences)
            ? parsed.legalRiskMap.consequences.filter((c: any) => c && c.description && c.affectedParty)
            : [],
          conflictProbability: typeof parsed.legalRiskMap.conflictProbability === "number"
            ? Math.max(0, Math.min(100, parsed.legalRiskMap.conflictProbability))
            : indicators.disputeProbability,
        }
      : {
          problematicElements: [],
          consequences: [],
          conflictProbability: indicators.disputeProbability,
        };

    const impactAnalysis = parsed.impactAnalysis && typeof parsed.impactAnalysis === "object"
      ? {
          ifLeftAsIs: Array.isArray(parsed.impactAnalysis.ifLeftAsIs)
            ? parsed.impactAnalysis.ifLeftAsIs.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0)
            : [],
          ifFixed: Array.isArray(parsed.impactAnalysis.ifFixed)
            ? parsed.impactAnalysis.ifFixed.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0)
            : [],
        }
      : {
          ifLeftAsIs: [],
          ifFixed: [],
        };

    const dependencyGraph = parsed.dependencyGraph && typeof parsed.dependencyGraph === "object"
      && Array.isArray(parsed.dependencyGraph.nodes) && Array.isArray(parsed.dependencyGraph.edges)
      && parsed.dependencyGraph.nodes.length > 0
      ? {
          nodes: parsed.dependencyGraph.nodes.filter((n: any) => n && n.id && n.label),
          edges: parsed.dependencyGraph.edges.filter((e: any) => e && e.from && e.to && e.relationship),
        }
      : undefined;

    const benchmark = Array.isArray(parsed.benchmark)
      ? parsed.benchmark
          .filter((b: any) => b && b.element && b.requirement && b.status)
          .map((b: any) => ({
            element: String(b.element),
            requirement: String(b.requirement),
            status: b.status === "present" || b.status === "partial" ? b.status : "missing",
            recommendation: b.recommendation ? String(b.recommendation) : undefined,
          }))
      : [];

    const timeline = Array.isArray(parsed.timeline)
      ? parsed.timeline
          .filter((t: any) => t && typeof t.day === "number" && t.event)
          .map((t: any) => ({
            day: t.day,
            event: String(t.event),
            description: t.description ? String(t.description) : undefined,
          }))
      : [];

    const differences = Array.isArray(parsed.differences)
      ? parsed.differences.map((d: any) => String(d)).filter((d: string) => d.trim().length > 0)
      : undefined;

    const result: ClauseRiskAnalysis = {
      riskLevel,
      risks,
      suggestedClause,
      summary,
      indicators,
      legalRiskMap,
      impactAnalysis,
      dependencyGraph,
      benchmark,
      timeline,
      differences,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ошибка при анализе рисков:", error);
    return NextResponse.json(
      { error: error?.message || "Не удалось выполнить анализ рисков." },
      { status: 500 }
    );
  }
}


