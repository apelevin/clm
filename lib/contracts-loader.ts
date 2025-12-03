import fs from "fs";
import path from "path";
import { ParsedContract } from "@/types/contract";

/**
 * Загружает список всех договоров из папки contracts/parsed/
 */
export async function getContractsList(): Promise<any[]> {
  try {
    const response = await fetch("/api/contracts");
    if (!response.ok) {
      throw new Error("Не удалось загрузить список договоров");
    }
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке списка договоров:", error);
    return [];
  }
}

/**
 * Загружает конкретный договор по ID (имени файла без расширения)
 * @param contractId - ID договора (например, "contr1")
 */
export function loadContractById(contractId: string): ParsedContract | null {
  try {
    const parsedDir = path.join(process.cwd(), "contracts", "parsed");
    const filePath = path.join(parsedDir, `${contractId}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`Файл договора не найден: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed: ParsedContract = JSON.parse(fileContent);
    return parsed;
  } catch (error) {
    console.error(`Ошибка при загрузке договора ${contractId}:`, error);
    return null;
  }
}

/**
 * Загружает конкретный договор по ID на клиенте (через API)
 */
export async function loadContractByIdClient(contractId: string): Promise<ParsedContract | null> {
  try {
    const response = await fetch(`/api/contracts/${contractId}`);
    if (!response.ok) {
      throw new Error("Не удалось загрузить договор");
    }
    return await response.json();
  } catch (error) {
    console.error(`Ошибка при загрузке договора ${contractId}:`, error);
    return null;
  }
}

