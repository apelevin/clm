import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ParsedContract } from "@/types/contract";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const parsedDir = path.join(process.cwd(), "contracts", "parsed");
    const filePath = path.join(parsedDir, `${contractId}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Договор не найден" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed: ParsedContract = JSON.parse(fileContent);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(`Ошибка при загрузке договора ${params.id}:`, error);
    return NextResponse.json(
      { error: "Не удалось загрузить договор" },
      { status: 500 }
    );
  }
}

