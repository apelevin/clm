"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ContractViewer from "@/components/ContractViewer";
import ContractInterface from "@/components/ContractInterface";
import { useParagraphHighlighter } from "@/components/ParagraphHighlighter";
import Header from "@/components/Header";
import MainNavigation from "@/components/MainNavigation";
import { ParsedContract, SourceRef } from "@/types/contract";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [contract, setContract] = useState<ParsedContract | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState("obligations");
  const { highlightParagraphs, clearHighlight, scrollToParagraph } =
    useParagraphHighlighter();

  useEffect(() => {
    let mounted = true;

    // Сначала пробуем получить данные из sessionStorage
    try {
      const storedData = sessionStorage.getItem("contractData");
      if (storedData) {
        console.log("Данные найдены в sessionStorage, длина:", storedData.length);
        try {
          const parsed = JSON.parse(storedData);
          console.log("Данные успешно распарсены:", {
            paragraphs: parsed.paragraphs?.length || 0,
            provisions: parsed.keyProvisions?.length || 0,
            payments: parsed.paymentObligations?.length || 0,
            states: parsed.possibleStates?.length || 0,
            hasContractState: !!parsed.contractState,
          });
          
          // Проверяем, что данные валидны
          if (!parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
            throw new Error("Невалидная структура данных: отсутствуют paragraphs");
          }
          
          if (mounted) {
            setContract(parsed);
            setIsLoading(false);
            console.log("Данные установлены в состояние, контракт готов к отображению");
            // Очищаем sessionStorage только после успешной установки состояния
            setTimeout(() => {
              sessionStorage.removeItem("contractData");
              console.log("sessionStorage очищен");
            }, 1000);
          }
          return;
        } catch (parseError: any) {
          console.error("Ошибка парсинга данных из sessionStorage:", parseError);
          console.error("Детали ошибки:", parseError?.message, parseError?.stack);
          sessionStorage.removeItem("contractData");
          if (mounted) {
            setIsLoading(false);
            router.push("/");
          }
        }
      } else {
        console.log("Данные не найдены в sessionStorage");
      }
    } catch (storageError: any) {
      console.error("Ошибка чтения из sessionStorage:", storageError);
      console.error("Детали ошибки:", storageError?.message);
    }

    // Fallback: пробуем получить из URL параметров (для обратной совместимости)
    const data = searchParams.get("data");
    if (data) {
      console.log("Попытка получить данные из URL параметров");
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        if (mounted) {
          setContract(parsed);
          setIsLoading(false);
        }
        return;
      } catch (error) {
        console.error("Error parsing contract data from URL:", error);
        if (mounted) {
          setIsLoading(false);
          router.push("/");
        }
        return;
      }
    }

    // Если данных нет ни в sessionStorage, ни в URL, ждём немного и перенаправляем
    console.log("Данные не найдены, ожидание перед перенаправлением...");
    const timeout = setTimeout(() => {
      if (mounted && !contract) {
        console.log("Таймаут ожидания данных, перенаправление на главную");
        setIsLoading(false);
        router.push("/");
      }
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [searchParams, router]);

  const handleShowSource = (sourceRefs: SourceRef[]) => {
    clearHighlight();
    const paragraphIds: string[] = [];
    sourceRefs.forEach((ref) => {
      if (ref.paragraphIds) {
        paragraphIds.push(...ref.paragraphIds);
      }
    });

    if (paragraphIds.length > 0) {
      highlightParagraphs(paragraphIds);
      scrollToParagraph(paragraphIds[0]);
    }
  };

  if (isLoading || !contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">
          {isLoading ? "Загрузка данных..." : "Данные не найдены"}
        </div>
      </div>
    );
  }

  // Определяем название договора
  const contractTitle = contract?.contractState?.number 
    ? `Договор № ${contract.contractState.number}`
    : "Договор услуг";

  return (
    <div className="min-h-screen bg-white">
      <Header contractTitle={contractTitle} />
      <MainNavigation activeTab={activeMainTab} onTabChange={setActiveMainTab} />
      
      {showRawJson ? (
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">JSON данные</h1>
            <button
              onClick={() => setShowRawJson(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
            >
              Закрыть JSON
            </button>
          </div>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto text-xs">
            {JSON.stringify(contract, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-144px)]">
          <div className="border-r border-gray-200 overflow-y-auto">
            <ContractViewer paragraphs={contract.paragraphs} />
          </div>
          <div className="overflow-y-auto bg-gray-50">
            <ContractInterface 
              contract={contract} 
              onShowSource={handleShowSource}
              activeMainTab={activeMainTab}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}

