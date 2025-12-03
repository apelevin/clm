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
      ? "bg-blue-200 text-blue-900"
      : "bg-green-200 text-green-900";
  };

  const handleShowSource = (obligation: PaymentObligation) => {
    if (obligation.sourceRefs && obligation.sourceRefs.length > 0) {
      onShowSource(obligation.sourceRefs);
    }
  };

  return (
    <div className="space-y-4">
      {obligations.map((obligation) => {
        const hasSource = obligation.sourceRefs && obligation.sourceRefs.length > 0;
        const scheduleText = formatSchedule(obligation.schedule);

        return (
          <div
            key={obligation.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Верхняя часть: Плательщик → Получатель и Сумма */}
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${getPartyColorClasses(
                    obligation.payer
                  )}`}
                >
                  {getPartyLabel(obligation.payer)}
                </span>
                <span className="text-gray-500 text-sm">→</span>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${getPartyColorClasses(
                    obligation.recipient
                  )}`}
                >
                  {getPartyLabel(obligation.recipient)}
                </span>
              </div>
              <div className="text-right flex-shrink min-w-0">
                <span className="text-base font-bold font-mono text-gray-900 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {formatAmount(obligation.amount)}
                </span>
              </div>
            </div>

            {/* Описание обязательства */}
            {obligation.purpose && (
              <p className="text-base font-normal text-gray-900 leading-relaxed break-words mb-3">
                {obligation.purpose}
              </p>
            )}

            {/* Нижняя часть: График и условия */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {scheduleText && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">График:</span>
                  <span className="text-sm font-normal text-gray-900 flex-1 break-words min-w-0">{scheduleText}</span>
                </div>
              )}
              
              {obligation.schedule?.type === "installments" &&
                obligation.schedule.installments &&
                obligation.schedule.installments.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                      Подробнее о платежах
                    </summary>
                    <div className="mt-2 space-y-1.5 pl-4">
                      {obligation.schedule.installments.map((inst, idx) => (
                        <div key={idx} className="text-xs font-normal text-gray-900 break-words">
                          Платеж {inst.number}:{" "}
                          <span className="font-mono font-semibold">
                            {inst.amount.toLocaleString("ru-RU")} {obligation.amount.currency}
                          </span>
                          {inst.deadline ? ` до ${inst.deadline}` : ""}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

              {obligation.conditions && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">Условия:</span>
                  <span className="text-sm font-normal text-gray-900 flex-1 break-words min-w-0">{obligation.conditions}</span>
                </div>
              )}

              {obligation.relatedClauses && obligation.relatedClauses.length > 0 && (
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">Пункты:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {obligation.relatedClauses.map((clause, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                      >
                        {clause.section}
                        {clause.paragraph && `.${clause.paragraph}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasSource ? (
                <div className="pt-2">
                  <button
                    onClick={() => handleShowSource(obligation)}
                    className="text-sm font-normal text-purple-600 hover:text-purple-800 underline"
                  >
                    Показать источник
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

