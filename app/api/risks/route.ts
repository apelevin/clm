import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ParsedContract, KeyProvision } from "@/types/contract";
import { loadProblematicElementData } from "@/lib/problematic-elements-storage";

export interface RiskListItem {
  id: string; // уникальный ID риска
  contractId: string;
  contractNumber?: string;
  provisionId: string;
  provisionTitle: string;
  provisionContent: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskType: "неопределённость" | "дисбаланс" | "неправомерность" | "процедурный";
  status: "open" | "confirmed" | "disputed" | "closed";
  disputeProbability: number;
  affectedParty: "customer" | "executor" | "both";
  problematicElement: string; // первый проблемный элемент
  issue: string; // описание проблемы
  lastChanged?: Date;
  isNew?: boolean; // новый за последние 7 дней
  hasDiscussion?: boolean; // есть ли комментарии/обсуждения
  customer?: string;
  executor?: string;
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

    const allRisks: RiskListItem[] = [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      try {
        const filePath = path.join(parsedDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsed: ParsedContract = JSON.parse(fileContent);

        const contractId = file.replace(".json", "");
        const contractState = parsed.contractState || {};
        const contractNumber = contractState.number;
        const customer = contractState.parties?.customer?.name || contractState.parties?.customer?.fullName;
        const executor = contractState.parties?.executor?.name || contractState.parties?.executor?.fullName;

        const keyProvisions: KeyProvision[] = parsed.keyProvisions || [];

        for (const provision of keyProvisions) {
          // Загружаем статус из localStorage (если есть)
          const storedData = loadProblematicElementData(provision.id, provision.id);
          
          // Определяем статус риска
          let status: "open" | "confirmed" | "disputed" | "closed" = "open";
          if (storedData?.status) {
            switch (storedData.status) {
              case "confirmed":
                status = "confirmed";
                break;
              case "disputed":
                status = "disputed";
                break;
              case "closed":
                status = "closed";
                break;
              default:
                status = "open";
            }
          }

          // Генерируем тестовые данные для mock-up
          const riskTypes: ("неопределённость" | "дисбаланс" | "неправомерность" | "процедурный")[] = [
            "неопределённость",
            "дисбаланс",
            "неправомерность",
            "процедурный",
          ];
          
          const riskLevels: ("low" | "medium" | "high" | "critical")[] = ["low", "medium", "high", "critical"];
          
          // Генерируем риск только для некоторых положений (чтобы не было слишком много)
          const shouldHaveRisk = Math.random() > 0.5;
          if (!shouldHaveRisk) continue;

          const randomRiskType = riskTypes[Math.floor(Math.random() * riskTypes.length)];
          const randomRiskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
          const disputeProbability = Math.floor(Math.random() * 100);
          
          // Определяем затронутую сторону на основе visibleFor
          const affectedParty = provision.visibleFor || "both";
          
          // Генерируем проблемный элемент и проблему
          const problematicElements = [
            { element: "Неопределённость формулировки", issue: "Отсутствие четких критериев оценки" },
            { element: "Неясность условий", issue: "Не установлена процедура подтверждения результатов" },
            { element: "Дисбаланс обязательств", issue: "Неравномерное распределение ответственности" },
            { element: "Отсутствие сроков", issue: "Не указаны конкретные временные рамки" },
            { element: "Неопределённость суммы", issue: "Сумма зависит от неопределённых факторов" },
          ];
          const randomElement = problematicElements[Math.floor(Math.random() * problematicElements.length)];

          // Определяем, новый ли риск (за последние 7 дней)
          const lastChanged = storedData?.changeHistory && storedData.changeHistory.length > 0
            ? new Date(storedData.changeHistory[storedData.changeHistory.length - 1].timestamp)
            : new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
          const isNew = lastChanged.getTime() > sevenDaysAgo;

          // Есть ли обсуждение
          const hasDiscussion = storedData?.comment !== undefined || (storedData?.changeHistory && storedData.changeHistory.length > 0);

          const riskItem: RiskListItem = {
            id: `${contractId}_${provision.id}`,
            contractId,
            contractNumber,
            provisionId: provision.id,
            provisionTitle: provision.title,
            provisionContent: provision.content,
            riskLevel: randomRiskLevel,
            riskType: randomRiskType,
            status,
            disputeProbability,
            affectedParty,
            problematicElement: randomElement.element,
            issue: randomElement.issue,
            lastChanged,
            isNew,
            hasDiscussion,
            customer,
            executor,
          };

          allRisks.push(riskItem);
        }
      } catch (error) {
        console.error(`Ошибка при обработке файла ${file}:`, error);
        continue;
      }
    }

    return NextResponse.json(allRisks);
  } catch (error: any) {
    console.error("Ошибка при получении списка рисков:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить список рисков" },
      { status: 500 }
    );
  }
}

