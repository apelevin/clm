import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ParsedContract } from "@/types/contract";
import { getActivityLogs } from "@/lib/activity-logger";

export interface ContractListItem {
  id: string; // имя файла без расширения (contr1, contr2, ...)
  fileName: string; // полное имя файла (contr1.json)
  number?: string; // номер договора
  date?: string; // дата договора
  customer?: string; // имя заказчика
  executor?: string; // имя исполнителя
  amount?: number; // сумма договора
  currency?: string; // валюта
  lastUpdated?: Date; // дата последнего обновления (из Activity log)
}

export async function GET() {
  try {
    const parsedDir = path.join(process.cwd(), "contracts", "parsed");

    if (!fs.existsSync(parsedDir)) {
      return NextResponse.json([]);
    }

    const files = fs
      .readdirSync(parsedDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    const contracts: ContractListItem[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(parsedDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsed: ParsedContract = JSON.parse(fileContent);

        const id = file.replace(".json", "");
        const contractState = parsed.contractState || {};

        // Получаем дату последнего обновления из Activity log
        const activityLogs = getActivityLogs(contractState.number);
        const lastActivity = activityLogs.length > 0 ? activityLogs[0] : null;

        const contractItem: ContractListItem = {
          id,
          fileName: file,
          number: contractState.number,
          date: contractState.date,
          customer: contractState.parties?.customer?.name || contractState.parties?.customer?.fullName,
          executor: contractState.parties?.executor?.name || contractState.parties?.executor?.fullName,
          amount: contractState.totalAmount?.amount,
          currency: contractState.totalAmount?.currency,
          lastUpdated: lastActivity ? new Date(lastActivity.timestamp) : undefined,
        };

        contracts.push(contractItem);
      } catch (error) {
        console.error(`Ошибка при обработке файла ${file}:`, error);
        // Пропускаем файлы с ошибками
        continue;
      }
    }

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error("Ошибка при получении списка договоров:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить список договоров" },
      { status: 500 }
    );
  }
}

