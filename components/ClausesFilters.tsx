"use client";

import { ClauseListItem } from "@/app/api/clauses/route";

interface ClausesFiltersProps {
  searchQuery: string;
  categoryFilter: string;
  riskTypeFilter: string;
  severityFilter: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onRiskTypeChange: (riskType: string) => void;
  onSeverityChange: (severity: string) => void;
  categories: string[];
  riskTypes: string[];
}

export default function ClausesFilters({
  searchQuery,
  categoryFilter,
  riskTypeFilter,
  severityFilter,
  onSearchChange,
  onCategoryChange,
  onRiskTypeChange,
  onSeverityChange,
  categories,
  riskTypes,
}: ClausesFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Поиск */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Поиск по тексту
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Введите текст для поиска..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Категория */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория условия
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Тип риска */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип риска
          </label>
          <select
            value={riskTypeFilter}
            onChange={(e) => onRiskTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все типы</option>
            {riskTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Критичность */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Критичность
          </label>
          <select
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все уровни</option>
            <option value="critical">Критическая</option>
            <option value="high">Высокая</option>
            <option value="medium">Средняя</option>
            <option value="low">Низкая</option>
          </select>
        </div>
      </div>
    </div>
  );
}

