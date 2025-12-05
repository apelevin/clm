"use client";

import { RiskListItem } from "@/app/api/risks/route";

interface RisksSummaryProps {
  risks: RiskListItem[];
  onFilterClick?: (filter: {
    type: "critical" | "high" | "open" | "new";
    value: any;
  }) => void;
}

export default function RisksSummary({ risks, onFilterClick }: RisksSummaryProps) {
  const criticalRisks = risks.filter(
    (r) => r.riskLevel === "critical"
  ).length;

  const highRisks = risks.filter(
    (r) => r.riskLevel === "high"
  ).length;

  const openRisks = risks.filter(
    (r) => r.status === "open"
  ).length;

  const newRisks = risks.filter(
    (r) => r.isNew === true
  ).length;

  const cards = [
    {
      label: "Критические риски",
      count: criticalRisks,
      color: "bg-red-50 border-red-200 text-red-800",
      icon: "🔴",
      filter: { type: "critical" as const, value: "critical" },
    },
    {
      label: "Высокие риски",
      count: highRisks,
      color: "bg-orange-50 border-orange-200 text-orange-800",
      icon: "🟠",
      filter: { type: "high" as const, value: "high" },
    },
    {
      label: "Открытые риски",
      count: openRisks,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: "🟡",
      filter: { type: "open" as const, value: "open" },
    },
    {
      label: "Новые за 7 дней",
      count: newRisks,
      color: "bg-blue-50 border-blue-200 text-blue-800",
      icon: "🔔",
      filter: { type: "new" as const, value: true },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => onFilterClick?.(card.filter)}
          className={`${card.color} border rounded-lg p-4 text-left hover:shadow-md transition-all cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium opacity-80 mb-1">
                {card.label}
              </div>
              <div className="text-2xl font-bold">{card.count}</div>
            </div>
            <div className="text-3xl">{card.icon}</div>
          </div>
        </button>
      ))}
    </div>
  );
}


