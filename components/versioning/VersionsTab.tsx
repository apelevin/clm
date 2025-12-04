"use client";

import { DocumentVersion } from "@/types/contract-versioning";

interface VersionsTabProps {
  versions: DocumentVersion[];
  onShowDiff: (version: DocumentVersion, previousVersion?: DocumentVersion) => void;
  onShowVersion: (version: DocumentVersion) => void;
}

export default function VersionsTab({
  versions,
  onShowDiff,
  onShowVersion,
}: VersionsTabProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {versions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Нет версий</p>
        </div>
      ) : (
        versions.map((version, index) => {
          const previousVersion = index > 0 ? versions[index - 1] : undefined;
          
          return (
            <div
              key={version.version}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Версия {version.version}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {version.summary}
                  </p>
                  {version.changes.length > 0 && (
                    <ul className="text-sm text-gray-700 space-y-1 mb-2">
                      {version.changes.map((change, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded ${
                    version.author === "AI"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {version.author}
                  </span>
                  <span>{formatDate(version.date)}</span>
                </div>
                
                <div className="flex gap-2">
                  {previousVersion && (
                    <button
                      onClick={() => onShowDiff(version, previousVersion)}
                      className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      Открыть diff с предыдущей
                    </button>
                  )}
                  <button
                    onClick={() => onShowVersion(version)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                  >
                    Показать документ в этой версии
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

