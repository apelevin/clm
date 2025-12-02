"use client";

import { useEffect, useRef } from "react";

export function useParagraphHighlighter() {
  const highlightedIdsRef = useRef<Set<string>>(new Set());

  const highlightParagraphs = (ids: string[]) => {
    // Снимаем предыдущую подсветку
    highlightedIdsRef.current.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove("bg-yellow-200", "ring-2", "ring-yellow-400");
      }
    });

    highlightedIdsRef.current.clear();

    // Добавляем новую подсветку
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add("bg-yellow-200", "ring-2", "ring-yellow-400");
        highlightedIdsRef.current.add(id);
      }
    });
  };

  const clearHighlight = () => {
    highlightedIdsRef.current.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove("bg-yellow-200", "ring-2", "ring-yellow-400");
      }
    });
    highlightedIdsRef.current.clear();
  };

  const scrollToParagraph = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return {
    highlightParagraphs,
    clearHighlight,
    scrollToParagraph,
  };
}

