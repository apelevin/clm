"use client";

import { useState } from "react";
import { VersioningData, ClauseChange, DocumentVersion } from "@/types/contract-versioning";
import ChangesTab from "./versioning/ChangesTab";
import VersionsTab from "./versioning/VersionsTab";
import ActivityTab from "./versioning/ActivityTab";
import DiffView from "./versioning/DiffView";

interface ContractVersioningPanelProps {
  data: VersioningData;
  isOpen: boolean;
  onClose: () => void;
  onShowInText: (paragraphId: string) => void;
}

type TabType = "changes" | "versions" | "activity";

export default function ContractVersioningPanel({
  data,
  isOpen,
  onClose,
  onShowInText,
}: ContractVersioningPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("changes");
  const [selectedChange, setSelectedChange] = useState<ClauseChange | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [previousVersion, setPreviousVersion] = useState<DocumentVersion | null>(null);

  if (!isOpen) return null;

  const handleShowDiff = (change: ClauseChange) => {
    setSelectedChange(change);
  };

  const handleShowVersionDiff = (version: DocumentVersion, prevVersion?: DocumentVersion) => {
    setSelectedVersion(version);
    setPreviousVersion(prevVersion);
    // Для версий diff можно реализовать позже
  };

  const handleShowVersion = (version: DocumentVersion) => {
    // Показать документ в конкретной версии
    console.log("Show version:", version.version);
  };

  const handleCloseDiff = () => {
    setSelectedChange(null);
    setSelectedVersion(null);
    setPreviousVersion(null);
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[600px] bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Версионность договора</h2>
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

        {/* Вкладки */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("changes")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "changes"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Изменения
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "versions"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Версии
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "activity"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              История действий
            </button>
          </div>
        </div>

        {/* Контент вкладок */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "changes" && (
            <ChangesTab
              changes={data.changes}
              onShowInText={onShowInText}
              onShowDiff={handleShowDiff}
            />
          )}
          {activeTab === "versions" && (
            <VersionsTab
              versions={data.versions}
              onShowDiff={handleShowVersionDiff}
              onShowVersion={handleShowVersion}
            />
          )}
          {activeTab === "activity" && (
            <ActivityTab activity={data.activity} />
          )}
        </div>
      </div>

      {/* Diff View модальное окно */}
      {selectedChange && (
        <DiffView change={selectedChange} onClose={handleCloseDiff} />
      )}
    </>
  );
}

