"use client";

import { ContractAction, SourceRef } from "@/types/contract";

interface ActionCardProps {
  action: ContractAction;
  onShowSource: (sourceRefs: SourceRef[]) => void;
}

export default function ActionCard({ action, onShowSource }: ActionCardProps) {
  const getVisibleForLabel = (role: string) => {
    switch (role) {
      case "customer":
        return "Заказчик";
      case "executor":
        return "Исполнитель";
      case "both":
        return "Обе стороны";
      default:
        return role;
    }
  };

  const handleShowSource = () => {
    if (action.sourceRefs && action.sourceRefs.length > 0) {
      onShowSource(action.sourceRefs);
    }
  };

  const hasSource = action.sourceRefs && action.sourceRefs.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{action.label}</h3>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
          {getVisibleForLabel(action.visibleFor)}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">{action.description}</p>

      {action.isAvailable !== undefined && (
        <div className="mb-3">
          <span
            className={`text-xs px-2 py-1 rounded ${
              action.isAvailable
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {action.isAvailable ? "Доступно сейчас" : "Недоступно"}
          </span>
        </div>
      )}

      {action.relatedClauses && action.relatedClauses.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {action.relatedClauses.map((clause, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
            >
              {clause.section}
              {clause.paragraph && `.${clause.paragraph}`}
            </span>
          ))}
        </div>
      )}

      {hasSource ? (
        <button
          onClick={handleShowSource}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Показать источник
        </button>
      ) : (
        <span className="text-sm text-gray-400">Источник не найден</span>
      )}
    </div>
  );
}

