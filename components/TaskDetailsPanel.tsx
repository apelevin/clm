"use client";

import { useState, useEffect } from "react";
import { TaskListItem } from "@/app/api/tasks/route";
import { useRouter } from "next/navigation";

interface TaskDetailsPanelProps {
  task: TaskListItem;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskListItem["status"]) => void;
}

export default function TaskDetailsPanel({
  task,
  onClose,
  onStatusChange,
}: TaskDetailsPanelProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<TaskListItem["status"]>(task.status);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<Array<{ text: string; date: Date; author: string }>>([]);

  // Загружаем комментарии из localStorage
  useEffect(() => {
    const storedComments = localStorage.getItem(`task_comments_${task.id}`);
    if (storedComments) {
      try {
        const parsed = JSON.parse(storedComments);
        setComments(parsed.map((c: any) => ({ ...c, date: new Date(c.date) })));
      } catch (e) {
        console.error("Ошибка загрузки комментариев:", e);
      }
    }
  }, [task.id]);

  // Загружаем текущий комментарий из localStorage
  useEffect(() => {
    const storedComment = localStorage.getItem(`task_comment_${task.id}`);
    if (storedComment) {
      setComment(storedComment);
    }
  }, [task.id]);

  const handleStatusChange = (newStatus: TaskListItem["status"]) => {
    setCurrentStatus(newStatus);
    onStatusChange?.(task.id, newStatus);
    // Сохраняем в localStorage для mockup
    const taskStatuses = JSON.parse(localStorage.getItem("task_statuses") || "{}");
    taskStatuses[task.id] = newStatus;
    localStorage.setItem("task_statuses", JSON.stringify(taskStatuses));
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    const newComment = {
      text: comment,
      date: new Date(),
      author: "Вы", // В реальном приложении брать из контекста пользователя
    };
    
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    localStorage.setItem(`task_comments_${task.id}`, JSON.stringify(updatedComments));
    setComment("");
  };

  const handleSaveComment = () => {
    if (comment.trim()) {
      localStorage.setItem(`task_comment_${task.id}`, comment);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">⚪ Открыта</span>;
      case "inProgress":
        return <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">🟢 В работе</span>;
      case "awaitingAction":
        return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">🟡 Ожидает действий</span>;
      case "completed":
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded">🔵 Выполнена</span>;
      case "overdue":
        return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">🔴 Просрочено</span>;
      default:
        return null;
    }
  };

  const getPartyLabel = (party: string) => {
    switch (party) {
      case "customer":
        return "Заказчик";
      case "executor":
        return "Исполнитель";
      case "both":
        return "Обе стороны";
      default:
        return party;
    }
  };

  const getDeadlineInfo = () => {
    if (!task.deadline) {
      return { text: "Срок не указан", color: "text-gray-500" };
    }

    try {
      const deadlineDate = new Date(task.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);

      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: `Просрочено на ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "день" : Math.abs(diffDays) < 5 ? "дня" : "дней"}`,
          color: "text-red-600",
          date: deadlineDate.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        };
      }

      if (diffDays <= 3) {
        return {
          text: `Осталось ${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"}`,
          color: "text-orange-600",
          date: deadlineDate.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        };
      }

      return {
        text: deadlineDate.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        color: "text-gray-900",
        date: deadlineDate.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      };
    } catch (error) {
      return { text: "Срок не указан", color: "text-gray-500" };
    }
  };

  const deadlineInfo = getDeadlineInfo();

  const handleContractClick = () => {
    router.push(`/result?contract=${task.contractId}`);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[600px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Заголовок */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Детали задачи</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Закрыть панель"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Название задачи */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.label}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600">{task.description}</p>
            )}
          </div>

          {/* Статус */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Статус
            </label>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as TaskListItem["status"])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="open">⚪ Открыта</option>
              <option value="inProgress">🟢 В работе</option>
              <option value="awaitingAction">🟡 Ожидает действий</option>
              <option value="completed">🔵 Выполнена</option>
              <option value="overdue">🔴 Просрочено</option>
            </select>
            <div className="mt-2">
              {getStatusBadge(currentStatus)}
            </div>
          </div>

          {/* Сроки */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Сроки
            </label>
            <div className="space-y-1">
              <div className={`text-sm font-medium ${deadlineInfo.color}`}>
                {deadlineInfo.text}
              </div>
              {task.deadlineDescription && (
                <div className="text-sm text-gray-600">
                  {task.deadlineDescription}
                </div>
              )}
            </div>
          </div>

          {/* Договор и стадия */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Договор
            </label>
            <div className="space-y-2">
              <button
                onClick={handleContractClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {task.contractNumber || task.contractId}
              </button>
              <div className="text-sm text-gray-600">
                <div>Стадия: {task.stateLabel}</div>
                {task.stateDescription && (
                  <div className="text-xs text-gray-500 mt-1">
                    {task.stateDescription}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Сторона */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Сторона
            </label>
            <div className="text-sm text-gray-900">
              {getPartyLabel(task.assignedTo)}
            </div>
          </div>

          {/* Контрагент */}
          {(task.customer || task.executor) && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Контрагент
              </label>
              <div className="text-sm text-gray-900">
                {task.customer && task.executor ? (
                  <span>{task.customer} / {task.executor}</span>
                ) : task.customer || task.executor}
              </div>
            </div>
          )}

          {/* Категория */}
          {task.category && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Категория
              </label>
              <div className="text-sm text-gray-900">
                {task.category}
              </div>
            </div>
          )}

          {/* Приоритет */}
          {task.priority && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Приоритет
              </label>
              <div className="text-sm text-gray-900">
                {task.priority === "primary" ? "Основной" : "Второстепенный"}
              </div>
            </div>
          )}

          {/* Последнее изменение */}
          {task.lastChanged && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Последнее изменение
              </label>
              <div className="text-sm text-gray-600">
                {new Date(task.lastChanged).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}

          {/* Комментарии */}
          <div className="pt-4 border-t border-gray-200">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">
              Комментарии
            </label>
            
            {/* Список комментариев */}
            {comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {comments.map((c, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{c.author}</span>
                      <span className="text-xs text-gray-500">
                        {c.date.toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Поле для нового комментария */}
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={handleSaveComment}
                placeholder="Добавить комментарий..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Добавить комментарий
              </button>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="pt-4 border-t border-gray-200">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">
              Действия
            </label>
            <div className="flex gap-2">
              {currentStatus !== "completed" && (
                <button 
                  onClick={() => handleStatusChange("completed")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Выполнить
                </button>
              )}
              <button 
                onClick={() => handleStatusChange("awaitingAction")}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Отложить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
