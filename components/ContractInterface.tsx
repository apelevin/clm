"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { ParsedContract, SourceRef, PartyRole, KeyProvision, ContractStatus, ClauseRiskAnalysis } from "@/types/contract";
import ProvisionCard from "./ProvisionCard";
import PaymentObligationsSection from "./PaymentObligationsSection";
import ContractStatesSection from "./ContractStatesSection";
import StateTasksSection from "./StateTasksSection";
import ObligationsFilters from "./ObligationsFilters";
import RiskAnalysisPanel from "./RiskAnalysisPanel";

interface ContractInterfaceProps {
  contract: ParsedContract;
  onShowSource: (sourceRefs: SourceRef[]) => void;
}

// Функция для автоматического определения категории (дублируем логику из валидатора для клиента)
function inferCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    "сроки": ["срок", "дедлайн", "время", "период", "дата", "до", "не позднее"],
    "оплата": ["оплата", "платеж", "деньги", "сумма", "рубль", "цена", "стоимость", "предоплата", "постоплата"],
    "ответственность": ["ответственность", "штраф", "пеня", "неустойка", "возмещение", "ущерб"],
    "гарантии": ["гарантия", "обеспечение", "залог", "поручительство"],
    "изменение договора": ["изменение", "дополнение", "модификация", "редакция"],
    "интеллектуальная собственность": ["интеллектуальная", "авторское", "право", "лицензия", "патент"],
    "конфиденциальность": ["конфиденциальность", "секрет", "неразглашение", "тайна"],
    "приемка": ["приемка", "принятие", "акт", "подписание акта", "сдача-приемка"],
    "разрешение споров": ["спор", "разрешение", "арбитраж", "суд", "претензия"],
    "расторжение": ["расторжение", "прекращение", "отказ", "аннулирование"],
    "форс-мажор": ["форс-мажор", "обстоятельства", "непреодолимая сила"],
    "электронный документооборот": ["электронный", "документооборот", "эдо", "цифровой"],
    "предмет договора": ["предмет", "услуги", "работы", "товары"],
  };

  let bestMatch = "прочие условия";
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === "прочие условия") continue;
    const matches = keywords.filter((keyword) => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = category;
    }
  }

  return bestMatch;
}

