"use client";

interface SidebarProps {
  activeItem?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
}

const menuItems: MenuItem[] = [
  { id: "contracts", label: "Контракты", icon: "📄" },
  // Можно добавить другие пункты меню в будущем
  // { id: "reports", label: "Отчеты", icon: "📊" },
  // { id: "settings", label: "Настройки", icon: "⚙️" },
];

export default function Sidebar({ activeItem = "contracts" }: SidebarProps) {
  return (
    <div className="w-60 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Договоры</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

