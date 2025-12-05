import { NextRequest, NextResponse } from "next/server";
import { VersioningData, ClauseChange, DocumentVersion, ActivityItem, ParagraphChange } from "@/types/contract-versioning";

// Генерируем mockup данные для версионности договора
function generateVersioningData(contractId: string): VersioningData {
  const changes: ClauseChange[] = [
    {
      id: "change_001",
      paragraphId: "p5",
      original: "Оплата производится по факту выполнения работ.",
      improved: "Заказчик производит оплату в течение 10 рабочих дней с момента подписания акта сдачи-приемки выполненных работ, но не позднее 15 числа месяца, следующего за месяцем выполнения работ.",
      reason: "Отсутствие конкретного срока оплаты создаёт неопределённость и риск задержки платежей.",
      category: "оплата",
      riskLevel: "Высокий",
      diffWords: 12,
      diffParagraphs: 1,
      author: "AI",
      date: "2025-12-03T10:30:00",
      riskId: "risk_001",
      justification: [
        "Устанавливает конкретный срок оплаты (10 рабочих дней)",
        "Определяет момент начала отсчета (подписание акта)",
        "Устанавливает верхний предел (15 число месяца)",
        "Исключает возможность произвольной задержки"
      ],
    },
    {
      id: "change_002",
      paragraphId: "p12",
      original: "Исполнитель несет ответственность за качество работ.",
      improved: "Исполнитель несет ответственность за ненадлежащее качество выполненных работ в соответствии с законодательством РФ. При обнаружении недостатков в течение гарантийного срока Исполнитель обязуется устранить их за свой счет в течение 10 рабочих дней. За каждый день просрочки устранения недостатков Исполнитель уплачивает Заказчику неустойку в размере 0,1% от стоимости работ, но не более 10% от общей суммы договора.",
      reason: "Формулировка слишком общая, не определяет конкретные виды ответственности и размеры санкций.",
      category: "ответственность",
      riskLevel: "Средний",
      diffWords: 45,
      diffParagraphs: 1,
      author: "AI",
      date: "2025-12-03T11:15:00",
      riskId: "risk_002",
      justification: [
        "Определяет гарантийный срок",
        "Устанавливает механизм устранения недостатков",
        "Вводит неустойку с четким расчетом",
        "Предусматривает ограничение размера ответственности"
      ],
    },
    {
      id: "change_003",
      paragraphId: "p8",
      original: "Срок выполнения работ определяется по согласованию сторон.",
      improved: "Срок выполнения работ составляет 60 (шестьдесят) календарных дней с момента подписания настоящего договора. По согласованию Сторон срок выполнения работ может быть изменен путем подписания дополнительного соглашения к настоящему договору.",
      reason: "Открытая формулировка без конкретных временных рамок создает риск бесконечного затягивания проекта.",
      category: "сроки",
      riskLevel: "Высокий",
      diffWords: 8,
      diffParagraphs: 1,
      author: "AI",
      date: "2025-12-03T12:00:00",
      riskId: "risk_003",
      justification: [
        "Устанавливает конкретный срок (60 дней)",
        "Определяет точку отсчета (подписание договора)",
        "Формализует механизм изменения сроков"
      ],
    },
    {
      id: "change_004",
      paragraphId: "p15",
      original: "Приемка работ осуществляется Заказчиком.",
      improved: "Приемка выполненных работ осуществляется Заказчиком в течение 5 (пяти) рабочих дней с момента получения уведомления от Исполнителя о готовности работ. Акт сдачи-приемки подписывается обеими сторонами. В случае неподписания акта Заказчиком в течение указанного срока без мотивированного отказа работы считаются принятыми.",
      reason: "Не определены сроки приемки, порядок оформления акта и последствия отказа от приемки.",
      category: "приемка",
      riskLevel: "Средний",
      diffWords: 25,
      diffParagraphs: 1,
      author: "Иванов И.И.",
      date: "2025-12-04T09:20:00",
      riskId: "risk_004",
      justification: [
        "Устанавливает четкие сроки приемки (5 дней)",
        "Определяет порядок оформления акта",
        "Предусматривает последствия молчания"
      ],
    },
  ];

  const versions: DocumentVersion[] = [
    {
      version: "1.0",
      summary: "Исходный текст договора",
      changes: [],
      author: "AI",
      date: "2025-12-01T10:00:00",
    },
    {
      version: "1.1",
      summary: "Исправлено 3 риска, заменено 7 формулировок",
      changes: [
        "Исправлен риск по оплате",
        "Заменена формулировка ответственности",
        "Уточнены сроки выполнения работ",
        "Добавлены уточнения сроков",
        "Улучшена формулировка приемки",
        "Добавлены гарантийные обязательства",
        "Уточнены условия конфиденциальности"
      ],
      author: "AI",
      date: "2025-12-03T14:30:00",
      changeIds: ["change_001", "change_002", "change_003"],
    },
    {
      version: "1.2",
      summary: "Применена новая формулировка по пункту приемки",
      changes: [
        "Применена рекомендованная формулировка по приемке работ",
        "Уточнены сроки приемки"
      ],
      author: "Иванов И.И.",
      date: "2025-12-04T09:30:00",
      changeIds: ["change_004"],
    },
  ];

  const activity: ActivityItem[] = [
    {
      id: "activity_001",
      actor: "AI",
      action: "предложил улучшенную формулировку",
      target: "пункт оплаты",
      timestamp: "2025-12-03T10:30:00",
      type: "recommendation",
      changeId: "change_001",
    },
    {
      id: "activity_002",
      actor: "AI",
      action: "применил изменение",
      target: "Оплата производится по факту...",
      timestamp: "2025-12-03T10:31:00",
      type: "change",
      changeId: "change_001",
    },
    {
      id: "activity_003",
      actor: "AI",
      action: "внёс изменение",
      target: "Претензионный порядок",
      timestamp: "2025-12-03T11:15:00",
      type: "change",
      changeId: "change_002",
    },
    {
      id: "activity_004",
      actor: "Соколова М.В.",
      action: "подтвердила риск",
      target: "пункт 4.2",
      timestamp: "2025-12-03T13:45:00",
      type: "risk",
    },
    {
      id: "activity_005",
      actor: "Иванов И.И.",
      action: "внёс изменение",
      target: "Приемка работ",
      timestamp: "2025-12-04T09:20:00",
      type: "change",
      changeId: "change_004",
    },
    {
      id: "activity_006",
      actor: "AI",
      action: "предложил улучшенную формулировку, применено",
      timestamp: "2025-12-04T10:00:00",
      type: "recommendation",
    },
  ];

  // Связь абзацев с изменениями
  const paragraphChanges: ParagraphChange[] = [
    {
      paragraphId: "p5",
      changeId: "change_001",
      status: "improved",
      tooltip: {
        reason: "Улучшена формулировка оплаты",
        changeId: "change_001",
        riskId: "risk_001",
      },
    },
    {
      paragraphId: "p12",
      changeId: "change_002",
      status: "improved",
      tooltip: {
        reason: "Конкретизирована ответственность",
        changeId: "change_002",
        riskId: "risk_002",
      },
    },
    {
      paragraphId: "p8",
      changeId: "change_003",
      status: "improved",
      tooltip: {
        reason: "Уточнены сроки выполнения",
        changeId: "change_003",
        riskId: "risk_003",
      },
    },
    {
      paragraphId: "p15",
      changeId: "change_004",
      status: "improved",
      tooltip: {
        reason: "Улучшена процедура приемки",
        changeId: "change_004",
        riskId: "risk_004",
      },
    },
    {
      paragraphId: "p20",
      changeId: "",
      status: "hasRisks",
      tooltip: {
        reason: "Обнаружен нерешенный риск",
        changeId: "",
        riskId: "risk_005",
      },
    },
    {
      paragraphId: "p25",
      changeId: "",
      status: "newClause",
      tooltip: {
        reason: "Добавлена новая формулировка AI",
        changeId: "",
      },
    },
  ];

  return {
    changes,
    versions,
    activity,
    paragraphChanges,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const versioningData = generateVersioningData(contractId);
    return NextResponse.json(versioningData);
  } catch (error: any) {
    console.error("Ошибка при получении данных версионности:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить данные версионности" },
      { status: 500 }
    );
  }
}


