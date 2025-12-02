/**
 * Специализированные промпты для разных этапов парсинга договора
 */

export const METADATA_PROMPT = `Ты — эксперт по анализу юридических договоров. Извлеки основную информацию о договоре из текста.

Верни СТРОГО JSON в формате:
{
  "contractState": {
    "number": "номер договора или null",
    "date": "дата или null",
    "city": "город или null",
    "subject": "предмет договора (краткое описание услуг/работ/товаров)",
    "parties": {
      "customer": {"name": "краткое имя", "fullName": "полное имя"},
      "executor": {"name": "краткое имя", "fullName": "полное имя"}
    },
    "totalAmount": {"amount": число или null, "currency": "RUB"}
  }
}`;

export const PROVISIONS_PROMPT = `Ты — эксперт по анализу юридических договоров. Извлеки ключевые положения договора из текста.

ВАЖНО: в тексте каждый параграф начинается с метки вида [p1], [p2] и т.д. Всегда используй эти ID в поле sourceRefs.

Для каждого положения ОБЯЗАТЕЛЬНО укажи category из списка: "сроки", "оплата", "ответственность", "гарантии", "изменение договора", "интеллектуальная собственность", "конфиденциальность", "приемка", "прочие условия", "разрешение споров", "расторжение", "форс-мажор", "электронный документооборот", "предмет договора".

Верни СТРОГО JSON в формате:
{
  "keyProvisions": [
    {
      "id": "provision_1",
      "title": "Заголовок",
      "content": "Суть положения",
      "category": "сроки",
      "visibleFor": "customer" | "executor" | "both",
      "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}],
      "priority": "primary" | "secondary"
    }
  ]
}`;

export const PAYMENTS_PROMPT = `Ты — эксперт по анализу юридических договоров. Извлеки все финансовые обязательства из текста.

В тексте каждый параграф помечен меткой [pX]. Ссылайся только на эти ID в поле sourceRefs.

Верни СТРОГО JSON в формате:
{
  "paymentObligations": [
    {
      "id": "payment_1",
      "payer": "customer" | "executor",
      "recipient": "customer" | "executor",
      "purpose": "За что платит",
      "amount": {
        "value": число,
        "currency": "RUB",
        "type": "fixed" | "percentage" | "calculated",
        "formula": "формула или null"
      },
      "schedule": {
        "type": "one-time" | "installments" | "milestone" | "periodic",
        "deadline": "срок оплаты",
        "dates": ["дата1"] или null,
        "period": "периодичность" или null,
        "installments": [{"number": 1, "amount": число, "deadline": "срок"}] или null
      },
      "conditions": "условия оплаты" или null,
      "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}]
    }
  ]
}`;

export const STATES_PROMPT = `Ты — эксперт по анализу юридических договоров. Определи все возможные состояния договора на основе его условий.

Параграфы обозначены метками [pX]. Используй их для заполнения sourceRefs.

Для каждого состояния определи список задач (tasks) с дедлайнами относительно наступления стадии.

Верни СТРОГО JSON в формате:
{
  "possibleStates": [
    {
      "id": "state_1",
      "label": "Название состояния",
      "description": "Краткое описание",
      "tasks": [
        {
          "id": "task_1",
          "label": "Название задачи",
          "description": "Описание" или null,
          "assignedTo": "customer" | "executor" | "both",
          "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}],
          "priority": "primary" | "secondary",
          "deadline": {
            "value": число,
            "type": "calendar" | "working",
            "direction": "before" | "after",
            "description": "Текстовое описание"
          } или null
        }
      ],
      "sourceRefs": [{"paragraphIds": ["p1"], "comment": "описание"}]
    }
  ]
}`;

