"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import RisksSummary from "@/components/RisksSummary";
import RisksTable from "@/components/RisksTable";
import RiskAnalysisPanel from "@/components/RiskAnalysisPanel";
import { RiskListItem } from "@/app/api/risks/route";
import { KeyProvision, ClauseRiskAnalysis } from "@/types/contract";

export default function RisksPage() {
  const router = useRouter();
  const [risks, setRisks] = useState<RiskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>("all");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [riskTypeFilter, setRiskTypeFilter] = useState<string>("all");
  const [newOnly, setNewOnly] = useState<boolean>(false);

  // Боковая панель
  const [selectedRisk, setSelectedRisk] = useState<RiskListItem | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<ClauseRiskAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [provision, setProvision] = useState<KeyProvision | null>(null);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/risks");
      if (!response.ok) {
        throw new Error("Не удалось загрузить список рисков");
      }
      const data = await response.json();
      setRisks(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке рисков:", err);
      setError(err.message || "Произошла ошибка при загрузке");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRiskAnalysis = async (risk: RiskListItem) => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    
    try {
      // Загружаем договор
      const contractResponse = await fetch(`/api/contracts/${risk.contractId}`);
      if (!contractResponse.ok) {
        throw new Error("Договор не найден");
      }
      const contract = await contractResponse.json();
      
      // Находим положение
      const provisionData = contract.keyProvisions?.find(
        (p: KeyProvision) => p.id === risk.provisionId
      );
      
      if (!provisionData) {
        throw new Error("Положение не найдено");
      }
      
      setProvision(provisionData);
      
      // Загружаем анализ риска
      const analysisResponse = await fetch("/api/analyze-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clauseText: provisionData.content,
          provisionId: provisionData.id,
          provisionCategory: provisionData.category,
          fullContract: contract,
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error("Не удалось загрузить анализ риска");
      }
      
      const analysisData = await analysisResponse.json();
      setRiskAnalysis(analysisData);
    } catch (err: any) {
      console.error("Ошибка при загрузке анализа риска:", err);
      setAnalysisError(err.message || "Произошла ошибка");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleRiskClick = (risk: RiskListItem) => {
    setSelectedRisk(risk);
    fetchRiskAnalysis(risk);
  };

  const handleClosePanel = () => {
    setSelectedRisk(null);
    setRiskAnalysis(null);
    setProvision(null);
    setAnalysisError(null);
  };

  const handleFilterClick = (filter: { type: string; value: any }) => {
    switch (filter.type) {
      case "critical":
        setRiskLevelFilter("critical");
        break;
      case "high":
        setRiskLevelFilter("high");
        break;
      case "open":
        setStatusFilter("open");
        break;
      case "new":
        setNewOnly(true);
        break;
    }
  };

  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      // Фильтр по статусу
      if (statusFilter !== "all" && risk.status !== statusFilter) {
        return false;
      }

      // Фильтр по критичности
      if (riskLevelFilter !== "all" && risk.riskLevel !== riskLevelFilter) {
        return false;
      }

      // Фильтр по договору
      if (contractFilter !== "all" && risk.contractId !== contractFilter && risk.contractNumber !== contractFilter) {
        return false;
      }

      // Фильтр по контрагенту
      if (counterpartyFilter !== "all") {
        const matchesCustomer = risk.customer?.toLowerCase().includes(counterpartyFilter.toLowerCase());
        const matchesExecutor = risk.executor?.toLowerCase().includes(counterpartyFilter.toLowerCase());
        if (!matchesCustomer && !matchesExecutor) {
          return false;
        }
      }

      // Фильтр по стороне
      if (partyFilter !== "all" && risk.affectedParty !== partyFilter) {
        return false;
      }

      // Фильтр по типу риска
      if (riskTypeFilter !== "all" && risk.riskType !== riskTypeFilter) {
        return false;
      }

      // Фильтр новых рисков
      if (newOnly && !risk.isNew) {
        return false;
      }

      return true;
    });
  }, [risks, statusFilter, riskLevelFilter, contractFilter, counterpartyFilter, partyFilter, riskTypeFilter, newOnly]);

  // Получаем уникальные значения для фильтров
  const contracts = useMemo(() => {
    const unique = new Set<string>();
    risks.forEach((r) => {
      if (r.contractNumber) unique.add(r.contractNumber);
      else unique.add(r.contractId);
    });
    return Array.from(unique).sort();
  }, [risks]);

  const counterparties = useMemo(() => {
    const unique = new Set<string>();
    risks.forEach((r) => {
      if (r.customer) unique.add(r.customer);
      if (r.executor) unique.add(r.executor);
    });
    return Array.from(unique).sort();
  }, [risks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeItem="risks" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-base font-normal text-gray-600">Загрузка рисков...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeItem="risks" />
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
      <Sidebar activeItem="risks" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Реестр рисков
          </h1>
          <p className="text-gray-600">
            Общий обзор всех рисков по договорам портфеля
          </p>
        </div>

        {/* Сводка рисков */}
        <RisksSummary risks={risks} onFilterClick={handleFilterClick} />

        {/* Фильтры */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус риска
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все</option>
                <option value="open">Открыт</option>
                <option value="confirmed">Подтверждён</option>
                <option value="disputed">Спорный</option>
                <option value="closed">Закрыт</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Критичность
              </label>
              <select
                value={riskLevelFilter}
                onChange={(e) => setRiskLevelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все</option>
                <option value="critical">Критический</option>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Договор
              </label>
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все договоры</option>
                {contracts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Контрагент
              </label>
              <select
                value={counterpartyFilter}
                onChange={(e) => setCounterpartyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все контрагенты</option>
                {counterparties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сторона
              </label>
              <select
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все стороны</option>
                <option value="customer">Заказчик</option>
                <option value="executor">Исполнитель</option>
                <option value="both">Обе стороны</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип риска
              </label>
              <select
                value={riskTypeFilter}
                onChange={(e) => setRiskTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все типы</option>
                <option value="неопределённость">Неопределённость</option>
                <option value="дисбаланс">Дисбаланс</option>
                <option value="неправомерность">Неправомерность</option>
                <option value="процедурный">Процедурный</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newOnly}
                  onChange={(e) => setNewOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Показать только новые (7 дней)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Таблица рисков */}
        <RisksTable risks={filteredRisks} onRiskClick={handleRiskClick} />

        {/* Боковая панель анализа риска */}
        {selectedRisk && provision && (
          <RiskAnalysisPanel
            provision={provision}
            riskResult={riskAnalysis}
            onClose={handleClosePanel}
            isLoading={isLoadingAnalysis}
            error={analysisError}
            contractNumber={selectedRisk.contractNumber}
          />
        )}
        </div>
      </div>
    </div>
  );
}

