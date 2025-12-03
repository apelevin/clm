"use client";

import { useState } from "react";
import { KeyProvision, SourceRef, PartyRole } from "@/types/contract";

interface ProvisionCardProps {
  provision: KeyProvision;
  onShowSource: (sourceRefs: SourceRef[]) => void;
  onAnalyzeRisk?: (provision: KeyProvision) => void;
}

export default function ProvisionCard({
  provision,
  onShowSource,
  onAnalyzeRisk,
}: ProvisionCardProps) {
  const handleShowSource = () => {
    if (provision.sourceRefs && provision.sourceRefs.length > 0) {
      onShowSource(provision.sourceRefs);
    }
  };

  const hasSource = provision.sourceRefs && provision.sourceRefs.length > 0;
  const isSecondary = provision.priority === "secondary";
  
  // Гарантируем, что категория всегда есть
  const category = provision.category?.trim() || "прочие условия";

  const getVisibleForLabel = (role?: PartyRole) => {
    switch (role) {
      case "customer":
        return "Заказчик";
      case "executor":
        return "Исполнитель";
      case "both":
        return "Обе стороны";
      default:
        return null;
    }
  };

  // Единые стили для всех карточек (без различий по приоритету)
  const cardPadding = "p-4";
  const borderColor = "border-purple-200";
  const titleSize = "text-lg";
  const contentSize = "text-sm";
  const linkSize = "text-sm";

  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className={`bg-white border ${borderColor} rounded-lg ${cardPadding} shadow-sm hover:shadow-md transition-shadow`}>
      <h3 className={`${titleSize} font-bold text-gray-900 mb-3 break-words`}>
        {provision.title}
      </h3>

      <p className={`${contentSize} font-normal text-gray-600 mb-4 leading-relaxed break-words`}>
        {provision.content}
      </p>

      <div className="flex items-center justify-between">
        {/* Ссылки на пункты договора слева */}
        {provision.relatedClauses && provision.relatedClauses.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {provision.relatedClauses.map((clause, idx) => (
              <span
                key={idx}
                className="text-xs font-normal px-2 py-1 bg-gray-100 text-gray-600 rounded"
              >
                {clause.section}
                {clause.paragraph && `.${clause.paragraph}`}
              </span>
            ))}
          </div>
        )}

        {/* Кнопки справа */}
        <div className="flex items-center gap-4">
          {hasSource ? (
            <button
              onClick={handleShowSource}
              className={`${linkSize} font-normal text-purple-600 hover:text-purple-800 underline`}
            >
              Показать источник
            </button>
          ) : (
            <span className={`${linkSize} font-normal text-gray-400`}>Источник не найден</span>
          )}

          {typeof onAnalyzeRisk === "function" && (
            <button
              onClick={() => onAnalyzeRisk(provision)}
              className={`${linkSize} font-medium text-blue-600 hover:text-blue-800`}
            >
              Проверить риски
            </button>
          )}
          <button
            onClick={() => setIsChecked(!isChecked)}
            className="w-5 h-5 flex items-center justify-center border-2 rounded transition-colors"
            style={{
              borderColor: isChecked ? "#10b981" : "#d1d5db",
              backgroundColor: isChecked ? "#10b981" : "transparent",
            }}
          >
            {isChecked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

