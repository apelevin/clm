// Типы для структуры договора

export type PartyRole = "customer" | "executor" | "both";

export interface ClauseRef {
  section: string;
  paragraph?: string;
  comment?: string;
}

export interface SourceRef {
  paragraphIds?: string[];
  charRange?: {
    start: number;
    end: number;
  };
  comment?: string;
}

export interface ContractState {
  number?: string;
  date?: string;
  city?: string;
  subject?: string; // Предмет договора
  parties?: {
    customer?: {
      name: string;
      fullName: string;
    };
    executor?: {
      name: string;
      fullName: string;
    };
  };
  totalAmount?: {
    amount: number;
    currency: string;
  };
}

export interface KeyProvision {
  id: string;
  title: string;
  content: string;
  category: string; // Категория обязательна для каждого положения
  visibleFor?: PartyRole; // Для какой стороны обязательство (customer/executor/both)
  sourceRefs: SourceRef[];
  relatedClauses?: ClauseRef[];
  priority?: "primary" | "secondary"; // Основные или второстепенные положения
}

export interface RelativeDate {
  value: number; // Количество дней
  type: "calendar" | "working"; // Календарные или рабочие дни
  direction: "before" | "after"; // До или после даты наступления стадии
  description?: string; // Текстовое описание (например: "через 5 дней", "не позднее 3 рабочих дней")
}

export interface ContractTask {
  id: string;
  label: string; // Название задачи (например: "Оплатить предоплату", "Предоставить материалы")
  description?: string; // Описание задачи
  assignedTo: "customer" | "executor" | "both"; // Кто должен выполнить задачу
  sourceRefs: SourceRef[]; // Ссылки на параграфы-источники
  relatedClauses?: ClauseRef[]; // Связанные пункты договора
  priority?: "primary" | "secondary"; // Приоритет задачи
  deadline?: RelativeDate; // Относительная дата выполнения задачи
}

export interface ContractStatus {
  id: string;
  label: string; // Название состояния (например: "Договор выполняется", "Просрочен контракт")
  description?: string; // Описание состояния (микро-подпись для выпадающего списка)
  sourceRefs: SourceRef[]; // Ссылки на параграфы-источники
  relatedClauses?: ClauseRef[]; // Связанные пункты договора
  tasks?: ContractTask[]; // Задачи, которые должны быть выполнены в этом состоянии
  stateStartDate?: string; // Дата наступления стадии (ISO формат, опционально)
}

export interface Paragraph {
  id: string;
  text: string;
}

export interface PaymentAmount {
  value: number; // Сумма
  currency: string; // Валюта
  type?: "fixed" | "percentage" | "calculated"; // Тип суммы
  formula?: string; // Формула расчета (если calculated)
}

export interface PaymentInstallment {
  number: number; // Номер платежа
  amount: number; // Сумма платежа
  deadline: string; // Срок
}

export interface PaymentSchedule {
  type: "one-time" | "installments" | "milestone" | "periodic";
  dates?: string[]; // Конкретные даты платежей
  deadline?: string; // Срок оплаты
  period?: string; // Периодичность (если periodic)
  installments?: PaymentInstallment[]; // Если installments
}

export interface PaymentObligation {
  id: string;
  payer: "customer" | "executor"; // Кто платит
  recipient: "customer" | "executor"; // Кому платит
  purpose: string; // За что платит (описание)
  amount: PaymentAmount;
  schedule?: PaymentSchedule;
  conditions?: string; // Условия оплаты (предоплата, постоплата, гарантии и т.д.)
  sourceRefs: SourceRef[]; // Ссылки на параграфы-источники
  relatedClauses?: ClauseRef[]; // Связанные пункты договора
}

export interface ParsedContract {
  originalText: string;
  paragraphs: Paragraph[];
  contractState: ContractState;
  keyProvisions: KeyProvision[];
  paymentObligations: PaymentObligation[];
  possibleStates: ContractStatus[]; // Возможные состояния договора
}

// Анализ юридических рисков для отдельного положения

export type RiskType = "неопределённость" | "дисбаланс" | "неправомерность" | "процедурный";
export type ConsequenceSeverity = "легкие" | "средние" | "критичные";
export type RiskParty = "customer" | "executor" | "both";

export interface RiskIndicator {
  riskLevel: "low" | "medium" | "high";
  riskType: RiskType;
  disputeProbability: number; // Процент вероятности спора (0-100)
  consequenceSeverity: ConsequenceSeverity;
}

export interface ProblematicElement {
  element: string; // Описание проблемного элемента
  issue: string; // В чем проблема
}

export interface RiskConsequence {
  description: string; // Что может случиться
  affectedParty: RiskParty; // Кому риск
  probability?: number; // Вероятность (опционально)
}

export interface ImpactAnalysis {
  ifLeftAsIs: string[]; // Последствия, если оставить как есть
  ifFixed: string[]; // Последствия, если исправить
}

export interface ObligationDependency {
  from: string; // От какого обязательства зависит
  to: string; // На какое обязательство влияет
  relationship: string; // Тип связи (активирует, влияет на, приводит к)
}

export interface DependencyGraph {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: ObligationDependency[];
}

export interface TimelineEvent {
  day: number; // День относительно начала (0, 10, +5, +30)
  event: string; // Описание события
  description?: string; // Дополнительное описание
}

export interface BenchmarkComparison {
  element: string; // Элемент для сравнения (например, "Уведомление")
  requirement: string; // Требование (например, "обязано быть")
  status: "present" | "missing" | "partial"; // Статус в исходном тексте
  recommendation?: string; // Рекомендация
  score?: number; // Процент соответствия (0-100)
  description?: string; // Краткое описание стандарта
}

export interface ClauseRiskAnalysis {
  // Существующие поля
  riskLevel: "low" | "medium" | "high";
  risks: string[];
  suggestedClause: string;
  
  // Новые поля
  summary: string; // Краткое резюме в одну строку: "Риск: Средний. Причина: неопределённость условий приостановления"
  indicators: RiskIndicator;
  legalRiskMap: {
    problematicElements: ProblematicElement[];
    consequences: RiskConsequence[];
    conflictProbability: number; // AI-оценка вероятности конфликта (0-100)
  };
  impactAnalysis: ImpactAnalysis;
  dependencyGraph?: DependencyGraph; // Граф зависимостей (опционально, если есть связи)
  benchmark: BenchmarkComparison[]; // Сравнение с рыночными стандартами
  timeline: TimelineEvent[]; // Мини-таймлайн событий
  differences?: string[]; // Краткие отличия рекомендованной формулировки
}

