"use client";

import { useMemo } from "react";
import { TaskListItem } from "@/app/api/tasks/route";

interface TasksSummaryProps {
  tasks: TaskListItem[];
  onFilterClick?: (filter: {
    type: "overdue" | "awaitingAction" | "inProgress" | "completed";
    value: any;
  }) => void;
}

export default function TasksSummary({ tasks, onFilterClick }: TasksSummaryProps) {
  const stats = useMemo(() => {
    const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
    const awaitingActionTasks = tasks.filter((t) => t.status === "awaitingAction").length;
    const inProgressTasks = tasks.filter((t) => t.status === "inProgress").length;
    
    // Завершено за последние 7 дней
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const completedTasks = tasks.filter((t) => {
      if (t.status !== "completed") return false;
      if (!t.lastChanged) return false;
      return new Date(t.lastChanged).getTime() > sevenDaysAgo;
    }).length;

    return { overdueTasks, awaitingActionTasks, inProgressTasks, completedTasks };
  }, [tasks]);

  const { overdueTasks, awaitingActionTasks, inProgressTasks, completedTasks } = stats;

  const cards = [
    {
      label: "Просрочено",
      count: overdueTasks,
      color: "bg-red-50 border-red-200 text-red-800",
      icon: "🔴",
      filter: { type: "overdue" as const, value: "overdue" },
    },
    {
      label: "Ожидают действий",
      count: awaitingActionTasks,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: "🟡",
      filter: { type: "awaitingAction" as const, value: "awaitingAction" },
    },
    {
      label: "В работе",
      count: inProgressTasks,
      color: "bg-blue-50 border-blue-200 text-blue-800",
      icon: "🔵",
      filter: { type: "inProgress" as const, value: "inProgress" },
    },
    {
      label: "Завершено (7 дней)",
      count: completedTasks,
      color: "bg-green-50 border-green-200 text-green-800",
      icon: "✅",
      filter: { type: "completed" as const, value: "completed" },
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
