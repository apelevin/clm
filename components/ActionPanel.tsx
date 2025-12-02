"use client";

import { ContractAction } from "@/types/contract";

interface ActionPanelProps {
  actions: ContractAction[];
  onActionClick: (action: ContractAction) => void;
}

// Преобразует лейбл в форму "что сделать?" если он еще не в такой форме
function formatActionLabel(label: string): string {
  // Если лейбл уже начинается с глагола в повелительном наклонении, оставляем как есть
  const imperativeVerbs = [
    "оплатить", "назначить", "рассмотреть", "подписать", "отправить",
    "загрузить", "утвердить", "отклонить", "принять", "отказать",
    "запросить", "предоставить", "выполнить", "завершить", "начать",
    "продолжить", "остановить", "изменить", "удалить", "создать",
    "добавить", "обновить", "проверить", "подтвердить", "отменить",
    "расторгнуть", "приостановить", "возобновить", "продлить", "изменить",
    "отменить", "запросить", "получить", "передать", "принять"
  ];
  
  const lowerLabel = label.toLowerCase().trim();
  
  // Убираем префикс "Выполнить:" если есть
  let cleanLabel = label.replace(/^выполнить:\s*/i, "").trim();
  
  // Проверяем, начинается ли лейбл с глагола в повелительном наклонении
  const startsWithImperative = imperativeVerbs.some(verb => 
    lowerLabel.startsWith(verb) || lowerLabel.startsWith(verb + " ")
  );
  
  if (startsWithImperative && !lowerLabel.startsWith("выполнить")) {
    return label; // Уже в правильной форме
  }
  
  // Пытаемся преобразовать существительные/отглагольные формы в повелительное наклонение
  const transformations: [RegExp, string][] = [
    // Расторжение -> Расторгнуть
    [/^расторжение\s+(договора|контракта|соглашения)/i, "Расторгнуть $1"],
    [/^расторжение\s+/i, "Расторгнуть "],
    // Приостановка -> Приостановить
    [/^приостановка\s+(договора|контракта|соглашения|работы|услуг)/i, "Приостановить $1"],
    [/^приостановка\s+/i, "Приостановить "],
    // Возобновление -> Возобновить
    [/^возобновление\s+(договора|контракта|соглашения|работы|услуг)/i, "Возобновить $1"],
    [/^возобновление\s+/i, "Возобновить "],
    // Продление -> Продлить
    [/^продление\s+(договора|контракта|соглашения|срока)/i, "Продлить $1"],
    [/^продление\s+/i, "Продлить "],
    // Другие преобразования
    [/^оплата\s+/i, "Оплатить "],
    [/^назначение\s+/i, "Назначить "],
    [/^рассмотрение\s+/i, "Рассмотреть "],
    [/^подписание\s+/i, "Подписать "],
    [/^отправка\s+/i, "Отправить "],
    [/^загрузка\s+/i, "Загрузить "],
    [/^утверждение\s+/i, "Утвердить "],
    [/^отклонение\s+/i, "Отклонить "],
    [/^принятие\s+/i, "Принять "],
    [/^отказ\s+/i, "Отказать от "],
    [/^запрос\s+/i, "Запросить "],
    [/^предоставление\s+/i, "Предоставить "],
    [/^выполнение\s+/i, "Выполнить "],
    [/^завершение\s+/i, "Завершить "],
    [/^начало\s+/i, "Начать "],
    [/^продолжение\s+/i, "Продолжить "],
    [/^остановка\s+/i, "Остановить "],
    [/^изменение\s+/i, "Изменить "],
    [/^удаление\s+/i, "Удалить "],
    [/^создание\s+/i, "Создать "],
    [/^добавление\s+/i, "Добавить "],
    [/^обновление\s+/i, "Обновить "],
    [/^проверка\s+/i, "Проверить "],
    [/^подтверждение\s+/i, "Подтвердить "],
    [/^отмена\s+/i, "Отменить "],
  ];
  
  // Применяем преобразования к очищенному лейблу
  for (const [pattern, replacement] of transformations) {
    if (pattern.test(cleanLabel)) {
      return cleanLabel.replace(pattern, replacement);
    }
  }
  
  // Если не удалось преобразовать, возвращаем очищенный лейбл (без "Выполнить:")
  return cleanLabel;
}

export default function ActionPanel({ actions, onActionClick }: ActionPanelProps) {
  if (actions.length === 0) {
    return null;
  }

  // Разделяем действия на основные и второстепенные
  const primaryActions = actions.filter(
    (action) => action.priority !== "secondary"
  );
  const secondaryActions = actions.filter(
    (action) => action.priority === "secondary"
  );

  const renderActionButton = (action: ContractAction, isSecondary: boolean) => {
    const isDisabled = action.isAvailable === false;
    
    const baseClasses = isSecondary
      ? "px-3 py-1.5 rounded-lg font-medium text-xs text-left transition-all duration-200"
      : "px-4 py-2 rounded-lg font-medium text-sm text-left transition-all duration-200";
    
    const colorClasses = isDisabled
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : isSecondary
      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm opacity-90"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md";

    return (
      <button
        key={action.id}
        onClick={() => onActionClick(action)}
        disabled={isDisabled}
        className={`${baseClasses} ${colorClasses}`}
      >
        <div className="flex items-center gap-2">
          <span>{formatActionLabel(action.label)}</span>
          {isDisabled && (
            <span className="text-xs opacity-75">(недоступно)</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Доступные действия для заказчика
      </h3>
      
      {/* Основные действия */}
      {primaryActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {primaryActions.map((action) => renderActionButton(action, false))}
        </div>
      )}

      {/* Второстепенные действия */}
      {secondaryActions.length > 0 && (
        <>
          {primaryActions.length > 0 && (
            <div className="border-t border-gray-200 my-4"></div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {secondaryActions.map((action) => renderActionButton(action, true))}
          </div>
        </>
      )}
    </div>
  );
}

