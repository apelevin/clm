"use client";

import { ClauseListItem } from "@/app/api/clauses/route";

interface ClauseCardProps {
  clause: ClauseListItem;
  onClick: () => void;
}

export default function ClauseCard({ clause, onClick }: ClauseCardProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Критическая</span>;
      case "high":
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Высокая</span>;
      case "medium":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Средняя</span>;
      case "low":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Низкая</span>;
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

  // Сокращаем формулировку для карточки
  const truncatedClause = clause.originalClause.length > 120
    ? clause.originalClause.substring(0, 120) + "..."
    : clause.originalClause;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
    >
      {/* Заголовок с категорией и критичностью */}
      <div className="flex items-start justify-between mb-3">
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          {clause.category}
        </span>
        {getSeverityBadge(clause.severity)}
      </div>

      {/* Исходная формулировка */}
      <div className="mb-3 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Исходная формулировка:
        </h3>
        <p className="text-sm text-gray-700 italic">
          "{truncatedClause}"
        </p>
      </div>

      {/* Описание проблемы */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {clause.problemDescription}
        </p>
      </div>

      {/* Тип риска */}
      <div className="mb-3">
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
          {getRiskTypeLabel(clause.riskType)}
        </span>
      </div>

      {/* Теги */}
      {clause.tags && clause.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {clause.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Кнопка подробнее */}
      <button className="mt-auto text-sm text-blue-600 hover:text-blue-800 font-medium">
        Подробнее →
      </button>
    </div>
  );
}

