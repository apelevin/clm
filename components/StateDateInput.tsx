"use client";

interface StateDateInputProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

export default function StateDateInput({
  value,
  onChange,
}: StateDateInputProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const date = new Date(e.target.value);
      onChange(date);
    }
  };

  // Форматируем дату для input type="date" (YYYY-MM-DD)
  const dateValue = value
    ? value.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Дата наступления стадии
      </label>
      <input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
      />
    </div>
  );
}

