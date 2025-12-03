"use client";

import { useState, useEffect, useRef } from "react";
import {
  ProblematicElement,
  ProblematicElementStatus,
  ProblematicElementComment,
  ProblematicElementChange,
} from "@/types/contract";
import {
  loadProblematicElementData,
  saveProblematicElementData,
} from "@/lib/problematic-elements-storage";
import { logActivity } from "@/lib/activity-logger";

interface ProblematicElementCardProps {
  element: ProblematicElement;
  provisionId: string;
  index: number;
  contractNumber?: string;
}

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

function getStatusColorClasses(status: ProblematicElementStatus): string {
  switch (status) {
    case "confirmed":
      return "bg-red-50 border-red-200";
    case "rejected":
      return "bg-gray-50 border-gray-200";
    case "disputed":
      return "bg-yellow-50 border-yellow-200";
    case "closed":
      return "bg-blue-50 border-blue-200";
    case "neutral":
    default:
      return "bg-green-50 border-green-200";
  }
}

function getStatusLabel(status: ProblematicElementStatus): string {
  switch (status) {
    case "confirmed":
      return "Подтверждено";
    case "rejected":
      return "Отклонено";
    case "disputed":
      return "Спорно";
    case "closed":
      return "Закрыто";
    case "neutral":
    default:
      return "Нейтрально";
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ProblematicElementCard({
  element,
  provisionId,
  index,
  contractNumber,
}: ProblematicElementCardProps) {
  const elementId = element.id || `element_${index}`;
  const [status, setStatus] = useState<ProblematicElementStatus>(
    element.status || "neutral"
  );
  const [comment, setComment] = useState<ProblematicElementComment | undefined>(
    element.comment
  );
  const [changeHistory, setChangeHistory] = useState<ProblematicElementChange[]>(
    element.changeHistory || []
  );
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProblematicElementStatus>("neutral");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClosingRisk, setIsClosingRisk] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Загружаем сохраненные данные при монтировании
  useEffect(() => {
    const saved = loadProblematicElementData(provisionId, elementId);
    if (saved) {
      if (saved.status) setStatus(saved.status);
      if (saved.comment) setComment(saved.comment);
      if (saved.changeHistory) setChangeHistory(saved.changeHistory);
    }
  }, [provisionId, elementId]);

  // Обработка упоминаний в тексте (@user)
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(`@${match[1]}`);
    }
    return [...new Set(mentions)]; // Уникальные упоминания
  };

  const handleStatusButtonClick = (newStatus: ProblematicElementStatus) => {
    setSelectedStatus(newStatus);
    setIsCommenting(true);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleSaveComment = () => {
    if (!commentText.trim()) return;

    const mentions = extractMentions(commentText);
    const previousStatus = status;
    const newComment: ProblematicElementComment = {
      status: selectedStatus,
      text: commentText.trim(),
      mentions: mentions.length > 0 ? mentions : undefined,
      author: "Вы",
      timestamp: new Date(),
    };

    // Создаем запись в журнале изменений
    const change: ProblematicElementChange = {
      id: Date.now().toString(),
      changedBy: "Вы",
      previousStatus: previousStatus,
      newStatus: selectedStatus,
      arguments: commentText.trim(),
      timestamp: new Date(),
    };

    setStatus(selectedStatus);
    setComment(newComment);
    setChangeHistory([...changeHistory, change]);
    setIsCommenting(false);
    setCommentText("");

    // Сохраняем в localStorage
    saveProblematicElementData(provisionId, elementId, {
      status: selectedStatus,
      comment: newComment,
      changeHistory: [...changeHistory, change],
    });

    // Логируем изменение статуса риска
    const statusLabels: Record<ProblematicElementStatus, string> = {
      confirmed: "Подтверждён",
      rejected: "Отклонён",
      disputed: "Спорно",
      closed: "Закрыт",
      neutral: "Нейтрально",
    };

    let activityType: "risk_status_confirmed" | "risk_status_rejected" | "risk_status_disputed" | "risk_status_closed" | "risk_status_changed";
    let activityColor: "red" | "green" | "orange" | "gray" | "blue" = "gray";

    switch (selectedStatus) {
      case "confirmed":
        activityType = "risk_status_confirmed";
        activityColor = "green";
        break;
      case "rejected":
        activityType = "risk_status_rejected";
        activityColor = "gray";
        break;
      case "disputed":
        activityType = "risk_status_disputed";
        activityColor = "orange";
        break;
      case "closed":
        activityType = "risk_status_closed";
        activityColor = "blue";
        break;
      default:
        activityType = "risk_status_changed";
    }

    const previousLabel = previousStatus ? statusLabels[previousStatus] : "не определено";
    const newLabel = statusLabels[selectedStatus];

    logActivity(contractNumber, {
      level: "risk",
      type: activityType,
      user: "pelevin",
      description: previousStatus
        ? `changed status from ${previousLabel} to ${newLabel}`
        : `set status to ${newLabel}`,
      icon: "risk",
      color: activityColor,
      metadata: {
        previousValue: previousLabel,
        newValue: newLabel,
        elementId: elementId,
        provisionId: provisionId,
      },
    });

    // Логируем добавление комментария отдельно
    logActivity(contractNumber, {
      level: "risk",
      type: "risk_comment_added",
      user: "pelevin",
      description: `posted an update`,
      icon: "comment",
      color: "green",
      metadata: {
        elementId: elementId,
        provisionId: provisionId,
      },
    });
  };

  const handleCancelComment = () => {
    setIsCommenting(false);
    setCommentText("");
    setSelectedStatus(status);
    setIsClosingRisk(false);
  };

  const handleCloseRisk = () => {
    setIsClosingRisk(true);
    setSelectedStatus("closed");
    setIsCommenting(true);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleOpenDiscussion = () => {
    setSelectedStatus("disputed");
    setIsCommenting(true);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  return (
    <li className={`${getStatusColorClasses(status)} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {element.element}
          </div>
          <div className="text-xs font-normal text-gray-700">{element.issue}</div>
        </div>
        {/* Бейдж статуса */}
        {status !== "neutral" && (
          <div className="ml-3 px-2 py-1 rounded text-xs font-medium bg-white/50">
            {getStatusLabel(status)}
          </div>
        )}
      </div>

      {/* Кнопки управления статусом */}
      {!isCommenting && status !== "closed" && (
        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          <button
            onClick={() => handleStatusButtonClick("confirmed")}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
          >
            Подтверждаем риск
          </button>
          <button
            onClick={() => handleStatusButtonClick("rejected")}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Не считаем риском
          </button>
          <button
            onClick={handleOpenDiscussion}
            className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
          >
            Открыть обсуждение
          </button>
          <button
            onClick={handleCloseRisk}
            className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
          >
            Закрыть риск
          </button>
        </div>
      )}

      {/* Отображение комментария */}
      {comment && !isCommenting && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {getInitials(comment.author)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-900">
                  {comment.author}
                </span>
                <span className="text-xs font-normal text-gray-500">
                  {formatTimeAgo(comment.timestamp)}
                </span>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-white/70">
                  {getStatusLabel(comment.status)}
                </span>
              </div>
              <div className="text-xs font-normal text-gray-700 leading-relaxed">
                {comment.text.split(/(@\w+)/g).map((part, idx) => {
                  if (part.startsWith("@")) {
                    return (
                      <span
                        key={idx}
                        className="text-blue-600 font-medium cursor-pointer hover:underline"
                      >
                        {part}
                      </span>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                })}
              </div>
            </div>
          </div>

          {/* Журнал изменений */}
          {changeHistory.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <span>История изменений</span>
                <svg
                  className={`w-3 h-3 transition-transform ${
                    isHistoryOpen ? "transform rotate-180" : ""
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
              {isHistoryOpen && (
                <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-300">
                  {changeHistory.map((change) => (
                    <div key={change.id} className="text-xs">
                      <div className="font-medium text-gray-900">
                        {change.changedBy}
                        {change.previousStatus && (
                          <span className="text-gray-500">
                            {" "}
                            изменил статус с "{getStatusLabel(change.previousStatus)}" на "
                            {getStatusLabel(change.newStatus)}"
                          </span>
                        )}
                        {!change.previousStatus && (
                          <span className="text-gray-500">
                            {" "}
                            установил статус "{getStatusLabel(change.newStatus)}"
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 mt-0.5">{change.arguments}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {formatTimeAgo(change.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Форма комментария */}
      {isCommenting && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Статус:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as ProblematicElementStatus)
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="confirmed">Подтверждено</option>
              <option value="rejected">Отклонено</option>
              <option value="disputed">Спорно</option>
              <option value="closed">Закрыто</option>
              <option value="neutral">Нейтрально</option>
            </select>
          </div>
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              isClosingRisk
                ? "Опишите, как была решена проблема (например: 'Проблему сняли, в договор внесли корректировку')…"
                : "Написать комментарий (можно использовать @упоминания)…"
            }
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 resize-none mb-2"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelComment}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отменить
            </button>
            <button
              onClick={handleSaveComment}
              disabled={!commentText.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

