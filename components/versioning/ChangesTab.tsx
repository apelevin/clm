"use client";

import { useState } from "react";
import { ClauseChange } from "@/types/contract-versioning";

interface ChangesTabProps {
  changes: ClauseChange[];
  onShowInText: (paragraphId: string) => void;
  onShowDiff: (change: ClauseChange) => void;
}

export default function ChangesTab({
  changes,
  onShowInText,
  onShowDiff,
}: ChangesTabProps) {
  const [expandedChange, setExpandedChange] = useState<string | null>(null);

  const toggleExpand = (changeId: string) => {
    setExpandedChange(expandedChange === changeId ? null : changeId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3">
      {changes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Нет изменений</p>
        </div>
      ) : (
        changes.map((change) => {
          const isExpanded = expandedChange === change.id;
          
          return (
            <div
              key={change.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Заголовок карточки */}
              <div
                className="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => toggleExpand(change.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {change.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        change.riskLevel === "Высокий" 
                          ? "bg-red-100 text-red-800"
                          : change.riskLevel === "Средний"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {change.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {change.reason}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        изменён ×{change.diffParagraphs} абзац / ×{change.diffWords} слов
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        change.author === "AI"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {change.author}
                      </span>
                      <span>{formatDate(change.date)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowInText(change.paragraphId);
                    }}
                    className="ml-2 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    Показать в тексте
                  </button>
                </div>
              </div>

              {/* Раскрывающаяся часть */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {/* Исходная формулировка */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                      Исходная формулировка
                    </label>
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                      <p className="text-sm text-gray-900 italic">
                        "{change.original}"
                      </p>
                    </div>
                  </div>

                  {/* Улучшенная формулировка */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                      Улучшенная формулировка
                    </label>
                    <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                      <p className="text-sm text-gray-900">
                        {change.improved}
                      </p>
                    </div>
                  </div>

                  {/* Обоснование */}
                  {change.justification && change.justification.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                        Обоснование
                      </label>
                      <ul className="space-y-1">
                        {change.justification.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Кнопка показать diff */}
                  <button
                    onClick={() => onShowDiff(change)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Показать diff
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}


