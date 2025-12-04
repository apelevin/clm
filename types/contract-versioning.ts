// Типы для системы версионности договоров

export interface ClauseChange {
  id: string;
  paragraphId: string; // ID абзаца, к которому относится изменение
  original: string;
  improved: string;
  reason: string;
  category: string;
  riskLevel: string;
  diffWords: number;
  diffParagraphs: number;
  author: "AI" | string; // имя пользователя
  date: string;
  riskId?: string; // ссылка на риск
  justification?: string[]; // список обоснований (bullet points)
}

export interface DocumentVersion {
  version: string;
  summary: string;
  changes: string[]; // список изменений
  author: "AI" | string;
  date: string;
  changeIds?: string[]; // ID изменений в этой версии
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target?: string; // на что действие
  timestamp: string;
  type: "change" | "risk" | "recommendation" | "status";
  changeId?: string; // ссылка на изменение, если есть
}

export interface ParagraphChange {
  paragraphId: string;
  changeId: string;
  status: "improved" | "hasRisks" | "newClause"; // 🟢 улучшено, 🟡 есть риски, 🔵 новая формулировка
  tooltip?: {
    reason: string;
    changeId: string;
    riskId?: string;
  };
}

export interface VersioningData {
  changes: ClauseChange[];
  versions: DocumentVersion[];
  activity: ActivityItem[];
  paragraphChanges: ParagraphChange[]; // связь абзацев с изменениями
}

