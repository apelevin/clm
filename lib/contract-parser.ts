import { ParsedContract, ContractState, PaymentObligation, ContractStatus, ContractTask, RelativeDate } from "@/types/contract";

/**
 * Нормализует paragraphIds в sourceRefs, фильтруя только существующие ID
 */
function normalizeSourceRefs(sourceRefs: any[], validParagraphIds: Set<string>): any[] {
  if (!Array.isArray(sourceRefs)) {
    return [];
  }

  return sourceRefs.map((ref) => {
    if (!ref || typeof ref !== "object") {
      return ref;
    }

    if (ref.paragraphIds && Array.isArray(ref.paragraphIds)) {
      // Фильтруем только существующие ID
      const normalizedIds = ref.paragraphIds.filter((id: string) => 
        validParagraphIds.has(id)
      );

      // Если все ID были отфильтрованы, возвращаем исходный ref без paragraphIds
      if (normalizedIds.length === 0) {
        return {
          ...ref,
          paragraphIds: undefined,
        };
      }

      return {
        ...ref,
        paragraphIds: normalizedIds,
      };
    }

    return ref;
  }).filter((ref) => {
    // Удаляем ref без paragraphIds
    return ref.paragraphIds && ref.paragraphIds.length > 0;
  });
}

export function validateParsedContract(data: any): ParsedContract {
  // Базовая валидация структуры
  if (!data || typeof data !== "object") {
    throw new Error("Invalid contract data structure");
  }

  // Создаем Set валидных ID параграфов для нормализации
  const validParagraphIds = new Set<string>();
  if (Array.isArray(data.paragraphs)) {
    data.paragraphs.forEach((p: any) => {
      if (p && p.id && typeof p.id === "string") {
        validParagraphIds.add(p.id);
      }
    });
  }

  // Валидация и нормализация contractState
  let contractState: ContractState = {};
  if (data.contractState && typeof data.contractState === "object") {
    contractState = {
      number: data.contractState.number || undefined,
      date: data.contractState.date || undefined,
      city: data.contractState.city || undefined,
      subject: data.contractState.subject || undefined,
      parties: data.contractState.parties || undefined,
      totalAmount: data.contractState.totalAmount
        ? {
            amount:
              typeof data.contractState.totalAmount.amount === "number"
                ? data.contractState.totalAmount.amount
                : typeof data.contractState.totalAmount.amount === "string"
                ? parseFloat(data.contractState.totalAmount.amount) || undefined
                : undefined,
            currency: data.contractState.totalAmount.currency || "RUB",
          }
        : undefined,
    };
    
    // Удаляем totalAmount если amount невалиден
    if (contractState.totalAmount && contractState.totalAmount.amount == null) {
      contractState.totalAmount = undefined;
    }
  }

  // Функция для автоматического определения категории на основе содержимого
  const inferCategory = (title: string, content: string): string => {
    const text = `${title} ${content}`.toLowerCase();
    
    const categoryKeywords: Record<string, string[]> = {
      сроки: ["срок", "дедлайн", "время", "период", "дата", "до", "не позднее"],
      оплата: ["оплата", "платеж", "деньги", "сумма", "рубль", "цена", "стоимость", "предоплата", "постоплата"],
      ответственность: ["ответственность", "штраф", "пеня", "неустойка", "возмещение", "ущерб"],
      гарантии: ["гарантия", "обеспечение", "залог", "поручительство"],
      "изменение договора": ["изменение", "дополнение", "модификация", "редакция"],
      "интеллектуальная собственность": ["интеллектуальная", "авторское", "право", "лицензия", "патент"],
      конфиденциальность: ["конфиденциальность", "секрет", "неразглашение", "тайна"],
      приемка: ["приемка", "принятие", "акт", "подписание акта", "сдача-приемка"],
      "прочие условия": [],
      "разрешение споров": ["спор", "разрешение", "арбитраж", "суд", "претензия"],
      "расторжение": ["расторжение", "прекращение", "отказ", "аннулирование"],
      "форс-мажор": ["форс-мажор", "обстоятельства", "непреодолимая сила"],
      "электронный документооборот": ["электронный", "документооборот", "эдо", "цифровой"],
      "предмет договора": ["предмет", "услуги", "работы", "товары"],
    };

    // Ищем наиболее подходящую категорию
    let bestMatch = "прочие условия";
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter((keyword) => text.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category;
      }
    }

    return bestMatch;
  };

  // Нормализация keyProvisions с установкой priority и category по умолчанию
  const normalizedProvisions = Array.isArray(data.keyProvisions)
    ? data.keyProvisions.map((provision: any) => {
        // Категория ОБЯЗАТЕЛЬНА - всегда устанавливаем её
        let category = provision.category?.trim();
        
        // Если категория не указана, пустая или невалидная, определяем автоматически
        if (!category || category === "" || category === "null" || category === "undefined") {
          const title = provision.title || "";
          const content = provision.content || "";
          
          if (title || content) {
            category = inferCategory(title, content);
          } else {
            category = "прочие условия"; // Категория по умолчанию
          }
        }

        // Гарантируем, что категория всегда есть
        if (!category || category === "") {
          category = "прочие условия";
        }

        return {
          ...provision,
          priority: provision.priority === "secondary" ? "secondary" : "primary",
          visibleFor: provision.visibleFor || undefined,
          category, // Категория всегда устанавливается
          sourceRefs: Array.isArray(provision.sourceRefs)
            ? normalizeSourceRefs(provision.sourceRefs, validParagraphIds)
            : [],
        };
      })
    : [];

  // Нормализация paymentObligations
  const normalizedPaymentObligations: PaymentObligation[] = Array.isArray(
    data.paymentObligations
  )
    ? data.paymentObligations
        .map((obligation: any) => {
          if (!obligation || typeof obligation !== "object") {
            return null;
          }

          // Нормализация суммы
          let normalizedAmount = obligation.amount;
          if (obligation.amount && typeof obligation.amount === "object") {
            const value =
              typeof obligation.amount.value === "number"
                ? obligation.amount.value
                : typeof obligation.amount.value === "string"
                ? parseFloat(obligation.amount.value) || 0
                : 0;

            normalizedAmount = {
              value,
              currency: obligation.amount.currency || "RUB",
              type: obligation.amount.type || "fixed",
              formula: obligation.amount.formula || undefined,
            };
          }

          // Нормализация графика платежей
          let normalizedSchedule = obligation.schedule;
          if (obligation.schedule && typeof obligation.schedule === "object") {
            normalizedSchedule = {
              type: obligation.schedule.type || "one-time",
              deadline: obligation.schedule.deadline || undefined,
              dates: Array.isArray(obligation.schedule.dates)
                ? obligation.schedule.dates
                : undefined,
              period: obligation.schedule.period || undefined,
              installments: Array.isArray(obligation.schedule.installments)
                ? obligation.schedule.installments.map((inst: any) => ({
                    number: inst.number || 0,
                    amount:
                      typeof inst.amount === "number"
                        ? inst.amount
                        : typeof inst.amount === "string"
                        ? parseFloat(inst.amount) || 0
                        : 0,
                    deadline: inst.deadline || "",
                  }))
                : undefined,
            };
          }

          return {
            id: obligation.id || `payment_${Math.random().toString(36).substr(2, 9)}`,
            payer: obligation.payer === "executor" ? "executor" : "customer",
            recipient: obligation.recipient === "customer" ? "customer" : "executor",
            purpose: obligation.purpose || "",
            amount: normalizedAmount,
            schedule: normalizedSchedule,
            conditions: obligation.conditions || undefined,
            sourceRefs: Array.isArray(obligation.sourceRefs)
              ? normalizeSourceRefs(obligation.sourceRefs, validParagraphIds)
              : [],
            relatedClauses: Array.isArray(obligation.relatedClauses)
              ? obligation.relatedClauses
              : undefined,
          };
        })
        .filter(
          (obligation: PaymentObligation | null): obligation is PaymentObligation =>
            obligation !== null
        )
    : [];

  // Нормализация possibleStates
  const normalizedStates: ContractStatus[] = Array.isArray(data.possibleStates)
    ? data.possibleStates
        .map((state: any) => {
          if (!state || typeof state !== "object") {
            return null;
          }

          // Нормализация tasks для состояния
          const normalizedTasks: ContractTask[] = Array.isArray(state.tasks)
            ? state.tasks
                .map((task: any) => {
                  if (!task || typeof task !== "object") {
                    return null;
                  }

                  // Нормализация deadline
                  let normalizedDeadline: RelativeDate | undefined = undefined;
                  if (task.deadline && typeof task.deadline === "object") {
                    const value =
                      typeof task.deadline.value === "number"
                        ? task.deadline.value
                        : typeof task.deadline.value === "string"
                        ? parseInt(task.deadline.value, 10) || 0
                        : 0;

                    if (value > 0) {
                      normalizedDeadline = {
                        value,
                        type:
                          task.deadline.type === "working" ? "working" : "calendar",
                        direction:
                          task.deadline.direction === "before" ? "before" : "after",
                        description: task.deadline.description || undefined,
                      };
                    }
                  }

                  return {
                    id: task.id || `task_${Math.random().toString(36).substr(2, 9)}`,
                    label: task.label || "Неизвестная задача",
                    description: task.description || undefined,
                    assignedTo:
                      task.assignedTo === "executor"
                        ? "executor"
                        : task.assignedTo === "both"
                        ? "both"
                        : "customer",
                    sourceRefs: Array.isArray(task.sourceRefs) 
                      ? normalizeSourceRefs(task.sourceRefs, validParagraphIds)
                      : [],
                    relatedClauses: Array.isArray(task.relatedClauses)
                      ? task.relatedClauses
                      : undefined,
                    priority:
                      task.priority === "secondary" ? "secondary" : "primary",
                    deadline: normalizedDeadline,
                  };
                })
                .filter((task): task is ContractTask => task !== null)
            : [];

          return {
            id: state.id || `state_${Math.random().toString(36).substr(2, 9)}`,
            label: state.label || "Неизвестное состояние",
            description: state.description || undefined,
            sourceRefs: Array.isArray(state.sourceRefs) 
              ? normalizeSourceRefs(state.sourceRefs, validParagraphIds)
              : [],
            relatedClauses: Array.isArray(state.relatedClauses)
              ? state.relatedClauses
              : undefined,
            tasks: normalizedTasks.length > 0 ? normalizedTasks : undefined,
          };
        })
        .filter((state): state is ContractStatus => state !== null)
    : [];

  return {
    originalText: data.originalText || "",
    paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [],
    contractState,
    keyProvisions: normalizedProvisions,
    paymentObligations: normalizedPaymentObligations,
    possibleStates: normalizedStates,
  };
}

