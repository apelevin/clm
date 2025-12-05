"use client";

import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import ClausesFilters from "@/components/ClausesFilters";
import ClausesGrid from "@/components/ClausesGrid";
import ClauseDetailsPanel from "@/components/ClauseDetailsPanel";
import { ClauseListItem } from "@/app/api/clauses/route";

export default function ClausesPage() {
  const [clauses, setClauses] = useState<ClauseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [riskTypeFilter, setRiskTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Боковая панель
  const [selectedClause, setSelectedClause] = useState<ClauseListItem | null>(null);

  useEffect(() => {
    fetchClauses();
  }, []);

  const fetchClauses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/clauses");
      if (!response.ok) {
        throw new Error("Не удалось загрузить список формулировок");
      }
      const data = await response.json();
      setClauses(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке формулировок:", err);
      setError(err.message || "Произошла ошибка при загрузке");
      setClauses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClauseClick = (clause: ClauseListItem) => {
    setSelectedClause(clause);
  };

  const handleClosePanel = () => {
    setSelectedClause(null);
  };

  const filteredClauses = useMemo(() => {
    return clauses.filter((clause) => {
      // Поиск по тексту
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          clause.originalClause.toLowerCase().includes(query) ||
          clause.problemDescription.toLowerCase().includes(query) ||
          clause.aiRecommendation.toLowerCase().includes(query) ||
          clause.category.toLowerCase().includes(query) ||
          clause.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) {
          return false;
        }
      }

      // Фильтр по категории
      if (categoryFilter !== "all" && clause.category !== categoryFilter) {
        return false;
      }

      // Фильтр по типу риска
      if (riskTypeFilter !== "all" && clause.riskType !== riskTypeFilter) {
        return false;
      }

      // Фильтр по критичности
      if (severityFilter !== "all" && clause.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [clauses, searchQuery, categoryFilter, riskTypeFilter, severityFilter]);

  // Получаем уникальные значения для фильтров
  const categories = useMemo(() => {
    const unique = new Set<string>();
    clauses.forEach((c) => {
      unique.add(c.category);
    });
    return Array.from(unique).sort();
  }, [clauses]);

  const riskTypes = useMemo(() => {
    const unique = new Set<string>();
    clauses.forEach((c) => {
      unique.add(c.riskType);
    });
    return Array.from(unique).sort();
  }, [clauses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeItem="clauses" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-base font-normal text-gray-600">Загрузка формулировок...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeItem="clauses" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeItem="clauses" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Формулировки
            </h1>
            <p className="text-gray-600">
              Библиотека типичных юридических конструкций и проблемных формулировок
            </p>
          </div>

          {/* Фильтры */}
          <ClausesFilters
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            riskTypeFilter={riskTypeFilter}
            severityFilter={severityFilter}
            onSearchChange={setSearchQuery}
            onCategoryChange={setCategoryFilter}
            onRiskTypeChange={setRiskTypeFilter}
            onSeverityChange={setSeverityFilter}
            categories={categories}
            riskTypes={riskTypes}
          />

          {/* Сетка формулировок */}
          <ClausesGrid
            clauses={filteredClauses}
            onClauseClick={handleClauseClick}
          />

          {/* Боковая панель деталей формулировки */}
          {selectedClause && (
            <ClauseDetailsPanel
              clause={selectedClause}
              onClose={handleClosePanel}
            />
          )}
        </div>
      </div>
    </div>
  );
}


