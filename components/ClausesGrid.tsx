"use client";

import { ClauseListItem } from "@/app/api/clauses/route";
import ClauseCard from "./ClauseCard";

interface ClausesGridProps {
  clauses: ClauseListItem[];
  onClauseClick: (clause: ClauseListItem) => void;
}

export default function ClausesGrid({ clauses, onClauseClick }: ClausesGridProps) {
  if (clauses.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Формулировки не найдены
        </p>
        <p className="text-sm text-gray-600">
          Попробуйте изменить параметры поиска или фильтры.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clauses.map((clause) => (
        <ClauseCard
          key={clause.id}
          clause={clause}
          onClick={() => onClauseClick(clause)}
        />
      ))}
    </div>
  );
}


