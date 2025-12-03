"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContractListItem } from "@/app/api/contracts/route";

export default function ContractsTable() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (amount === undefined || amount === null) return "—";
    const formatted = new Intl.NumberFormat("ru-RU").format(amount);
    return `${formatted} ${currency || "RUB"}`;
  };

  const formatLastUpdated = (date?: Date): string => {
    if (!date) return "—";
    try {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          return diffMins < 1 ? "только что" : `${diffMins} мин. назад`;
        }
        return `${diffHours} ч. назад`;
      } else if (diffDays === 1) {
        return "вчера";
      } else if (diffDays < 7) {
        return `${diffDays} дн. назад`;
      } else {
        return date.toLocaleDateString("ru-RU", {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return "—";
    }
  };

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

  if (contracts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-base font-normal text-gray-600">Договоры не найдены</p>
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
                Последнее обновление
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                onClick={() => handleRowClick(contract.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {contract.number || `Договор ${contract.id}`}
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
                  <div className="text-sm font-normal text-gray-500">
                    {formatLastUpdated(contract.lastUpdated)}
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

