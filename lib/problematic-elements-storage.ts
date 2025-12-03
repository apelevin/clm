import { ProblematicElement, ProblematicElementStatus, ProblematicElementComment, ProblematicElementChange } from "@/types/contract";

const STORAGE_PREFIX = "problematic_element_";

export function getStorageKey(provisionId: string, elementId: string): string {
  return `${STORAGE_PREFIX}${provisionId}_${elementId}`;
}

export function saveProblematicElementData(
  provisionId: string,
  elementId: string,
  data: {
    status?: ProblematicElementStatus;
    comment?: ProblematicElementComment;
    changeHistory?: ProblematicElementChange[];
  }
): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getStorageKey(provisionId, elementId);
    const serialized = JSON.stringify({
      ...data,
      comment: data.comment
        ? {
            ...data.comment,
            timestamp: data.comment.timestamp.toISOString(),
          }
        : undefined,
      changeHistory: data.changeHistory
        ? data.changeHistory.map((change) => ({
            ...change,
            timestamp: change.timestamp.toISOString(),
          }))
        : undefined,
    });
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error("Failed to save problematic element data", error);
  }
}

export function loadProblematicElementData(
  provisionId: string,
  elementId: string
): {
  status?: ProblematicElementStatus;
  comment?: ProblematicElementComment;
  changeHistory?: ProblematicElementChange[];
} | null {
  if (typeof window === "undefined") return null;
  
  try {
    const key = getStorageKey(provisionId, elementId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      status: parsed.status,
      comment: parsed.comment
        ? {
            ...parsed.comment,
            timestamp: new Date(parsed.comment.timestamp),
          }
        : undefined,
      changeHistory: parsed.changeHistory
        ? parsed.changeHistory.map((change: any) => ({
            ...change,
            timestamp: new Date(change.timestamp),
          }))
        : undefined,
    };
  } catch (error) {
    console.error("Failed to load problematic element data", error);
    return null;
  }
}

export function addChangeToHistory(
  provisionId: string,
  elementId: string,
  change: ProblematicElementChange
): void {
  const existing = loadProblematicElementData(provisionId, elementId);
  const changeHistory = existing?.changeHistory || [];
  
  saveProblematicElementData(provisionId, elementId, {
    ...existing,
    changeHistory: [...changeHistory, change],
  });
}

