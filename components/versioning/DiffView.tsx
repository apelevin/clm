"use client";

import { ClauseChange } from "@/types/contract-versioning";

interface DiffViewProps {
  change: ClauseChange;
  onClose: () => void;
}

export default function DiffView({ change, onClose }: DiffViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Простое разбиение текста на слова для визуализации diff
  const originalWords = change.original.split(" ");
  const improvedWords = change.improved.split(" ");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Сравнение изменений</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Метаданные */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Категория:</span>{" "}
                <span className="font-medium">{change.category}</span>
              </div>
              <div>
                <span className="text-gray-500">Уровень риска:</span>{" "}
                <span className="font-medium">{change.riskLevel}</span>
              </div>
              <div>
                <span className="text-gray-500">Автор:</span>{" "}
                <span className="font-medium">{change.author}</span>
              </div>
              <div>
                <span className="text-gray-500">Дата:</span>{" "}
                <span className="font-medium">{formatDate(change.date)}</span>
              </div>
            </div>

            {/* Причина изменения */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Причина изменения
              </label>
              <p className="text-sm text-gray-900">{change.reason}</p>
            </div>

            {/* Diff */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">
                Изменения
              </label>
              <div className="space-y-2">
                {/* Исходная формулировка */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-mono text-sm">-</span>
                    <p className="text-sm text-gray-900 flex-1">
                      {change.original}
                    </p>
                  </div>
                </div>

                {/* Улучшенная формулировка */}
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-mono text-sm">+</span>
                    <p className="text-sm text-gray-900 flex-1">
                      {change.improved}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ссылка на риск */}
            {change.riskId && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                  Связанный риск
                </label>
                <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                  Перейти к риску #{change.riskId}
                </button>
              </div>
            )}

            {/* Обоснование */}
            {change.justification && change.justification.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                  Обоснование
                </label>
                <ul className="space-y-2">
                  {change.justification.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}


