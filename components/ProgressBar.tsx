"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  status: "loading" | "success" | "error";
  errorMessage?: string;
  elapsedTime?: number;
}

const STEPS = [
  "Анализ структуры договора",
  "Выделение обязательств и действий",
  "Формирование интерфейсных элементов",
  "Сборка JSON-модели",
];

export default function ProgressBar({
  currentStep,
  totalSteps,
  status,
  errorMessage,
  elapsedTime,
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} сек`;
    return `${Math.floor(seconds / 60)} мин ${Math.round(seconds % 60)} сек`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-900">
            {status === "loading" && STEPS[currentStep - 1]}
            {status === "success" && "Обработка завершена"}
            {status === "error" && "Ошибка обработки"}
          </span>
          <div className="flex items-center gap-3">
            {elapsedTime !== undefined && status === "loading" && (
              <span className="text-xs font-normal text-gray-600">
                Прошло: {formatTime(elapsedTime)}
              </span>
            )}
            <span className="text-sm font-normal text-gray-600">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              status === "error"
                ? "bg-red-500"
                : status === "success"
                ? "bg-green-500"
                : "bg-blue-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {status === "error" && errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-semibold mb-2 text-base">Ошибка обработки</div>
          <div className="text-red-600 text-sm font-normal mb-3">{errorMessage}</div>
          <div className="text-xs font-normal text-red-600">
            <p>Проверьте:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Файл .env.local существует и содержит OPENAI_API_KEY</li>
              <li>API ключ действителен и имеет доступ к модели</li>
              <li>Название модели корректно (gpt-5-mini-2025-08-07)</li>
              <li>Откройте консоль браузера (F12) для детальных логов</li>
            </ul>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-4">
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={index}
                className={`flex-1 p-2 rounded text-xs ${
                  index < currentStep
                    ? "bg-green-100 text-green-800"
                    : index === currentStep - 1
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          {currentStep === totalSteps && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-normal text-blue-900">
                ⏳ Обработка может занять 30-60 секунд в зависимости от размера договора.
                Пожалуйста, подождите...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

