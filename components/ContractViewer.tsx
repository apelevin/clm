"use client";

import { Paragraph } from "@/types/contract";

interface ContractViewerProps {
  paragraphs: Paragraph[];
}

export default function ContractViewer({ paragraphs }: ContractViewerProps) {
  return (
    <div
      className="h-full overflow-y-auto bg-white p-6"
      data-scroll-container="true"
    >
      <div className="space-y-4">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.id}
            id={paragraph.id}
            className="text-sm leading-relaxed transition-all duration-200"
          >
            {paragraph.text}
          </p>
        ))}
      </div>
    </div>
  );
}

