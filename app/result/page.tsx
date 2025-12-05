"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ContractViewer from "@/components/ContractViewer";
import ContractInterface from "@/components/ContractInterface";
import { useParagraphHighlighter } from "@/components/ParagraphHighlighter";
import Header from "@/components/Header";
import TaskDetailsPanel from "@/components/TaskDetailsPanel";
import ContractVersioningPanel from "@/components/ContractVersioningPanel";
import RiskAnalysisPanel from "@/components/RiskAnalysisPanel";
import { KeyProvision, ClauseRiskAnalysis } from "@/types/contract";
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
  const [selectedRiskProvision, setSelectedRiskProvision] = useState<KeyProvision | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<ClauseRiskAnalysis | null>(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(400);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(600);
  const [isResizingRight, setIsResizingRight] = useState(false);
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
    // Закрываем другие панели при открытии панели задачи
    setIsVersioningPanelOpen(false);
    setSelectedRiskProvision(null);
  };

  const handleRiskClick = async (provision: KeyProvision) => {
    // Закрываем другие панели при открытии панели риска
    setSelectedTask(null);
    setIsVersioningPanelOpen(false);
    
    try {
      setSelectedRiskProvision(provision);
      setRiskAnalysis(null);
      setRiskError(null);
      setIsRiskLoading(true);

      const response = await fetch("/api/analyze-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clauseText: provision.content || "",
          fullContract: contract,
          provisionId: provision.id,
          provisionCategory: provision.category,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось выполнить анализ рисков");
      }

      const data: ClauseRiskAnalysis = await response.json();
      setRiskAnalysis(data);
    } catch (error: any) {
      console.error("Ошибка анализа рисков:", error);
      setRiskError(error?.message || "Не удалось выполнить анализ рисков");
    } finally {
      setIsRiskLoading(false);
    }
  };

  const handleCloseRiskPanel = () => {
    setSelectedRiskProvision(null);
    setRiskAnalysis(null);
    setRiskError(null);
    setIsRiskLoading(false);
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
    // Закрываем панель задачи при открытии панели версионности
    setSelectedTask(null);
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

  // Обработчики для изменения ширины левой панели
  const handleLeftPanelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  // Обработчики для изменения ширины правой панели
  const handleRightPanelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        // Ограничиваем ширину между 300px и 600px
        const clampedWidth = Math.max(300, Math.min(600, newWidth));
        setLeftPanelWidth(clampedWidth);
      } else if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        // Ограничиваем ширину между 400px и 800px
        const clampedWidth = Math.max(400, Math.min(800, newWidth));
        setRightPanelWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, isResizingRight]);

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
        onOpenVersioning={() => {
          setIsVersioningPanelOpen(true);
          // Закрываем другие панели при открытии панели версионности
          setSelectedTask(null);
          setSelectedRiskProvision(null);
        }}
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
        <div className="flex h-[calc(100vh-64px)]">
          {/* Левая панель - Атрибуты */}
          <div 
            className="flex-shrink-0 overflow-y-auto bg-gray-50 border-r border-gray-200 relative"
            style={{ width: `${leftPanelWidth}px` }}
          >
            <ContractInterface 
              contract={contract} 
              onShowSource={handleShowSource}
              onTaskClick={handleTaskClick}
              onRiskClick={handleRiskClick}
            />
            
            {/* Resize handle для левой панели */}
            <div
              onMouseDown={handleLeftPanelMouseDown}
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize group ${
                isResizingLeft ? "bg-blue-500" : "hover:bg-blue-200"
              } transition-colors`}
              style={{ zIndex: 10 }}
            >
              <div className={`absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-1 h-12 rounded-full transition-colors ${
                isResizingLeft ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
              }`} />
            </div>
          </div>

          {/* Центральная панель - Текст документа */}
          {isDocumentVisible && (
            <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-white">
              <div className="max-w-[800px] mx-auto px-6 py-6">
                <ContractViewer 
                  paragraphs={contract.paragraphs}
                  paragraphChanges={versioningData?.paragraphChanges}
                  onParagraphClick={handleParagraphClick}
                />
              </div>
            </div>
          )}

          {/* Правая панель - Версионность */}
          {isVersioningPanelOpen && versioningData && (
            <div 
              className="flex-shrink-0 border-l border-gray-200 bg-white relative"
              style={{ width: `${rightPanelWidth}px` }}
            >
              {/* Resize handle для правой панели */}
              <div
                onMouseDown={handleRightPanelMouseDown}
                className={`absolute top-0 left-0 w-1 h-full cursor-col-resize group ${
                  isResizingRight ? "bg-blue-500" : "hover:bg-blue-200"
                } transition-colors`}
                style={{ zIndex: 10 }}
              >
                <div className={`absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-1 h-12 rounded-full transition-colors ${
                  isResizingRight ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
                }`} />
              </div>
              
              <ContractVersioningPanel
                data={versioningData}
                isOpen={isVersioningPanelOpen}
                onClose={() => setIsVersioningPanelOpen(false)}
                onShowInText={handleShowInText}
              />
            </div>
          )}

          {/* Правая панель - Детали задачи */}
          {selectedTask && (
            <div 
              className="flex-shrink-0 border-l border-gray-200 bg-white relative"
              style={{ width: `${rightPanelWidth}px` }}
            >
              {/* Resize handle для правой панели */}
              <div
                onMouseDown={handleRightPanelMouseDown}
                className={`absolute top-0 left-0 w-1 h-full cursor-col-resize group ${
                  isResizingRight ? "bg-blue-500" : "hover:bg-blue-200"
                } transition-colors`}
                style={{ zIndex: 10 }}
              >
                <div className={`absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-1 h-12 rounded-full transition-colors ${
                  isResizingRight ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
                }`} />
              </div>
              
              <TaskDetailsPanel
                task={selectedTask}
                onClose={handleClosePanel}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}

          {/* Правая панель - Анализ риска */}
          {selectedRiskProvision && (
            <div 
              className="flex-shrink-0 border-l border-gray-200 bg-white relative"
              style={{ width: `${rightPanelWidth}px` }}
            >
              {/* Resize handle для правой панели */}
              <div
                onMouseDown={handleRightPanelMouseDown}
                className={`absolute top-0 left-0 w-1 h-full cursor-col-resize group ${
                  isResizingRight ? "bg-blue-500" : "hover:bg-blue-200"
                } transition-colors`}
                style={{ zIndex: 10 }}
              >
                <div className={`absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-1 h-12 rounded-full transition-colors ${
                  isResizingRight ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
                }`} />
              </div>
              
              <RiskAnalysisPanel
                provision={selectedRiskProvision}
                riskResult={riskAnalysis}
                onClose={handleCloseRiskPanel}
                isLoading={isRiskLoading}
                error={riskError}
                contractNumber={contract?.contractState?.number}
              />
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
