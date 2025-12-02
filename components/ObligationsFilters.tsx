"use client";

interface ObligationsFiltersProps {
  allCategories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedParties: Set<"customer" | "executor" | "both">;
  onPartyToggle: (party: "customer" | "executor" | "both") => void;
}

export default function ObligationsFilters({
  allCategories,
  selectedCategory,
  onCategoryChange,
  selectedParties,
  onPartyToggle,
}: ObligationsFiltersProps) {
  // Группируем категории для двух рядов
  const primaryCategories = allCategories.slice(0, 5);
  const secondaryCategories = allCategories.slice(5);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        {/* Первый ряд фильтров */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Все
          </button>
          {primaryCategories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Второй ряд фильтров (если есть) */}
        {secondaryCategories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {secondaryCategories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