export default function ContractInterface({
  contract,
  onShowSource,
}: ContractInterfaceProps) {
  const { contractState, keyProvisions, paymentObligations, possibleStates } = contract;
  
  // Добавляем состояние "Проект договора" по умолчанию, если его нет
  const statesWithDraft = useMemo(() => {
    const draftStateId = "draft";
    const hasDraft = possibleStates.some(
      (state) => state.id === draftStateId || state.label.toLowerCase().includes("проект")
    );
    
    if (!hasDraft) {
      const draftState: ContractStatus = {
        id: draftStateId,
        label: "Проект договора",
        description: "Договор находится в стадии подготовки/согласования",
        sourceRefs: [],
        tasks: undefined,
      };
      return [draftState, ...possibleStates];
    }
    
    return possibleStates;
  }, [possibleStates]);
  
  // Нормализуем provisions, гарантируя наличие категории
  const normalizedProvisions = useMemo(() => {
    return keyProvisions.map((provision) => {
      let category = provision.category?.trim();
      if (!category || category === "" || category === "null" || category === "undefined") {
        const title = provision.title || "";
        const content = provision.content || "";
        if (title || content) {
          category = inferCategory(title, content);
        } else {
          category = "прочие условия";
        }
      }
      return {
        ...provision,
        category: category || "прочие условия",
      };
    });
  }, [keyProvisions]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedParties, setSelectedParties] = useState<Set<PartyRole>>(
    new Set<PartyRole>(["customer", "executor", "both"])
  );
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateStartDate, setStateStartDate] = useState<Date | null>(null); // Дата наступления стадии
  const [selectedProvisionForRisk, setSelectedProvisionForRisk] = useState<KeyProvision | null>(null);
  const [provisionRiskResult, setProvisionRiskResult] = useState<ClauseRiskAnalysis | null>(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Инициализируем выбранное состояние: draft по умолчанию или из sessionStorage
  useEffect(() => {
    if (statesWithDraft.length > 0 && !selectedState) {
      if (typeof window !== "undefined") {
        const savedState = sessionStorage.getItem("contractSelectedState");
        if (savedState && statesWithDraft.some((s) => s.id === savedState)) {
          setSelectedState(savedState);
        } else {
          // Выбираем draft по умолчанию
          const draftState = statesWithDraft.find((s) => s.id === "draft");
          setSelectedState(draftState ? draftState.id : statesWithDraft[0].id);
        }
      } else {
        // На сервере выбираем draft или первое состояние
        const draftState = statesWithDraft.find((s) => s.id === "draft");
        setSelectedState(draftState ? draftState.id : statesWithDraft[0].id);
      }
    }
  }, [statesWithDraft, selectedState]); // Зависимость от statesWithDraft

  // Инициализируем дату наступления стадии текущей датой при выборе состояния
  useEffect(() => {
    if (selectedState) {
      // Если состояние выбрано, но дата еще не установлена, устанавливаем текущую дату
      if (!stateStartDate) {
        setStateStartDate(new Date());
      }
    } else {
      // Если состояние не выбрано, сбрасываем дату
      setStateStartDate(null);
    }
  }, [selectedState]); // Зависимость только от selectedState

  // Сохраняем выбранное состояние в sessionStorage при изменении
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedState) {
        sessionStorage.setItem("contractSelectedState", selectedState);
      } else {
        sessionStorage.removeItem("contractSelectedState");
      }
    }
  }, [selectedState]);

  // Функция для проверки релевантности элемента выбранному состоянию
  const isRelevantToSelectedState = useCallback(
    (sourceRefs: SourceRef[]): boolean => {
      if (!selectedState) {
        return true; // Если состояние не выбрано, показываем все
      }

      // Для состояния "Проект договора" (draft) всегда показываем все обязательства
      if (selectedState === "draft") {
        return true;
      }

      // Получаем параграфы из выбранного состояния
      const selectedStateObj = statesWithDraft.find((s) => s.id === selectedState);
      if (!selectedStateObj) {
        return true;
      }

      const selectedStateParagraphs = new Set<string>();
      selectedStateObj.sourceRefs.forEach((ref) => {
        if (ref.paragraphIds) {
          ref.paragraphIds.forEach((pid) => selectedStateParagraphs.add(pid));
        }
      });

      if (selectedStateParagraphs.size === 0) {
        return true; // Если у выбранного состояния нет параграфов, показываем все
      }

      // Проверяем, есть ли пересечение параграфов
      for (const ref of sourceRefs) {
        if (ref.paragraphIds) {
          for (const pid of ref.paragraphIds) {
            if (selectedStateParagraphs.has(pid)) {
              return true; // Есть пересечение - элемент релевантен
            }
          }
        }
      }

      return false; // Нет пересечения - элемент не релевантен
    },
    [selectedState, statesWithDraft]
  );

  const primaryProvisions = useMemo(() => {
    return normalizedProvisions.filter((provision) => provision.priority !== "secondary");
  }, [normalizedProvisions]);

  const secondaryProvisions = useMemo(() => {
    return normalizedProvisions.filter((provision) => provision.priority === "secondary");
  }, [normalizedProvisions]);

  // Получаем все уникальные категории из положений
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    normalizedProvisions.forEach((provision) => {
      // Категория теперь всегда есть, но на всякий случай проверяем
      const category = provision.category || "прочие условия";
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [normalizedProvisions]);

  // Фильтруем положения по выбранной категории, сторонам и состояниям
  const filteredPrimaryProvisions = useMemo(() => {
    let filtered = primaryProvisions;

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(
        (provision) => provision.category === selectedCategory
      );
    }

    // Фильтр по сторонам
    filtered = filtered.filter((provision) => {
      const visibleFor = provision.visibleFor || "both";
      return selectedParties.has(visibleFor);
    });

    // Фильтр по выбранному состоянию
    if (selectedState) {
      filtered = filtered.filter((provision) =>
        isRelevantToSelectedState(provision.sourceRefs)
      );
    }

    return filtered;
  }, [primaryProvisions, selectedCategory, selectedParties, selectedState, isRelevantToSelectedState]);

  const filteredSecondaryProvisions = useMemo(() => {
    let filtered = secondaryProvisions;

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(
        (provision) => provision.category === selectedCategory
      );
    }

    // Фильтр по сторонам
    filtered = filtered.filter((provision) => {
      const visibleFor = provision.visibleFor || "both";
      return selectedParties.has(visibleFor);
    });

    // Фильтр по выбранному состоянию
    if (selectedState) {
      filtered = filtered.filter((provision) =>
        isRelevantToSelectedState(provision.sourceRefs)
      );
    }

    return filtered;
  }, [secondaryProvisions, selectedCategory, selectedParties, selectedState, isRelevantToSelectedState]);

  const handlePartyToggle = (party: PartyRole) => {
    setSelectedParties((prev) => {
      const newSet = new Set<PartyRole>(prev);
      if (newSet.has(party)) {
        newSet.delete(party);
        // Если все сняты, включаем все обратно
        if (newSet.size === 0) {
          return new Set<PartyRole>(["customer", "executor", "both"]);
        }
      } else {
        newSet.add(party);
      }
      return newSet;
    });
  };

  const handleStateChange = (stateId: string | null) => {
    setSelectedState(stateId);
  };

  const handleAnalyzeRisk = async (provision: KeyProvision) => {
    try {
      setSelectedProvisionForRisk(provision);
      setProvisionRiskResult(null);
      setRiskError(null);
      setIsRiskLoading(true);

      const response = await fetch("/api/analyze-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clauseText: provision.content || "",
          fullContract: contract, // Передаем полный договор для анализа зависимостей
          provisionId: provision.id,
          provisionCategory: provision.category,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось выполнить анализ рисков");
      }

      const data: ClauseRiskAnalysis = await response.json();
      setProvisionRiskResult(data);
    } catch (error: any) {
      console.error("Ошибка анализа рисков:", error);
      setRiskError(error?.message || "Не удалось выполнить анализ рисков");
    } finally {
      setIsRiskLoading(false);
    }
  };

  const handleCloseRiskPanel = () => {
    setSelectedProvisionForRisk(null);
    setProvisionRiskResult(null);
    setRiskError(null);
    setIsRiskLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6 space-y-8">
        {/* 1. Договор */}
        {(contractState.number || contractState.date || contractState.city || contractState.totalAmount) && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Договор</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-2 text-sm">
                {contractState.number && (
                  <div>
                    <span className="font-medium">Номер:</span> {contractState.number}
                  </div>
                )}
                {contractState.date && (
                  <div>
                    <span className="font-medium">Дата:</span> {contractState.date}
                  </div>
                )}
                {contractState.city && (
                  <div>
                    <span className="font-medium">Город:</span> {contractState.city}
                  </div>
                )}
                {contractState.totalAmount && 
                 contractState.totalAmount.amount != null && (
                  <div className="mt-4">
                    <span className="font-medium">Сумма:</span>{" "}
                    {typeof contractState.totalAmount.amount === 'number' 
                      ? contractState.totalAmount.amount.toLocaleString("ru-RU")
                      : contractState.totalAmount.amount}{" "}
                    {contractState.totalAmount.currency || "RUB"}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 2. Стороны */}
        {contractState.parties && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Стороны</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                {contractState.parties.customer && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Заказчик</h3>
                    <p className="text-gray-700">{contractState.parties.customer.fullName}</p>
                    {contractState.parties.customer.name && (
                      <p className="text-sm text-gray-500">{contractState.parties.customer.name}</p>
                    )}
                  </div>
                )}
                {contractState.parties.executor && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Исполнитель</h3>
                    <p className="text-gray-700">{contractState.parties.executor.fullName}</p>
                    {contractState.parties.executor.name && (
                      <p className="text-sm text-gray-500">{contractState.parties.executor.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 3. Состояние */}
        {statesWithDraft && statesWithDraft.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Состояние</h2>
            <ContractStatesSection
              states={statesWithDraft}
              selectedState={selectedState}
              onStateChange={handleStateChange}
              onShowSource={onShowSource}
              stateStartDate={stateStartDate}
              onStateStartDateChange={setStateStartDate}
            />
            {selectedState && (() => {
              const selectedStateObj = statesWithDraft.find((s) => s.id === selectedState);
              if (selectedStateObj && selectedStateObj.tasks && selectedStateObj.tasks.length > 0) {
                return (
                  <StateTasksSection
                    stateLabel={selectedStateObj.label}
                    tasks={selectedStateObj.tasks}
                    onShowSource={onShowSource}
                    stateStartDate={stateStartDate}
                  />
                );
              }
              return null;
            })()}
          </section>
        )}

        {/* 4. Предмет */}
        {contractState.subject && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Предмет</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed">{contractState.subject}</p>
            </div>
          </section>
        )}

        {/* 5. Финансы */}
        {paymentObligations && paymentObligations.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Финансы</h2>
            <PaymentObligationsSection
              obligations={paymentObligations}
              onShowSource={onShowSource}
            />
          </section>
        )}

        {/* 6. Обязательства */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Обязательства</h2>
          {/* Фильтры обязательств */}
          {allCategories.length > 0 && (
            <ObligationsFilters
              allCategories={allCategories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedParties={selectedParties}
              onPartyToggle={handlePartyToggle}
            />
          )}
          {keyProvisions.length > 0 ? (
            <>
              {/* Основные положения */}
              {filteredPrimaryProvisions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {filteredPrimaryProvisions.map((provision) => (
                    <ProvisionCard
                      key={provision.id}
                      provision={provision}
                      onShowSource={onShowSource}
                      onAnalyzeRisk={handleAnalyzeRisk}
                    />
                  ))}
                </div>
              )}

              {/* Второстепенные положения */}
              {filteredSecondaryProvisions.length > 0 && (
                <>
                  {filteredPrimaryProvisions.length > 0 && (
                    <div className="my-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Прочие обязательства</h3>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSecondaryProvisions.map((provision) => (
                      <ProvisionCard
                        key={provision.id}
                        provision={provision}
                        onShowSource={onShowSource}
                        onAnalyzeRisk={handleAnalyzeRisk}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Сообщение, если ничего не найдено после фильтрации */}
              {(selectedCategory || selectedParties.size < 3) &&
                filteredPrimaryProvisions.length === 0 &&
                filteredSecondaryProvisions.length === 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    Не найдено обязательств по выбранным фильтрам
                  </div>
                )}
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              Не найдено обязательств по договору
            </div>
          )}
        </section>

        {/* 7. Согласование */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Согласование</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="text-gray-600">Функционал согласования в разработке</p>
          </div>
        </section>
      </div>

      {/* Боковая панель анализа рисков по обязательству */}
      {selectedProvisionForRisk && (
        <RiskAnalysisPanel
          provision={selectedProvisionForRisk}
          riskResult={provisionRiskResult}
          onClose={handleCloseRiskPanel}
          isLoading={isRiskLoading}
          error={riskError}
        />
      )}

    </div>
  );
}


