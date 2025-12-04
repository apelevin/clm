"use client";

import { TaskListItem } from "@/app/api/tasks/route";
import { useRouter } from "next/navigation";

interface TasksTableProps {
  tasks: TaskListItem[];
  onTaskClick: (task: TaskListItem) => void;
}

export default function TasksTable({ tasks, onTaskClick }: TasksTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">⚪ Открыта</span>;
      case "inProgress":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">🟢 В работе</span>;
      case "awaitingAction":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">🟡 Ожидает действий</span>;
      case "completed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">🔵 Выполнена</span>;
      case "overdue":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">🔴 Просрочено</span>;
      default:
        return null;
    }
  };

  const getPartyBadge = (party: string) => {
    switch (party) {
      case "customer":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">🟦 Заказчик</span>;
      case "executor":
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">🟧 Исполнитель</span>;
      case "both":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">🟨 Оба</span>;
      default:
        return null;
    }
  };

  const getDeadlineDisplay = (task: TaskListItem) => {
    if (!task.deadline) {
      return <span className="text-gray-500">—</span>;
    }

    try {
      const deadlineDate = new Date(task.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);

      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return (
          <span className="text-red-600 font-medium">
            🔴 Просрочено на {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? "день" : Math.abs(diffDays) < 5 ? "дня" : "дней"}
          </span>
        );
      }

      if (diffDays <= 3) {
        return (
          <span className="text-orange-600 font-medium">
            🟠 Осталось {diffDays} {diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"}
          </span>
        );
      }

      return (
        <span className="text-gray-900">
          {deadlineDate.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      );
    } catch (error) {
      return <span className="text-gray-500">—</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handleContractClick = (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    router.push(`/result?contract=${contractId}`);
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">✨</div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Все задачи выполнены. Отличная работа!
        </p>
        <p className="text-sm text-gray-600">
          В вашем портфеле договоров нет активных задач.
        </p>
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
                Задача
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Срок
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Договор
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Контрагент
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Стадия
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Сторона
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Последнее изменение
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {task.label}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(task.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getDeadlineDisplay(task)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => handleContractClick(e, task.contractId)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {task.contractNumber || task.contractId}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {task.customer && task.executor ? (
                      <span>{task.customer} / {task.executor}</span>
                    ) : task.customer || task.executor || "—"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    {task.stateLabel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPartyBadge(task.assignedTo)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(task.lastChanged)}
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
