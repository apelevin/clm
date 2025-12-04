"use client";

import { TaskListItem } from "@/app/api/tasks/route";
import { useRouter } from "next/navigation";

interface TasksGroupedViewProps {
  tasks: TaskListItem[];
  onTaskClick: (task: TaskListItem) => void;
}

export default function TasksGroupedView({ tasks, onTaskClick }: TasksGroupedViewProps) {
  const router = useRouter();

  // Группируем задачи по договорам
  const groupedByContract = tasks.reduce((acc, task) => {
    const key = task.contractId;
    if (!acc[key]) {
      acc[key] = {
        contractId: task.contractId,
        contractNumber: task.contractNumber || task.contractId,
        customer: task.customer,
        executor: task.executor,
        stateLabel: task.stateLabel,
        tasks: [],
      };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, {
    contractId: string;
    contractNumber: string;
    customer?: string;
    executor?: string;
    stateLabel: string;
    tasks: TaskListItem[];
  }>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Открыта</span>;
      case "inProgress":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">В работе</span>;
      case "awaitingAction":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Ожидает действий</span>;
      case "completed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Выполнена</span>;
      case "overdue":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Просрочено</span>;
      default:
        return null;
    }
  };

  const handleContractClick = (contractId: string) => {
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
    <div className="space-y-4">
      {Object.values(groupedByContract).map((group) => {
        const overdueCount = group.tasks.filter(t => t.status === "overdue").length;
        const inProgressCount = group.tasks.filter(t => t.status === "inProgress").length;
        const awaitingActionCount = group.tasks.filter(t => t.status === "awaitingAction").length;

        return (
          <div key={group.contractId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Заголовок группы */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() => handleContractClick(group.contractId)}
                    className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline"
                  >
                    Договор {group.contractNumber}
                  </button>
                  <div className="mt-1">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      Стадия: {group.stateLabel}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {group.tasks.length} {group.tasks.length === 1 ? "задача" : group.tasks.length < 5 ? "задачи" : "задач"}
                  {overdueCount > 0 && (
                    <span className="ml-2 text-red-600">
                      • {overdueCount} просрочено
                    </span>
                  )}
                  {inProgressCount > 0 && (
                    <span className="ml-2 text-blue-600">
                      • {inProgressCount} на исполнении
                    </span>
                  )}
                  {awaitingActionCount > 0 && (
                    <span className="ml-2 text-yellow-600">
                      • {awaitingActionCount} ожидают действий
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Список задач */}
            <div className="divide-y divide-gray-200">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {task.label}
                        </span>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mb-2">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {task.deadline && (
                          <span>
                            Срок: {new Date(task.deadline).toLocaleDateString("ru-RU")}
                          </span>
                        )}
                        <span>
                          {task.assignedTo === "customer" ? "Заказчик" : 
                           task.assignedTo === "executor" ? "Исполнитель" : 
                           "Обе стороны"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
