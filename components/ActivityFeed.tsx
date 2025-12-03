"use client";

import { useState, useEffect, useMemo } from "react";
import { ActivityLogEntry } from "@/types/contract";
import { getActivityLogs } from "@/lib/activity-logger";

interface ActivityFeedProps {
  contractNumber?: string;
}

function formatActivityDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDate.getTime() === today.getTime()) {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) {
      return "только что";
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "минуту" : diffMins < 5 ? "минуты" : "минут"} назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`;
    }
    return "сегодня";
  } else if (entryDate.getTime() === yesterday.getTime()) {
    return "вчера";
  } else {
    // Формат как на картинке: "Dec 3", "Dec 1"
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function getActivityIcon(entry: ActivityLogEntry): { icon: string; color: string } {
  // Определяем иконку и цвет на основе типа действия
  const defaultIcon = "●";
  
  switch (entry.type) {
    case "execution_status_posted":
      return { icon: "●", color: entry.color || "red" };
    case "execution_status_comment_added":
      return { icon: "●", color: entry.color || "green" };
    case "contract_status_changed":
    case "risk_status_changed":
    case "obligation_marked_completed":
    case "obligation_marked_overdue":
      return { icon: "○", color: entry.color || "orange" };
    case "risk_status_confirmed":
      return { icon: "●", color: entry.color || "green" };
    case "risk_status_rejected":
    case "risk_status_closed":
      return { icon: "⬡", color: entry.color || "gray" };
    default:
      return { icon: defaultIcon, color: entry.color || "gray" };
  }
}

function getIconColorClass(color: string): string {
  switch (color) {
    case "red":
      return "text-red-500";
    case "green":
      return "text-green-500";
    case "orange":
      return "text-orange-500";
    case "blue":
      return "text-blue-500";
    case "gray":
    default:
      return "text-gray-400";
  }
}

export default function ActivityFeed({ contractNumber }: ActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    const loadLogs = () => {
      const loadedLogs = getActivityLogs(contractNumber);
      setLogs(loadedLogs);
    };

    loadLogs();

    // Обновляем логи каждые 2 секунды для отображения новых действий
    const interval = setInterval(loadLogs, 2000);

    // Также обновляем при фокусе окна
    const handleFocus = () => {
      loadLogs();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [contractNumber]);

  // Группируем логи по датам
  const groupedLogs = useMemo(() => {
    const groups: Record<string, ActivityLogEntry[]> = {};
    
    logs.forEach((log) => {
      const dateKey = formatActivityDate(log.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return groups;
  }, [logs]);

  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <h2 className="text-2xl font-bold text-gray-900">Activity</h2>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {/* Кнопка "See all" пока скрыта для будущего использования */}
        {/* <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
          See all
        </button> */}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-3">
          {Object.entries(groupedLogs).map(([dateKey, dateLogs]) => (
            <div key={dateKey}>
              {dateLogs.map((log) => {
                const { icon, color } = getActivityIcon(log);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    {/* Иконка */}
                    <div
                      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm ${getIconColorClass(color)}`}
                    >
                      {icon}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {log.user}
                        </span>
                        <span className="text-sm font-normal text-gray-700">
                          {log.description}
                        </span>
                      </div>
                      <div className="text-xs font-normal text-gray-500 mt-0.5">
                        {dateKey}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

