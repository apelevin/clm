import { ActivityLogEntry } from "@/types/contract";

const STORAGE_PREFIX = "activity_log_";
const MAX_LOGS = 100; // Максимальное количество записей в логе

export function getStorageKey(contractNumber?: string): string {
  const contractId = contractNumber || "default";
  return `${STORAGE_PREFIX}${contractId}`;
}

export function logActivity(
  contractNumber: string | undefined,
  entry: Omit<ActivityLogEntry, "id" | "timestamp">
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(contractNumber);
    const logs = getActivityLogs(contractNumber);
    
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Добавляем новую запись в начало и ограничиваем количество
    const updatedLogs = [newEntry, ...logs].slice(0, MAX_LOGS);
    
    const serialized = JSON.stringify(
      updatedLogs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      }))
    );
    
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error("Failed to log activity", error);
  }
}

export function getActivityLogs(contractNumber?: string): ActivityLogEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const key = getStorageKey(contractNumber);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("Failed to load activity logs", error);
    return [];
  }
}

export function clearActivityLogs(contractNumber?: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(contractNumber);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear activity logs", error);
  }
}

