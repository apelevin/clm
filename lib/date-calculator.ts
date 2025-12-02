import { RelativeDate } from "@/types/contract";

/**
 * Проверяет, является ли день рабочим (понедельник-пятница)
 */
export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Понедельник = 1, Пятница = 5
}

/**
 * Добавляет рабочие дни к дате
 */
export function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let daysAdded = 0;

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Вычитает рабочие дни из даты
 */
export function subtractWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let daysSubtracted = 0;

  while (daysSubtracted < days) {
    result.setDate(result.getDate() - 1);
    if (isWorkingDay(result)) {
      daysSubtracted++;
    }
  }

  return result;
}

/**
 * Рассчитывает конкретную дату выполнения задачи на основе относительной даты и даты наступления стадии
 */
export function calculateTaskDeadline(
  relativeDate: RelativeDate,
  stateStartDate: Date
): Date {
  const { value, type, direction } = relativeDate;

  if (direction === "after") {
    if (type === "working") {
      return addWorkingDays(stateStartDate, value);
    } else {
      // calendar days
      const result = new Date(stateStartDate);
      result.setDate(result.getDate() + value);
      return result;
    }
  } else {
    // direction === "before"
    if (type === "working") {
      return subtractWorkingDays(stateStartDate, value);
    } else {
      // calendar days
      const result = new Date(stateStartDate);
      result.setDate(result.getDate() - value);
      return result;
    }
  }
}

/**
 * Форматирует дату для отображения
 */
export function formatDeadline(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Форматирует дату в коротком формате (ДД.ММ.ГГГГ)
 */
export function formatDeadlineShort(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Проверяет, просрочена ли задача
 */
export function isTaskOverdue(deadline: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

/**
 * Проверяет, приближается ли срок выполнения задачи (менее 3 дней)
 */
export function isTaskApproaching(deadline: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

