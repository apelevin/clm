"use client";

import { useState, memo, useMemo } from "react";
import { KeyProvision, ClauseRiskAnalysis, RiskParty, ProblematicElement } from "@/types/contract";
import ProblematicElementCard from "./ProblematicElementCard";

interface RiskAnalysisPanelProps {
  provision: KeyProvision;
  riskResult: ClauseRiskAnalysis | null;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
  contractNumber?: string;
}

function RiskAnalysisPanel({
  provision,
  riskResult,
  onClose,
  isLoading = false,
  error = null,
  contractNumber,
}: RiskAnalysisPanelProps) {
  const [showSuggestedClause, setShowSuggestedClause] = useState(false);

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case "high":
        return "Высокий риск";
      case "medium":
        return "Средний риск";
      default:
        return "Низкий риск";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getRiskTypeColor = (type: string) => {
    switch (type) {
      case "неопределённость":
        return "bg-blue-100 text-blue-800";
      case "дисбаланс":
        return "bg-orange-100 text-orange-800";
      case "неправомерность":
        return "bg-red-100 text-red-800";
      case "процедурный":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "критичные":
        return "bg-red-100 text-red-800";
      case "средние":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getPartyColor = (party: RiskParty) => {
    switch (party) {
      case "customer":
        return "bg-orange-100 text-orange-800";
      case "executor":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPartyLabel = (party: RiskParty) => {
    switch (party) {
      case "customer":
        return "Заказчик";
      case "executor":
        return "Исполнитель";
      default:
        return "Обе стороны";
    }
  };


  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[600px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Анализ рисков</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Закрыть панель анализа рисков"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-600">
            <p className="text-sm font-normal text-gray-600">
              Анализируем риски формулировки… Это может занять несколько секунд.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[600px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Анализ рисков</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Закрыть панель анализа рисков"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!riskResult) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[600px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Заголовок */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10">
        <div className="flex-1 mr-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{provision.title}</h2>
          {riskResult.summary && (
            <p className="text-sm font-normal text-gray-900 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              {riskResult.summary}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Закрыть панель анализа рисков"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* 1. Индикаторы риска (мини-дашборд) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Индикаторы риска</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Уровень риска</div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(riskResult.indicators.riskLevel)}`}>
                {getRiskLevelLabel(riskResult.indicators.riskLevel)}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Тип риска</div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRiskTypeColor(riskResult.indicators.riskType)}`}>
                {riskResult.indicators.riskType}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Вероятность спора</div>
              <div className="text-sm font-semibold text-gray-900">{riskResult.indicators.disputeProbability}%</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Сложность последствий</div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(riskResult.indicators.consequenceSeverity)}`}>
                {riskResult.indicators.consequenceSeverity}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Юридическая карта риска */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Юридическая карта риска</h3>
          
          {/* Проблемные элементы */}
          {riskResult.legalRiskMap.problematicElements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Проблемные элементы в формулировке</h4>
              <ul className="space-y-2">
                {riskResult.legalRiskMap.problematicElements.map((element, idx) => {
                  // Генерируем уникальный ID для элемента, если его нет
                  const elementWithId: ProblematicElement = {
                    ...element,
                    id: element.id || `${provision.id}_element_${idx}`,
                  };
                  return (
                    <ProblematicElementCard
                      key={elementWithId.id || idx}
                      element={elementWithId}
                      provisionId={provision.id}
                      index={idx}
                      contractNumber={contractNumber}
                    />
                  );
                })}
              </ul>
            </div>
          )}

          {/* Последствия */}
          {riskResult.legalRiskMap.consequences.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Что может случиться</h4>
              <ul className="space-y-2">
                {riskResult.legalRiskMap.consequences.map((consequence, idx) => (
                  <li key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-normal text-gray-900 flex-1">{consequence.description}</div>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getPartyColor(consequence.affectedParty)}`}>
                        {getPartyLabel(consequence.affectedParty)}
                      </span>
                    </div>
                    {consequence.probability !== undefined && (
                      <div className="text-xs text-gray-600">Вероятность: {consequence.probability}%</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI-оценка вероятности конфликта */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">AI-оценка вероятности конфликта</div>
            <div className="text-lg font-semibold text-blue-900">{riskResult.legalRiskMap.conflictProbability}%</div>
          </div>
        </div>

        {/* 3. Рекомендованная формулировка */}
        <div>
          <button
            onClick={() => setShowSuggestedClause(!showSuggestedClause)}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
          >
            <span>{showSuggestedClause ? "Скрыть" : "Показать"} улучшенный вариант</span>
            <svg
              className={`w-4 h-4 transition-transform ${showSuggestedClause ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSuggestedClause && (
            <div className="mt-3 space-y-3">
              {riskResult.differences && riskResult.differences.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Краткие отличия:</h4>
                  <ul className="space-y-1">
                    {riskResult.differences.map((diff, idx) => (
                      <li key={idx} className="text-sm font-normal text-gray-900">• {diff}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Рекомендованная формулировка:</h4>
                <p className="text-sm font-normal text-gray-900 whitespace-pre-line leading-relaxed">
                  {riskResult.suggestedClause}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Impact-анализ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Impact-анализ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Если оставить как есть →</h4>
              <ul className="space-y-1">
                {riskResult.impactAnalysis.ifLeftAsIs.map((item, idx) => (
                  <li key={idx} className="text-xs font-normal text-gray-900">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Если исправить →</h4>
              <ul className="space-y-1">
                {riskResult.impactAnalysis.ifFixed.map((item, idx) => (
                  <li key={idx} className="text-xs font-normal text-gray-900">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>



        {/* 7. Мини-таймлайн событий */}
        {riskResult.timeline.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Мини-таймлайн событий</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                {riskResult.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-16 text-sm font-medium text-gray-700">
                      {event.day >= 0 ? `День ${event.day}` : `День ${event.day}`}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{event.event}</div>
                      {event.description && (
                        <div className="text-xs font-normal text-gray-900 mt-1">{event.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(RiskAnalysisPanel);

