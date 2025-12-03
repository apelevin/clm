"use client";

import { useState, useRef, useEffect } from "react";
import { ContractStatus, SourceRef } from "@/types/contract";
import StateDateInput from "./StateDateInput";

interface ContractStatesSectionProps {
  states: ContractStatus[];
  selectedState: string | null;
  onStateChange: (stateId: string | null) => void;
  onShowSource: (sourceRefs: SourceRef[]) => void;
  stateStartDate: Date | null;
  onStateStartDateChange: (date: Date) => void;
}

export default function ContractStatesSection({
  states,
  selectedState,
  onStateChange,
  onShowSource,
  stateStartDate,
  onStateStartDateChange,
}: ContractStatesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (states.length === 0) {
    return null;
  }

  const selectedStateObj = states.find((s) => s.id === selectedState);
  const hasSource = selectedStateObj?.sourceRefs && selectedStateObj.sourceRefs.length > 0;

  const handleShowSource = () => {
    if (hasSource && selectedStateObj) {
      onShowSource(selectedStateObj.sourceRefs);
    }
  };

  const handleSelect = (stateId: string) => {
    onStateChange(stateId);
    setIsOpen(false);
  };

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Состояние договора</h2>
      <p className="text-sm font-normal text-gray-600 mb-4">
        Выберите текущее состояние договора
      </p>
      
      <div className="mb-4 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex-1">
            {selectedStateObj ? (
              <>
                <div className="text-base font-semibold text-gray-900">
                  {selectedStateObj.label}
                </div>
                {selectedStateObj.description && (
                  <div className="text-sm font-normal text-gray-600 mt-1">
                    {selectedStateObj.description}
                  </div>
                )}
              </>
            ) : (
              <span className="text-gray-500">Выберите состояние</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
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

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {states.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => handleSelect(state.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedState === state.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-base font-semibold text-gray-900">
                  {state.label}
                </div>
                {state.description && (
                  <div className="text-sm font-normal text-gray-600 mt-1">
                    {state.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedState && (
        <StateDateInput
          value={stateStartDate}
          onChange={onStateStartDateChange}
        />
      )}

      {selectedStateObj && hasSource && (
        <button
          onClick={handleShowSource}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Показать источник в договоре
        </button>
      )}
    </div>
  );
}

