"use client";

import { ActivityItem } from "@/types/contract-versioning";

interface ActivityTabProps {
  activity: ActivityItem[];
}

export default function ActivityTab({ activity }: ActivityTabProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Вчера, " + date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      }) + ", " + date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "change":
        return "✏️";
      case "risk":
        return "⚠️";
      case "recommendation":
        return "💡";
      case "status":
        return "📊";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-3">
      {activity.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Нет активности</p>
        </div>
      ) : (
        activity.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className="text-lg">{getActivityIcon(item.type)}</div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{item.actor}</span>{" "}
                {item.action}
                {item.target && (
                  <span className="text-gray-600"> "{item.target}"</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(item.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}


