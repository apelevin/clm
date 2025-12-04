"use client";

import { useState } from "react";
import { ClauseListItem } from "@/app/api/clauses/route";

interface ClauseDetailsPanelProps {
  clause: ClauseListItem;
  onClose: () => void;
}

export default function ClauseDetailsPanel({
  clause,
  onClose,
}: ClauseDetailsPanelProps) {
  const [copied, setCopied] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">Критическая</span>;
      case "high":
        return <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded">Высокая</span>;
      case "medium":
        return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">Средняя</span>;
      case "low":
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">Низкая</span>;
      default:
        return null;
    }
  };

  const getRiskTypeLabel = (riskType: string) => {
    const labels: Record<string, string> = {
      "неопределённость": "Неопределённость",
      "неформализованность": "Неформализованность",
      "открытый перечень": "Открытый перечень",
      "нарушение процедуры": "Нарушение процедуры",
      "несбалансированность": "Несбалансированность",
      "спорная трактовка": "Спорная трактовка",
    };
    return labels[riskType] || riskType;
  };

  const handleCopyClause = async () => {
    try {
      await navigator.clipboard.writeText(clause.aiRecommendation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[600px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Заголовок */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Детали формулировки</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Закрыть панель"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Исходная формулировка */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Исходная формулировка
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-900 italic">
                "{clause.originalClause}"
              </p>
            </div>
          </div>

          {/* Описание проблемы */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Описание проблемы
            </label>
            <p className="text-sm text-gray-900">
              {clause.problemDescription}
            </p>
          </div>

          {/* Индикаторы риска */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Индикаторы риска
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Критичность:</span>
                {getSeverityBadge(clause.severity)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Тип риска:</span>
                <span className="px-2 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded">
                  {getRiskTypeLabel(clause.riskType)}
                </span>
              </div>
              {clause.disputeProbability !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Вероятность спора:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {clause.disputeProbability}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Проблемные элементы */}
          {clause.problematicElements && clause.problematicElements.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Проблемные элементы
              </label>
              <ul className="space-y-2">
                {clause.problematicElements.map((element, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="text-sm text-gray-900">{element}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Impact */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Влияние на стороны
            </label>
            <p className="text-sm text-gray-900">
              {clause.impact}
            </p>
          </div>

          {/* AI-рекомендация */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              AI-рекомендация (улучшенная формулировка)
            </label>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-900 mb-3">
                {clause.aiRecommendation}
              </p>
              <button
                onClick={handleCopyClause}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                {copied ? "✓ Скопировано" : "Копировать формулировку"}
              </button>
            </div>
          </div>

          {/* Категория и теги */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Категория и теги
            </label>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {clause.category}
              </span>
              {clause.tags && clause.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

