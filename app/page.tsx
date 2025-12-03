"use client";

import Sidebar from "@/components/Sidebar";
import ContractsTable from "@/components/ContractsTable";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeItem="contracts" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Контракты
            </h1>
            <p className="text-base font-normal text-gray-600">
              Список всех договоров
            </p>
          </div>
          <ContractsTable />
        </div>
      </div>
    </div>
  );
}

