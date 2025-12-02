"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContractUpload from "@/components/ContractUpload";
import ProgressBar from "@/components/ProgressBar";
import { ParsedContract } from "@/types/contract";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  const simulateProgress = () => {
    const steps = [1, 2, 3, 4];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        setProgressStep(steps[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000); // Увеличено до 2 секунд на этап для более реалистичного прогресса
  };

  const handleUpload = async (text: string) => {
    setIsLoading(true);
    setStatus("loading");
    setProgressStep(1);
    setErrorMessage("");
    setElapsedTime(0);
    
    // Запускаем таймер
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
    
    simulateProgress();

    try {
      console.log("Отправка запроса на обработку договора...");
      const response = await fetch("/api/parse-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      
      console.log("Получен ответ:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error("Ошибка API:", error);
        clearInterval(timerInterval);
        throw new Error(error.error || "Ошибка при обработке договора");
      }

      const data: ParsedContract = await response.json();
      console.log("Данные получены:", {
        paragraphs: data.paragraphs?.length || 0,
        actions: data.actions?.length || 0,
        provisions: data.keyProvisions?.length || 0,
      });
      clearInterval(timerInterval);
      setProgressStep(4);
      setStatus("success");

      // Сохраняем данные в sessionStorage вместо передачи через URL
      try {
        const dataString = JSON.stringify(data);
        sessionStorage.setItem("contractData", dataString);
        console.log("Данные сохранены в sessionStorage, длина:", dataString.length);
        
        // Проверяем, что данные действительно сохранились
        const verifyData = sessionStorage.getItem("contractData");
        if (!verifyData || verifyData !== dataString) {
          throw new Error("Данные не сохранились в sessionStorage");
        }
        console.log("Данные успешно проверены в sessionStorage");
      } catch (storageError) {
        console.error("Ошибка сохранения в sessionStorage:", storageError);
        setIsLoading(false);
        setStatus("error");
        setErrorMessage("Не удалось сохранить данные. Попробуйте снова.");
        return;
      }

      // Переходим на страницу результата через небольшую задержку
      // Используем replace вместо push, чтобы нельзя было вернуться назад к пустой форме
      setTimeout(() => {
        console.log("Переход на страницу результата");
        router.replace("/result");
      }, 300);
    } catch (error: any) {
      console.error("Ошибка при обработке:", error);
      clearInterval(timerInterval);
      setStatus("error");
      setErrorMessage(
        error.message ||
          "Не удалось обработать договор. Попробуйте снова или сократите текст."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {isLoading ? (
        <ProgressBar
          currentStep={progressStep}
          totalSteps={4}
          status={status}
          errorMessage={errorMessage}
          elapsedTime={elapsedTime}
        />
      ) : (
        <ContractUpload onUpload={handleUpload} isLoading={isLoading} />
      )}
    </div>
  );
}

