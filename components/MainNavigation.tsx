"use client";

interface MainNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "contract", label: "Договор" },
  { id: "parties", label: "Стороны" },
  { id: "status", label: "Состояние" },
  { id: "subject", label: "Предмет" },
  { id: "finance", label: "Финансы" },
  { id: "obligations", label: "Обязательства" },
  { id: "agreement", label: "Согласование" },
];

export default function MainNavigation({ activeTab, onTabChange }: MainNavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

