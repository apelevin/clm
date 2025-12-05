"use client";

import { useState } from "react";
import { Paragraph } from "@/types/contract";
import { ParagraphChange } from "@/types/contract-versioning";
import ParagraphTooltip from "./versioning/ParagraphTooltip";

interface ContractViewerProps {
  paragraphs: Paragraph[];
  paragraphChanges?: ParagraphChange[];
  onParagraphClick?: (paragraphId: string, changeId?: string) => void;
}

export default function ContractViewer({ 
  paragraphs, 
  paragraphChanges = [],
  onParagraphClick 
}: ContractViewerProps) {
  const [hoveredParagraph, setHoveredParagraph] = useState<string | null>(null);

  const getParagraphStatus = (paragraphId: string): ParagraphChange | undefined => {
    return paragraphChanges.find(pc => pc.paragraphId === paragraphId);
  };

  const getStatusClasses = (status?: ParagraphChange["status"]) => {
    switch (status) {
      case "improved":
        return "bg-green-50 border-l-4 border-green-500 hover:bg-green-100 cursor-pointer";
      case "hasRisks":
        return "bg-yellow-50 border-l-4 border-yellow-500 hover:bg-yellow-100 cursor-pointer";
      case "newClause":
        return "bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100 cursor-pointer";
      default:
        return "hover:bg-gray-50";
    }
  };

  const getStatusIndicator = (status?: ParagraphChange["status"]) => {
    switch (status) {
      case "improved":
        return <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2" title="Улучшено"></span>;
      case "hasRisks":
        return <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2" title="Есть нерешённые риски"></span>;
      case "newClause":
        return <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" title="Новая формулировка"></span>;
      default:
        return null;
    }
  };

  const handleParagraphClick = (paragraphId: string) => {
    const change = getParagraphStatus(paragraphId);
    if (change && onParagraphClick) {
      onParagraphClick(paragraphId, change.changeId || undefined);
    }
  };

  return (
    <div
      className="h-full overflow-y-auto bg-white"
      data-scroll-container="true"
    >
      <div className="space-y-4">
        {paragraphs.map((paragraph) => {
          const change = getParagraphStatus(paragraph.id);
          const statusClasses = getStatusClasses(change?.status);
          const isHovered = hoveredParagraph === paragraph.id;

          return (
            <div
              key={paragraph.id}
              className="relative"
              onMouseEnter={() => setHoveredParagraph(paragraph.id)}
              onMouseLeave={() => setHoveredParagraph(null)}
            >
              <p
                id={paragraph.id}
                onClick={() => handleParagraphClick(paragraph.id)}
                className={`text-base font-normal leading-relaxed text-gray-900 transition-all duration-200 p-3 rounded ${statusClasses}`}
              >
                {getStatusIndicator(change?.status)}
                {paragraph.text}
              </p>
              {isHovered && change?.tooltip && (
                <ParagraphTooltip
                  reason={change.tooltip.reason}
                  changeId={change.tooltip.changeId}
                  riskId={change.tooltip.riskId}
                  onShowComparison={() => {
                    if (change.changeId && onParagraphClick) {
                      onParagraphClick(paragraph.id, change.changeId);
                    }
                  }}
                  onShowRisk={() => {
                    // Переход к риску можно реализовать позже
                    console.log("Show risk:", change.tooltip?.riskId);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

