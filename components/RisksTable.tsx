"use client";

import { RiskListItem } from "@/app/api/risks/route";
import { useRouter } from "next/navigation";

interface RisksTableProps {
  risks: RiskListItem[];
  onRiskClick: (risk: RiskListItem) => void;
}

export default function RisksTable({ risks, onRiskClick }: RisksTableProps) {
  const router = useRouter();

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case "critical":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Критический</span>;
      case "high":
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Высокий</span>;
      case "medium":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Средний</span>;
      case "low":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Низкий</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Открыт</span>;
      case "confirmed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Подтверждён</span>;
      case "disputed":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Спорный</span>;
      case "closed":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Закрыт</span>;
      default:
        return null;
    }
  };

  const getPartyLabel = (party: string) => {
    switch (party) {
      case "customer":
        return "Заказчик";
      case "executor":
        return "Исполнитель";
      case "both":
        return "Обе стороны";
      default:
        return party;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handleContractClick = (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    router.push(`/result?contract=${contractId}`);
  };

  if (risks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">✨</div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Все риски устранены. Отличная работа!
        </p>
        <p className="text-sm text-gray-600">
          В вашем портфеле договоров нет активных рисков.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Риск
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Критичность
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Договор
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Контрагент
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Сторона
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Вероятность спора
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Последнее изменение
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {risks.map((risk) => (
              <tr
                key={risk.id}
                onClick={() => onRiskClick(risk)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 flex items-center gap-1 mt-0.5">
                      {risk.riskLevel === "critical" && (
                        <span className="text-red-500" title="Критический риск">🔥</span>
                      )}
                      {risk.isNew && (
                        <span className="text-blue-500" title="Новый риск">🆕</span>
                      )}
                      {risk.hasDiscussion && (
                        <span className="text-gray-500" title="Есть обсуждение">💬</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">
                        {risk.problematicElement}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {risk.issue}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRiskLevelBadge(risk.riskLevel)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(risk.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => handleContractClick(e, risk.contractId)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {risk.contractNumber || risk.contractId}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {risk.customer && risk.executor ? (
                      <span>{risk.customer} / {risk.executor}</span>
                    ) : risk.customer || risk.executor || "—"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {getPartyLabel(risk.affectedParty)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {risk.disputeProbability}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(risk.lastChanged)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

