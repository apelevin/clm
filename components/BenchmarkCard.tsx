"use client";

import { useState } from "react";
import { BenchmarkComparison } from "@/types/contract";

interface BenchmarkCardProps {
  benchmark: BenchmarkComparison;
}

export default function BenchmarkCard({ benchmark }: BenchmarkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string, score: number) => {
    if (score <= 30) return "❌";
    if (score <= 70) return "⚠️";
    if (status === "present") return "✔️";
    return "~";
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return "bg-red-500";
    if (score <= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score <= 30) return "bg-red-50";
    if (score <= 70) return "bg-yellow-50";
    return "bg-green-50";
  };

  const getBorderColor = (score: number) => {
    if (score <= 30) return "border-red-200";
    if (score <= 70) return "border-yellow-200";
    return "border-green-200";
  };

  const score = benchmark.score ?? (benchmark.status === "present" ? 90 : benchmark.status === "partial" ? 50 : 10);
  const statusIcon = getStatusIcon(benchmark.status, score);
  const recommendationText = benchmark.recommendation ?? "";
  const hasRecommendation = recommendationText.trim().length > 0;

  return (
    <div className={`bg-white border-2 ${getBorderColor(score)} rounded-lg p-4 shadow-sm transition-all hover:shadow-md`}>
      {/* Заголовок с иконкой */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{statusIcon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-gray-900 leading-tight">
            {benchmark.element}
          </h4>
        </div>
      </div>

      {/* Мини-скор и шкала */}
      <div className="mb-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg font-bold text-gray-900">{score}%</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(score)} transition-all duration-500 ease-out`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Описание стандарта */}
      {benchmark.description && (
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {benchmark.description}
        </p>
      )}

      {/* Требование */}
      <p className="text-xs text-gray-600 mb-3">
        <span className="font-medium">Требование:</span> {benchmark.requirement}
      </p>

      {/* Раскрывающийся блок рекомендаций */}
      {hasRecommendation && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors w-full text-left"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Что рекомендуется добавить</span>
          </button>

          {isExpanded && (
            <div className="mt-3 pl-6 border-l-2 border-gray-200">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {recommendationText.split('\n').map((line, lineIdx) => {
                  const trimmedLine = line.trim();
                  if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                    return (
                      <div key={lineIdx} className="mb-1 flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{trimmedLine.substring(1).trim()}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={lineIdx} className="mb-1">{line}</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


