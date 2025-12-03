"use client";

import { useRef } from "react";

function findScrollContainer(element: HTMLElement | null): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current) {
    if (
      current.dataset.scrollContainer === "true" ||
      current.classList.contains("overflow-y-auto")
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function useParagraphHighlighter() {
  const highlightedIdsRef = useRef<Set<string>>(new Set());

  const highlightParagraphs = (ids: string[]) => {
    highlightedIdsRef.current.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove("bg-yellow-200", "ring-2", "ring-yellow-400");
      }
    });

    highlightedIdsRef.current.clear();

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
    if (!element) {
      return;
    }

    const scrollContainer = findScrollContainer(element);
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const elementTopRelative =
        elementRect.top - containerRect.top + scrollContainer.scrollTop;
      const containerHeight = containerRect.height;
      const elementHeight = elementRect.height;
      const offset = 40;
      const targetScrollTop =
        elementTopRelative - offset - containerHeight / 2 + elementHeight / 2;

      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    } else {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  };

  return {
    highlightParagraphs,
    clearHighlight,
    scrollToParagraph,
  };
}
