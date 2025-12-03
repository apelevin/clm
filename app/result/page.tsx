"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ContractViewer from "@/components/ContractViewer";
import ContractInterface from "@/components/ContractInterface";
import { useParagraphHighlighter } from "@/components/ParagraphHighlighter";
import Header from "@/components/Header";
import { ParsedContract, SourceRef } from "@/types/contract";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [contract, setContract] = useState<ParsedContract | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { highlightParagraphs, clearHighlight, scrollToParagraph } =
    useParagraphHighlighter();

  useEffect(() => {
    let mounted = true;

    // Сначала пробуем получить данные из sessionStorage
    try {
      const storedData = sessionStorage.getItem("contractData");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (mounted) {
            setContract(parsed);
            setIsLoading(false);
            // Очищаем sessionStorage только после успешной установки состояния
            setTimeout(() => {
              sessionStorage.removeItem("contractData");
            }, 1000);
          }
          return;
        } catch (parseError) {
          console.error("Ошибка парсинга данных из sessionStorage:", parseError);
          sessionStorage.removeItem("contractData");
        }
      }
    } catch (storageError) {
      console.error("Ошибка чтения из sessionStorage:", storageError);
    }

    // Fallback: пробуем получить из URL параметров (для обратной совместимости)
    const data = searchParams.get("data");
    if (data) {
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
    const timeout = setTimeout(() => {
      if (mounted && !contract) {
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
        <div>
          <p className="text-base font-normal text-gray-600">
            {isLoading ? "Загрузка данных..." : "Данные не найдены"}
          </p>
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
      <Header
        contractTitle={contractTitle}
        isDocumentVisible={isDocumentVisible}
        onToggleDocumentView={() => setIsDocumentVisible((prev) => !prev)}
      />
      
      {showRawJson ? (
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">JSON данные</h1>
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
        <div
          className={`grid grid-cols-1 h-[calc(100vh-64px)] ${
            isDocumentVisible ? "lg:grid-cols-2" : ""
          }`}
        >
          <div className="overflow-y-auto bg-gray-50">
            <ContractInterface contract={contract} onShowSource={handleShowSource} />
          </div>
          {isDocumentVisible && (
            <div className="overflow-y-auto border-l border-gray-200">
              <ContractViewer paragraphs={contract.paragraphs} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div>
          <p className="text-base font-normal text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
