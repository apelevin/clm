"use client";

import { useEffect } from "react";
import { ContractAction, SourceRef } from "@/types/contract";

interface ActionModalProps {
  action: ContractAction | null;
  isOpen: boolean;
  onClose: () => void;
  onShowSource: (sourceRefs: SourceRef[]) => void;
}

export default function ActionModal({
  action,
  isOpen,
  onClose,
  onShowSource,
}: ActionModalProps) {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Блокируем прокрутку фона
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !action) {
    return null;
  }

  const handleShowSource = () => {
    if (action.sourceRefs && action.sourceRefs.length > 0) {
      onShowSource(action.sourceRefs);
      onClose();
    }
  };

  const hasSource = action.sourceRefs && action.sourceRefs.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {action.label}
            </h2>
            {action.isAvailable !== undefined && (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded ${
                  action.isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {action.isAvailable ? "Доступно сейчас" : "Недоступно"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Закрыть"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Описание
            </h3>
            <p className="text-gray-600">{action.description}</p>
          </div>

          {action.relatedClauses && action.relatedClauses.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Связанные пункты договора
              </h3>
              <div className="flex flex-wrap gap-2">
                {action.relatedClauses.map((clause, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {clause.section}
                    {clause.paragraph && `.${clause.paragraph}`}
                    {clause.comment && ` - ${clause.comment}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasSource && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleShowSource}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Показать источник в договоре
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

