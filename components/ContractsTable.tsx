"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContractListItem } from "@/app/api/contracts/route";

export default function ContractsTable() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [problematicOnly, setProblematicOnly] = useState<boolean>(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/contracts");
      if (!response.ok) {
        throw new Error("Не удалось загрузить список договоров");
      }
      const data = await response.json();
      setContracts(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке договоров:", err);
      setError(err.message || "Произошла ошибка при загрузке");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNames = [
        "янв", "фев", "мар", "апр", "май", "июн",
        "июл", "авг", "сен", "окт", "ноя", "дек"
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month}. ${year} г.`;
    } catch {
      return "—";
    }
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (amount === undefined || amount === null) return "—";
    const formatted = new Intl.NumberFormat("ru-RU").format(amount);
    return `${formatted} ${currency || "RUB"}`;
  };

  const getStageLabel = (stage?: string): string => {
    switch (stage) {
      case "normal":
        return "В норме";
      case "atRisk":
        return "Под риском";
      case "overdue":
        return "Просрочено";
      default:
        return "В норме";
    }
  };

  const getStageColor = (stage?: string): string => {
    switch (stage) {
      case "normal":
        return "bg-green-500";
      case "atRisk":
        return "bg-yellow-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-green-500";
    }
  };

  const getRisksText = (contract: ContractListItem): { text: string; color: string } => {
    if (contract.criticalRisks && contract.criticalRisks > 0) {
      const count = contract.criticalRisks;
      const text = count === 1 ? "1 критический риск" : `${count} критический риск`;
      return { text, color: "text-red-600" };
    }
    if (contract.risks && contract.risks > 0) {
      const count = contract.risks;
      const text = count === 1 ? "1 риск" : `${count} риск`;
      return { text, color: "text-orange-600" };
    }
    return { text: "нет рисков", color: "text-gray-900" };
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Фильтр по стадии
      if (stageFilter !== "all" && contract.stage !== stageFilter) {
        return false;
      }

      // Фильтр по стороне
      if (partyFilter !== "all") {
        if (partyFilter === "customer" && !contract.customer) {
          return false;
        }
        if (partyFilter === "executor" && !contract.executor) {
          return false;
        }
      }

      // Фильтр проблемных договоров
      if (problematicOnly) {
        const isProblematic = contract.hasProblems || 
                              contract.stage === "atRisk" || 
                              contract.stage === "overdue" ||
                              (contract.criticalRisks && contract.criticalRisks > 0) ||
                              (contract.risks && contract.risks > 0);
        if (!isProblematic) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, stageFilter, partyFilter, problematicOnly]);

  const handleRowClick = (contractId: string) => {
    router.push(`/result?contract=${contractId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-base font-normal text-gray-600">Загрузка договоров...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-base font-normal text-red-600">{error}</p>
        <button
          onClick={fetchContracts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Стадия
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все стадии</option>
              <option value="normal">В норме</option>
              <option value="atRisk">Под риском</option>
              <option value="overdue">Просрочено</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сторона / Контрагент
            </label>
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все стороны</option>
              <option value="customer">Заказчик</option>
              <option value="executor">Исполнитель</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={problematicOnly}
                onChange={(e) => setProblematicOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Проблемные договоры
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Таблица */}
      {filteredContracts.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-lg">
          <p className="text-base font-normal text-gray-600">Договоры не найдены</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Номер договора
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Стороны
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Стадия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Риски
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => {
                  const risksInfo = getRisksText(contract);
                  return (
                    <tr
                      key={contract.id}
                      onClick={() => handleRowClick(contract.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {contract.hasProblems && (
                            <svg
                              className="w-5 h-5 text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <div className="text-sm font-semibold text-gray-900">
                            {contract.number || `Договор ${contract.id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-normal text-gray-600">
                          {formatDate(contract.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-normal text-gray-600">
                          {contract.customer && contract.executor ? (
                            <span>
                              {contract.customer} / {contract.executor}
                            </span>
                          ) : contract.customer || contract.executor || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-normal text-gray-900">
                          {formatAmount(contract.amount, contract.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStageColor(contract.stage)}`}></div>
                          <span className="text-sm font-normal text-gray-900">
                            {getStageLabel(contract.stage)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-normal ${risksInfo.color}`}>
                          {risksInfo.text}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
