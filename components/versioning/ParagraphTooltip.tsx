"use client";

interface ParagraphTooltipProps {
  reason: string;
  changeId?: string;
  riskId?: string;
  onShowComparison: () => void;
  onShowRisk: () => void;
}

export default function ParagraphTooltip({
  reason,
  changeId,
  riskId,
  onShowComparison,
  onShowRisk,
}: ParagraphTooltipProps) {
  return (
    <div className="absolute z-10 left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="text-xs text-gray-600 mb-2">
        {reason}
      </div>
      <div className="flex flex-col gap-1">
        {changeId && (
          <button
            onClick={onShowComparison}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            Показать сравнение
          </button>
        )}
        {riskId && (
          <button
            onClick={onShowRisk}
            className="text-xs text-orange-600 hover:text-orange-800 hover:underline text-left"
          >
            Перейти к риску
          </button>
        )}
      </div>
    </div>
  );
}

