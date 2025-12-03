"use client";

import { useState, useRef, useEffect } from "react";

export type ExecutionStatus = "normal" | "at_risk" | "overdue";

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

export interface ExecutionStatusUpdate {
  status: ExecutionStatus;
  text: string;
  author: string;
  timestamp: Date;
  comments?: Comment[];
}

interface ContractExecutionStatusProps {
  contractNumber?: string;
}

const STATUS_CONFIG: Record<
  ExecutionStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  normal: {
    label: "В норме",
    color: "#2ECC71",
    bgColor: "#D5F4E6",
    icon: "🟢",
  },
  at_risk: {
    label: "Под риском",
    color: "#F1C40F",
    bgColor: "#FEF9E7",
    icon: "🟡",
  },
  overdue: {
    label: "Просрочено",
    color: "#E74C3C",
    bgColor: "#FADBD8",
    icon: "🔴",
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "только что";
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "минуту" : diffMins < 5 ? "минуты" : "минут"} назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`;
  } else if (diffDays === 1) {
    return "вчера";
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays < 5 ? "дня" : "дней"} назад`;
  } else {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ContractExecutionStatus({
  contractNumber,
}: ContractExecutionStatusProps) {
  const [lastUpdate, setLastUpdate] = useState<ExecutionStatusUpdate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ExecutionStatus>("normal");
  const [updateText, setUpdateText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Загружаем сохраненное обновление из localStorage при монтировании
  useEffect(() => {
    if (contractNumber && typeof window !== "undefined") {
      const stored = localStorage.getItem(`execution_status_${contractNumber}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLastUpdate({
            ...parsed,
            timestamp: new Date(parsed.timestamp),
            comments: parsed.comments
              ? parsed.comments.map((c: any) => ({
                  ...c,
                  timestamp: new Date(c.timestamp),
                }))
              : [],
          });
        } catch (e) {
          console.error("Failed to parse stored execution status", e);
        }
      }
    }
  }, [contractNumber]);

  // Сохраняем обновление в localStorage
  const saveUpdate = (update: ExecutionStatusUpdate) => {
    setLastUpdate(update);
    if (contractNumber && typeof window !== "undefined") {
      localStorage.setItem(
        `execution_status_${contractNumber}`,
        JSON.stringify(update)
      );
    }
  };

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handlePublish = () => {
    if (updateText.trim()) {
      const update: ExecutionStatusUpdate = {
        status: selectedStatus,
        text: updateText.trim(),
        author: "Вы", // В MVP используем простое имя
        timestamp: new Date(),
      };
      saveUpdate(update);
      // Очищаем форму, но оставляем её открытой для добавления следующего статуса
      setUpdateText("");
      setSelectedStatus("normal");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setUpdateText("");
    setSelectedStatus("normal");
  };

  const handleAddComment = () => {
    if (commentText.trim() && lastUpdate) {
      const newComment: Comment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        author: "Вы",
        timestamp: new Date(),
      };
      const updatedUpdate: ExecutionStatusUpdate = {
        ...lastUpdate,
        comments: [...(lastUpdate.comments || []), newComment],
      };
      saveUpdate(updatedUpdate);
      setCommentText("");
      setIsCommenting(false);
    }
  };

  const handleCancelComment = () => {
    setCommentText("");
    setIsCommenting(false);
  };

  // Рендерим компонент: показываем опубликованные статусы и форму создания (если открыта)
  return (
    <div className="mb-6 space-y-4">
      {/* Состояние 1: Пустое (показываем только если нет обновлений и форма не открыта) */}
      {!lastUpdate && !isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span className="text-xl">✏️</span>
            <span className="text-base font-normal">
              Добавить первый статус исполнения…
            </span>
          </div>
        </button>
      )}

      {/* Состояние 3: Отображение последнего обновления (показываем если есть обновление) */}
      {lastUpdate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Бейдж статуса */}
              <div
                className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                style={{
                  backgroundColor: STATUS_CONFIG[lastUpdate.status].bgColor,
                  color: STATUS_CONFIG[lastUpdate.status].color,
                }}
              >
                <span>{STATUS_CONFIG[lastUpdate.status].icon}</span>
                <span>{STATUS_CONFIG[lastUpdate.status].label}</span>
              </div>
            </div>
            {/* Кнопка "Новое обновление" (показываем только если форма не открыта) */}
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>✏️</span>
                <span>Новое обновление</span>
              </button>
            )}
          </div>

          {/* Аватар, имя и время */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(lastUpdate.author)}
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-gray-900">
                {lastUpdate.author}
              </div>
              <div className="text-sm font-normal text-gray-500">
                {formatTimeAgo(lastUpdate.timestamp)}
              </div>
            </div>
          </div>

          {/* Текст обновления */}
          <div className="text-base font-normal text-gray-900 leading-relaxed mb-4">
            {lastUpdate.text}
          </div>

          {/* Комментарии */}
          {lastUpdate.comments && lastUpdate.comments.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
              {lastUpdate.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {getInitials(comment.author)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {comment.author}
                      </span>
                      <span className="text-xs font-normal text-gray-500">
                        {formatTimeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm font-normal text-gray-700 leading-relaxed">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления комментария */}
          {isCommenting ? (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Написать комментарий…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-normal text-gray-900 placeholder-gray-400 resize-none mb-3"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelComment}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отменить
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Отправить
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={() => setIsCommenting(true)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>Добавить комментарий</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Состояние 2: Форма создания обновления (показываем если форма открыта) */}
      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
          {/* Dropdown выбора статуса */}
          <div className="mb-4 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {STATUS_CONFIG[selectedStatus].icon}
                </span>
                <span className="text-base font-semibold text-gray-900">
                  {STATUS_CONFIG[selectedStatus].label}
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isDropdownOpen ? "transform rotate-180" : ""
                }`}
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
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {(Object.keys(STATUS_CONFIG) as ExecutionStatus[]).map(
                  (status) => {
                    const config = STATUS_CONFIG[status];
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(status);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          selectedStatus === status ? "bg-gray-50" : ""
                        }`}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-base font-semibold text-gray-900">
                          {config.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Поле ввода обновления */}
          <div className="mb-4">
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Написать обновление по исполнению договора…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-normal text-gray-900 placeholder-gray-400 resize-none"
              rows={4}
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отменить
            </button>
            <button
              onClick={handlePublish}
              disabled={!updateText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Опубликовать статус
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

