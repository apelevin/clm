"use client";

interface HeaderProps {
  contractTitle?: string;
  isDocumentVisible?: boolean;
  onToggleDocumentView?: () => void;
}

export default function Header({ 
  contractTitle = "Договор услуг",
  isDocumentVisible = true,
  onToggleDocumentView,
}: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Левая часть */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-gray-600">Customer Support</div>
            <div className="text-lg font-semibold text-gray-900">{contractTitle}</div>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Согласование
          </button>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-3">
          {/* Аватары пользователей */}
          <div className="flex items-center -space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
            <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"></div>
            <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
              <span className="text-xs text-white font-medium">+1</span>
            </div>
          </div>
          
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
            Поделиться
          </button>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Спросить AI
          </button>
          
          <button
            type="button"
            onClick={onToggleDocumentView}
            aria-pressed={isDocumentVisible}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isDocumentVisible
                ? "text-blue-600 bg-blue-50 border border-blue-100"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title={isDocumentVisible ? "Скрыть текст договора" : "Показать текст договора"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="sr-only">
              {isDocumentVisible ? "Скрыть текст договора" : "Показать текст договора"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

