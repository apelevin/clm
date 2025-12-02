"use client";

import { PaymentObligation, SourceRef } from "@/types/contract";

interface PaymentObligationsSectionProps {
  obligations: PaymentObligation[];
  onShowSource: (sourceRefs: SourceRef[]) => void;
}

export default function PaymentObligationsSection({
  obligations,
  onShowSource,
}: PaymentObligationsSectionProps) {
  if (obligations.length === 0) {
    return null;
  }

  const formatAmount = (amount: PaymentObligation["amount"]) => {
    if (amount.type === "percentage") {
      return `${amount.value}%${amount.formula ? ` (${amount.formula})` : ""}`;
    }
    if (amount.type === "calculated" && amount.formula) {
      return amount.formula;
    }
    return `${amount.value.toLocaleString("ru-RU")} ${amount.currency}`;
  };

  const formatSchedule = (schedule: PaymentObligation["schedule"]) => {
    if (!schedule) return null;

    switch (schedule.type) {
      case "one-time":
        return schedule.deadline ? schedule.deadline : null;
      case "installments":
        if (schedule.installments && schedule.installments.length > 0) {
          return `${schedule.installments.length} платеж(ей)`;
        }
        return schedule.deadline ? schedule.deadline : null;
      case "milestone":
        return schedule.dates && schedule.dates.length > 0
          ? `По этапам: ${schedule.dates.length}`
          : schedule.deadline
          ? schedule.deadline
          : null;
      case "periodic":
        return schedule.period
          ? `${schedule.period}${schedule.deadline ? `, до ${schedule.deadline}` : ""}`
          : schedule.deadline
          ? schedule.deadline
          : null;
      default:
        return null;
    }
  };

  const getPartyLabel = (party: "customer" | "executor") => {
    return party === "customer" ? "Заказчик" : "Исполнитель";
  };

  const getPartyColorClasses = (party: "customer" | "executor") => {
    return party === "customer"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  };

  const handleShowSource = (obligation: PaymentObligation) => {
    if (obligation.sourceRefs && obligation.sourceRefs.length > 0) {
      onShowSource(obligation.sourceRefs);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Финансовые обязательства</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Плательщик → Получатель
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Назначение
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Сумма
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                График платежей
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Условия
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Пункты договора
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {obligations.map((obligation) => {
              const hasSource = obligation.sourceRefs && obligation.sourceRefs.length > 0;
              const scheduleText = formatSchedule(obligation.schedule);

              return (
                <tr
                  key={obligation.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getPartyColorClasses(
                          obligation.payer
                        )}`}
                      >
                        {getPartyLabel(obligation.payer)}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getPartyColorClasses(
                          obligation.recipient
                        )}`}
                      >
                        {getPartyLabel(obligation.recipient)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {obligation.purpose}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">
                      {formatAmount(obligation.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {scheduleText || (
                      <span className="text-gray-400">Не указано</span>
                    )}
                    {obligation.schedule?.type === "installments" &&
                      obligation.schedule.installments &&
                      obligation.schedule.installments.length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                            Подробнее
                          </summary>
                          <div className="mt-2 space-y-1 pl-2">
                            {obligation.schedule.installments.map((inst, idx) => (
                              <div key={idx} className="text-xs text-gray-600">
                                Платеж {inst.number}:{" "}
                                {inst.amount.toLocaleString("ru-RU")}{" "}
                                {inst.deadline ? `до ${inst.deadline}` : ""}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {obligation.conditions || (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {obligation.relatedClauses &&
                    obligation.relatedClauses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {obligation.relatedClauses.map((clause, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {clause.section}
                            {clause.paragraph && `.${clause.paragraph}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasSource ? (
                      <button
                        onClick={() => handleShowSource(obligation)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Показать источник
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

