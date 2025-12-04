"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ContractViewer from "@/components/ContractViewer";
import ContractInterface from "@/components/ContractInterface";
import { useParagraphHighlighter } from "@/components/ParagraphHighlighter";
import Header from "@/components/Header";
import TaskDetailsPanel from "@/components/TaskDetailsPanel";
import ContractVersioningPanel from "@/components/ContractVersioningPanel";
import { ParsedContract, SourceRef, ContractTask } from "@/types/contract";
import { TaskListItem } from "@/app/api/tasks/route";
import { VersioningData } from "@/types/contract-versioning";
import { calculateTaskDeadline } from "@/lib/date-calculator";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [contract, setContract] = useState<ParsedContract | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const [versioningData, setVersioningData] = useState<VersioningData | null>(null);
  const [isVersioningPanelOpen, setIsVersioningPanelOpen] = useState(false);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const { highlightParagraphs, clearHighlight, scrollToParagraph } =
    useParagraphHighlighter();

  useEffect(() => {
    let mounted = true;

    // Проверяем наличие параметра contract в URL (загрузка по ID)
    const contractId = searchParams.get("contract");
    if (contractId) {
      // Загружаем договор по ID через API
      fetch(`/api/contracts/${contractId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Договор не найден");
          }
          return response.json();
        })
        .then(async (data: ParsedContract) => {
          if (mounted) {
            setContract(data);
            setIsLoading(false);
            
            // Загружаем данные версионности
            try {
              const versioningResponse = await fetch(`/api/contracts/${contractId}/versioning`);
              if (versioningResponse.ok) {
                const versioningData: VersioningData = await versioningResponse.json();
                if (mounted) {
                  setVersioningData(versioningData);
                }
              }
            } catch (error) {
              console.error("Ошибка при загрузке данных версионности:", error);
            }
          }
        })
        .catch((error) => {
          console.error("Ошибка при загрузке договора:", error);
          if (mounted) {
            setIsLoading(false);
            router.push("/");
          }
        });
      return;
    }

    // Сначала пробуем получить данные из sessionStorage (для обратной совместимости)
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

  // Преобразуем ContractTask в TaskListItem для панели
  const convertTaskToListItem = (task: ContractTask, stateLabel: string, stateId: string): TaskListItem => {
    const contractId = searchParams.get("contract") || "unknown";
    const contractState = contract?.contractState || {};
    const contractNumber = contractState.number;
    
    // Определяем статус задачи из localStorage или используем "open" по умолчанию
    const taskStatuses = typeof window !== "undefined" 
      ? JSON.parse(localStorage.getItem("task_statuses") || "{}")
      : {};
    const status = taskStatuses[`${contractId}_${stateId}_${task.id}`] || "open";

    // Рассчитываем дедлайн, если есть
    let deadline: string | undefined;
    if (task.deadline && contract?.possibleStates) {
      const state = contract.possibleStates.find(s => s.id === stateId);
      if (state?.stateStartDate) {
        try {
          const stateStartDate = new Date(state.stateStartDate);
          const deadlineDate = calculateTaskDeadline(task.deadline, stateStartDate);
          deadline = deadlineDate.toISOString();
        } catch (e) {
          // Игнорируем ошибки расчета
        }
      }
    }

    return {
      id: `${contractId}_${stateId}_${task.id}`,
      contractId,
      contractNumber,
      stateId,
      stateLabel,
      stateDescription: contract?.possibleStates?.find(s => s.id === stateId)?.description,
      taskId: task.id,
      label: task.label,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: status as TaskListItem["status"],
      deadline,
      deadlineDescription: task.deadline?.description,
      category: undefined, // Можно определить из связанных положений
      customer: contractState.parties?.customer?.name || contractState.parties?.customer?.fullName,
      executor: contractState.parties?.executor?.name || contractState.parties?.executor?.fullName,
      lastChanged: new Date().toISOString(),
    };
  };

  const handleTaskClick = (task: ContractTask, stateLabel: string, stateId: string) => {
    const taskListItem = convertTaskToListItem(task, stateLabel, stateId);
    setSelectedTask(taskListItem);
  };

  const handleClosePanel = () => {
    setSelectedTask(null);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskListItem["status"]) => {
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  const handleParagraphClick = (paragraphId: string, changeId?: string) => {
    setIsVersioningPanelOpen(true);
    if (changeId) {
      setSelectedChangeId(changeId);
    }
  };

  const handleShowInText = (paragraphId: string) => {
    const element = document.getElementById(paragraphId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Подсветка на 2 секунды
      element.classList.add("ring-2", "ring-blue-500");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-blue-500");
      }, 2000);
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
        onOpenVersioning={() => setIsVersioningPanelOpen(true)}
        showVersioningButton={!!versioningData && !showRawJson}
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
            <ContractInterface 
              contract={contract} 
              onShowSource={handleShowSource}
              onTaskClick={handleTaskClick}
            />
          </div>
          {isDocumentVisible && (
            <div className="overflow-y-auto border-l border-gray-200">
              <ContractViewer 
                paragraphs={contract.paragraphs}
                paragraphChanges={versioningData?.paragraphChanges}
                onParagraphClick={handleParagraphClick}
              />
            </div>
          )}
        </div>
      )}

      {/* Боковая панель деталей задачи */}
      {selectedTask && (
        <TaskDetailsPanel
          task={selectedTask}
          onClose={handleClosePanel}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Панель версионности */}
      {versioningData && (
        <ContractVersioningPanel
          data={versioningData}
          isOpen={isVersioningPanelOpen}
          onClose={() => setIsVersioningPanelOpen(false)}
          onShowInText={handleShowInText}
        />
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
