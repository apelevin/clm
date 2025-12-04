"use client";

import { ContractTask, SourceRef, PartyRole } from "@/types/contract";
import {
  calculateTaskDeadline,
  formatDeadline,
  formatDeadlineShort,
  isTaskOverdue,
  isTaskApproaching,
} from "@/lib/date-calculator";

interface StateTasksSectionProps {
  stateLabel: string;
  tasks: ContractTask[];
  onShowSource: (sourceRefs: SourceRef[]) => void;
  stateStartDate: Date | null;
  onTaskClick?: (task: ContractTask) => void;
}

export default function StateTasksSection({
  stateLabel,
  tasks,
  onShowSource,
  stateStartDate,
  onTaskClick,
}: StateTasksSectionProps) {
  if (tasks.length === 0) {
    return null;
  }

  const getAssignedToLabel = (assignedTo: PartyRole) => {
    switch (assignedTo) {
      case "customer":
        return "Заказчик";
      case "executor":
        return "Исполнитель";
      case "both":
        return "Обе стороны";
      default:
        return "";
    }
  };

  const getAssignedToColorClasses = (assignedTo: PartyRole) => {
    switch (assignedTo) {
      case "customer":
        return "bg-green-100 text-green-800";
      case "executor":
        return "bg-blue-100 text-blue-800";
      case "both":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const primaryTasks = tasks.filter((task) => task.priority !== "secondary");
  const secondaryTasks = tasks.filter((task) => task.priority === "secondary");

  // Функция для отображения даты выполнения задачи
  const renderTaskDeadline = (task: ContractTask) => {
    if (!task.deadline || !stateStartDate) {
      return null;
    }

    try {
      const deadlineDate = calculateTaskDeadline(task.deadline, stateStartDate);
      const isOverdue = isTaskOverdue(deadlineDate);
      const isApproaching = isTaskApproaching(deadlineDate);

      let textColor = "text-gray-600";
      if (isOverdue) {
        textColor = "text-red-600";
      } else if (isApproaching) {
        textColor = "text-orange-600";
      }

      const deadlineText = task.deadline.description
        ? `${task.deadline.description} (${formatDeadlineShort(deadlineDate)})`
        : formatDeadline(deadlineDate);

      return (
        <div className={`text-sm font-normal ${textColor} mt-1`}>
          <span className="font-semibold">Срок:</span> {deadlineText}
          {isOverdue && (
            <span className="ml-2 text-red-600" title="Просрочено">
              ⚠️
            </span>
          )}
        </div>
      );
    } catch (error) {
      console.error("Ошибка расчета даты:", error);
      return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Задачи по текущему состоянию</h2>
      <p className="text-sm font-normal text-gray-600 mb-4">
        Состояние: <span className="font-semibold">{stateLabel}</span>
      </p>

      {primaryTasks.length > 0 && (
        <div className="space-y-3 mb-4">
          {primaryTasks.map((task) => {
            const hasSource = task.sourceRefs && task.sourceRefs.length > 0;

            const handleShowSource = () => {
              if (hasSource) {
                onShowSource(task.sourceRefs);
              }
            };

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className={`border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors ${onTaskClick ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    readOnly
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{task.label}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getAssignedToColorClasses(
                          task.assignedTo
                        )}`}
                      >
                        {getAssignedToLabel(task.assignedTo)}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm font-normal text-gray-900 mb-2">{task.description}</p>
                    )}
                    {renderTaskDeadline(task)}
                    {hasSource && (
                      <button
                        onClick={handleShowSource}
                        className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                      >
                        Показать источник
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {secondaryTasks.length > 0 && (
        <>
          {primaryTasks.length > 0 && (
            <div className="border-t border-gray-300 my-4"></div>
          )}
          <div className="space-y-2">
            {secondaryTasks.map((task) => {
              const hasSource = task.sourceRefs && task.sourceRefs.length > 0;

              const handleShowSource = () => {
                if (hasSource) {
                  onShowSource(task.sourceRefs);
                }
              };

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors opacity-90 ${onTaskClick ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                      readOnly
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {task.label}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getAssignedToColorClasses(
                            task.assignedTo
                          )}`}
                        >
                          {getAssignedToLabel(task.assignedTo)}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs font-normal text-gray-900 mb-1">
                          {task.description}
                        </p>
                      )}
                      {renderTaskDeadline(task)}
                      {hasSource && (
                        <button
                          onClick={handleShowSource}
                          className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                        >
                          Показать источник
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

