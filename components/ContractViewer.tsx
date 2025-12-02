"use client";

import { Paragraph } from "@/types/contract";

interface ContractViewerProps {
  paragraphs: Paragraph[];
}

export default function ContractViewer({ paragraphs }: ContractViewerProps) {
  return (
    <div className="h-full bg-white p-6">
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

