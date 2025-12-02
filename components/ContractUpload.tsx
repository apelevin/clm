"use client";

import { useState } from "react";

interface ContractUploadProps {
  onUpload: (text: string) => void;
  isLoading: boolean;
}

export default function ContractUpload({
  onUpload,
  isLoading,
}: ContractUploadProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 300 * 1024) {
      setError("Размер файла не должен превышать 300 КБ");
      return;
    }

    if (!file.name.endsWith(".txt")) {
      setError("Поддерживаются только файлы .txt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      setError("");
    };
    reader.onerror = () => {
      setError("Ошибка при чтении файла");
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      setError("Введите текст договора или загрузите файл");
      return;
    }

    setError("");
    onUpload(text.trim());
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Загрузите текст договора</h1>

      <div className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            placeholder="Вставьте сюда текст договора или загрузите файл…"
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 inline-block">
              Загрузить файл
            </span>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>

          <p className="text-sm text-gray-500">
            MVP: поддерживаются файлы .txt и текст, вставленный вручную.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Обрабатываем…" : "Обработать договор"}
        </button>
      </div>
    </div>
  );
}

