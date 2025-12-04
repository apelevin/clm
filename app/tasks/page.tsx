"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TasksSummary from "@/components/TasksSummary";
import TasksTable from "@/components/TasksTable";
import TasksGroupedView from "@/components/TasksGroupedView";
import TaskDetailsPanel from "@/components/TaskDetailsPanel";
import { TaskListItem } from "@/app/api/tasks/route";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>("all");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Режим отображения
  const [groupByContract, setGroupByContract] = useState<boolean>(false);

  // Боковая панель
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error("Не удалось загрузить список задач");
      }
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке задач:", err);
      setError(err.message || "Произошла ошибка при загрузке");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: TaskListItem) => {
    setSelectedTask(task);
  };

  const handleClosePanel = () => {
    setSelectedTask(null);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskListItem["status"]) => {
    // Обновляем статус задачи в списке
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    // Обновляем статус в выбранной задаче
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  const handleFilterClick = (filter: { type: string; value: any }) => {
    switch (filter.type) {
      case "overdue":
        setStatusFilter("overdue");
        break;
      case "awaitingAction":
        setStatusFilter("awaitingAction");
        break;
      case "inProgress":
        setStatusFilter("inProgress");
        break;
      case "completed":
        setStatusFilter("completed");
        break;
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Фильтр по статусу
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // Фильтр по стадии договора
      if (stateFilter !== "all" && task.stateLabel !== stateFilter) {
        return false;
      }

      // Фильтр по договору
      if (contractFilter !== "all" && task.contractId !== contractFilter && task.contractNumber !== contractFilter) {
        return false;
      }

      // Фильтр по контрагенту
      if (counterpartyFilter !== "all") {
        const matchesCustomer = task.customer?.toLowerCase().includes(counterpartyFilter.toLowerCase());
        const matchesExecutor = task.executor?.toLowerCase().includes(counterpartyFilter.toLowerCase());
        if (!matchesCustomer && !matchesExecutor) {
          return false;
        }
      }

      // Фильтр по стороне
      if (partyFilter !== "all" && task.assignedTo !== partyFilter) {
        return false;
      }

      // Фильтр по категории
      if (categoryFilter !== "all" && task.category !== categoryFilter) {
        return false;
      }

      // Фильтр просроченных
      if (overdueOnly && task.status !== "overdue") {
        return false;
      }

      return true;
    });
  }, [tasks, statusFilter, stateFilter, contractFilter, counterpartyFilter, partyFilter, categoryFilter, overdueOnly]);

  // Получаем уникальные значения для фильтров
  const contracts = useMemo(() => {
    const unique = new Set<string>();
    tasks.forEach((t) => {
      if (t.contractNumber) unique.add(t.contractNumber);
      else unique.add(t.contractId);
    });
    return Array.from(unique).sort();
  }, [tasks]);

  const counterparties = useMemo(() => {
    const unique = new Set<string>();
    tasks.forEach((t) => {
      if (t.customer) unique.add(t.customer);
      if (t.executor) unique.add(t.executor);
    });
    return Array.from(unique).sort();
  }, [tasks]);

  const states = useMemo(() => {
    const unique = new Set<string>();
    tasks.forEach((t) => {
      unique.add(t.stateLabel);
    });
    return Array.from(unique).sort();
  }, [tasks]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    tasks.forEach((t) => {
      if (t.category) unique.add(t.category);
    });
    return Array.from(unique).sort();
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeItem="tasks" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-base font-normal text-gray-600">Загрузка задач...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeItem="tasks" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeItem="tasks" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Задачи
            </h1>
            <p className="text-gray-600">
              Операционный центр по всем договорам портфеля
            </p>
          </div>

          {/* Сводка задач */}
          <TasksSummary tasks={tasks} onFilterClick={handleFilterClick} />

          {/* Фильтры */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус задачи
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все</option>
                  <option value="open">Открыто</option>
                  <option value="inProgress">На исполнении</option>
                  <option value="awaitingAction">Ожидает действий</option>
                  <option value="completed">Выполнено</option>
                  <option value="overdue">Просрочено</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Стадия договора
                </label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все стадии</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Договор
                </label>
                <select
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все договоры</option>
                  {contracts.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Контрагент
                </label>
                <select
                  value={counterpartyFilter}
                  onChange={(e) => setCounterpartyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все контрагенты</option>
                  {counterparties.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сторона
                </label>
                <select
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все стороны</option>
                  <option value="customer">Заказчик</option>
                  <option value="executor">Исполнитель</option>
                  <option value="both">Обе стороны</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория обязательства
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все категории</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overdueOnly}
                    onChange={(e) => setOverdueOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Показать только просроченные
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Переключатель режима отображения */}
          <div className="mb-4 flex items-center justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByContract}
                onChange={(e) => setGroupByContract(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Группировать по договору
              </span>
            </label>
          </div>

          {/* Таблица или группированный вид */}
          {groupByContract ? (
            <TasksGroupedView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          ) : (
            <TasksTable tasks={filteredTasks} onTaskClick={handleTaskClick} />
          )}

          {/* Боковая панель деталей задачи */}
          {selectedTask && (
            <TaskDetailsPanel
              task={selectedTask}
              onClose={handleClosePanel}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
