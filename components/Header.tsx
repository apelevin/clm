"use client";

import { useCost } from "@/contexts/CostContext";
import { formatCost } from "@/lib/cost-calculator";
import { useRouter, usePathname } from "next/navigation";

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
  const { totalCost } = useCost();
  const router = useRouter();
  const pathname = usePathname();
  const isResultPage = pathname === "/result";

  const navItems = [
    { path: "/", label: "Договоры" },
    { path: "/tasks", label: "Задачи" },
    { path: "/risks", label: "Риски" },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Навигация */}
      <div className="px-6 py-2 border-b border-gray-100">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Левая часть */}
          <div className="flex items-center gap-4">
            {isResultPage && (
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Вернуться к списку договоров"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div>
              <div className="text-sm font-normal text-gray-600">Customer Support</div>
              <div className="text-xl font-bold text-gray-900">{contractTitle}</div>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Согласование
            </button>
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-3">
            {/* Индикатор расходов */}
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
              <div className="text-xs font-medium text-gray-600">Расходы OpenAI</div>
              <div className="text-sm font-bold text-gray-900">
                {formatCost(totalCost)}
              </div>
            </div>

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
    </div>
  );
}

