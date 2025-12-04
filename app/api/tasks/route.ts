import { NextResponse } from "next/server";

export interface TaskListItem {
  id: string;
  contractId: string;
  contractNumber?: string;
  stateId: string;
  stateLabel: string;
  stateDescription?: string;
  taskId: string;
  label: string;
  description?: string;
  assignedTo: "customer" | "executor" | "both";
  priority?: "primary" | "secondary";
  status: "open" | "inProgress" | "awaitingAction" | "completed" | "overdue";
  deadline?: string; // ISO string
  deadlineDescription?: string;
  category?: string;
  customer?: string;
  executor?: string;
  lastChanged?: string; // ISO string
}

// Генерируем mockup данные
function generateMockTasks(): TaskListItem[] {
  const contracts = [
    { id: "contr1", number: "43/25", customer: "ООО Рога и Копыта", executor: "ИП Иванов" },
    { id: "contr2", number: "46/25", customer: "АО Стройкомплекс", executor: "ООО Услуги" },
    { id: "contr3", number: "12/24", customer: "ООО Технологии", executor: "ИП Петров" },
  ];

  const states = [
    { id: "state1", label: "Договор выполняется", description: "Договор находится в стадии активного выполнения работ" },
    { id: "state2", label: "Подписано приложение", description: "Приложение к договору подписано" },
    { id: "state3", label: "На согласовании", description: "Договор находится на стадии согласования" },
    { id: "state4", label: "Расторгнут", description: "Договор расторгнут" },
    { id: "state5", label: "Проект договора", description: "Договор находится в стадии проекта" },
  ];

  const taskTemplates = [
    { label: "Оплатить предоплату", description: "Предоплата должна быть внесена в течение 5 рабочих дней", category: "оплата" },
    { label: "Предоставить доступ по Приложению", description: "Доступ должен быть предоставлен в течение 5 рабочих дней", category: "доступ" },
    { label: "Подписать акт сдачи-приемки", description: "Акт должен быть подписан не позднее 3 дней после завершения работ", category: "приемка" },
    { label: "Предоставить техническое задание", description: "ТЗ должно быть предоставлено до начала работ", category: "документы" },
    { label: "Устранить выявленные недостатки", description: "Недостатки должны быть устранены в течение 10 дней", category: "ответственность" },
    { label: "Оплатить услуги", description: "Оплата производится ежемесячно до 10 числа", category: "оплата" },
    { label: "Направить уведомление", description: "Уведомление должно быть направлено за 7 дней до события", category: "коммуникации" },
    { label: "Согласовать изменения", description: "Изменения подлежат согласованию в течение 5 дней", category: "сроки" },
  ];

  const statuses: TaskListItem["status"][] = ["open", "inProgress", "awaitingAction", "completed", "overdue"];
  const parties: TaskListItem["assignedTo"][] = ["customer", "executor", "both"];

  const tasks: TaskListItem[] = [];
  let taskIdCounter = 1;

  contracts.forEach((contract) => {
    const contractStates = states.slice(0, Math.floor(Math.random() * 3) + 2); // 2-4 стадии на договор
    
    contractStates.forEach((state) => {
      const tasksCount = Math.floor(Math.random() * 4) + 2; // 2-5 задач на стадию
      
      for (let i = 0; i < tasksCount; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const assignedTo = parties[Math.floor(Math.random() * parties.length)];
        
        // Генерируем дату дедлайна (от -10 до +30 дней от сегодня)
        const deadlineDays = Math.floor(Math.random() * 41) - 10;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + deadlineDays);
        
        // Генерируем дату последнего изменения (от 0 до 14 дней назад)
        const lastChangedDays = Math.floor(Math.random() * 15);
        const lastChanged = new Date();
        lastChanged.setDate(lastChanged.getDate() - lastChangedDays);

        tasks.push({
          id: `task_${taskIdCounter++}`,
          contractId: contract.id,
          contractNumber: contract.number,
          stateId: state.id,
          stateLabel: state.label,
          stateDescription: state.description,
          taskId: `task_${taskIdCounter}`,
          label: template.label,
          description: template.description,
          assignedTo,
          priority: Math.random() > 0.5 ? "primary" : "secondary",
          status,
          deadline: deadline.toISOString(),
          deadlineDescription: `через ${Math.abs(deadlineDays)} ${deadlineDays === 1 ? "день" : deadlineDays < 5 ? "дня" : "дней"}`,
          category: template.category,
          customer: contract.customer,
          executor: contract.executor,
          lastChanged: lastChanged.toISOString(),
        });
      }
    });
  });

  return tasks;
}

export async function GET() {
  try {
    // Возвращаем mockup данные
    const tasks = generateMockTasks();
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("Ошибка при получении списка задач:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить список задач" },
      { status: 500 }
    );
  }
}
